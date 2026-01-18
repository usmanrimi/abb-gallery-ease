import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Send, Loader2, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: string;
  message: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface OrderChatProps {
  orderId: string;
  isAdmin?: boolean;
}

export function OrderChat({ orderId, isAdmin = false }: OrderChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
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
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(
          (m) => !m.is_read && m.sender_role !== (isAdmin ? "admin" : "customer")
        );
        if (unreadMessages.length > 0) {
          await supabase
            .from("order_messages")
            .update({ is_read: true })
            .in(
              "id",
              unreadMessages.map((m) => m.id)
            );
        }
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("order_messages").insert({
        order_id: orderId,
        sender_id: user.id,
        sender_role: isAdmin ? "admin" : "customer",
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Order Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage =
                  (isAdmin && message.sender_role === "admin") ||
                  (!isAdmin && message.sender_role === "customer");

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      isOwnMessage ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 text-sm",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Attachment"
                          className="max-w-[200px] rounded-lg mb-2"
                        />
                      )}
                      {message.message && <p>{message.message}</p>}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {format(new Date(message.created_at), "h:mm a")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t bg-muted/30">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
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
      </CardContent>
    </Card>
  );
}
