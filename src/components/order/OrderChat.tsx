import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  message: string | null;
  is_admin: boolean;
  sender_role: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface OrderChatProps {
  orderId: string;
  isAdmin?: boolean;
}

export function OrderChat({ orderId, isAdmin = false }: OrderChatProps) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      const msgs = (data || []) as Message[];
      setMessages(msgs);
      messageIdsRef.current = new Set(msgs.map((m) => m.id));
      scrollToBottom();

      // Mark unread messages as read
      if (user) {
        const unreadIds = msgs
          .filter((m) => !m.is_read && m.sender_id !== user.id)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from("order_messages")
            .update({ is_read: true })
            .in("id", unreadIds);
        }
      }
    } catch (err) {
      console.error("Error in fetchMessages:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, user, scrollToBottom]);

  useEffect(() => {
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Deduplicate: only add if we haven't seen this ID
          if (!messageIdsRef.current.has(newMsg.id)) {
            messageIdsRef.current.add(newMsg.id);
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();

            // Auto-mark as read if it's not from current user
            if (user && newMsg.sender_id !== user.id) {
              supabase
                .from("order_messages")
                .update({ is_read: true })
                .eq("id", newMsg.id)
                .then();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchMessages, scrollToBottom, user]);

  const sendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("order_messages").insert({
        order_id: orderId,
        sender_id: user.id,
        message: trimmed,
        is_admin: isAdmin,
        sender_role: role || "customer",
        image_url: null,
        is_read: false,
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        return;
      }

      setNewMessage("");
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload an image (JPEG, PNG, WebP, GIF) or video (MP4, MOV)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${orderId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      // Send as a message with the image
      const { error: msgError } = await supabase.from("order_messages").insert({
        order_id: orderId,
        sender_id: user.id,
        message: null,
        is_admin: isAdmin,
        sender_role: role || "customer",
        image_url: publicUrl,
        is_read: false,
      });

      if (msgError) throw msgError;

      toast.success("File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] border rounded-lg">
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isOwn
                        ? "bg-primary text-primary-foreground"
                        : msg.is_admin
                          ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                          : "bg-muted"
                      }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.is_admin ? "Admin" : "Customer"}
                      </p>
                    )}
                    {msg.image_url && (
                      <div className="mb-1">
                        {msg.image_url.match(/\.(mp4|mov|webm)$/i) ? (
                          <video
                            src={msg.image_url}
                            controls
                            className="max-w-full rounded max-h-48"
                          />
                        ) : (
                          <img
                            src={msg.image_url}
                            alt="Attachment"
                            className="max-w-full rounded max-h-48 cursor-pointer"
                            onClick={() => window.open(msg.image_url!, "_blank")}
                          />
                        )}
                      </div>
                    )}
                    {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[10px] opacity-60">{formatTime(msg.created_at)}</span>
                      {isOwn && (
                        <Check
                          className={`h-3 w-3 ${msg.is_read ? "text-blue-400" : "opacity-50"
                            }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-3 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Upload proof/image"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
