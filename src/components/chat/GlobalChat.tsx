import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
    id: string;
    user_id: string | null;
    sender_id: string | null;
    message: string | null;
    image_url: string | null;
    sender_role: string;
    is_read: boolean;
    created_at: string;
}

export function GlobalChat() {
    const { user, role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = role === "admin_ops" || role === "super_admin";
    const senderRole = isAdmin ? "admin" : "customer";

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("chat_messages")
                .select("*")
                .or(`user_id.eq.${user.id},sender_id.eq.${user.id}`)
                .order("created_at", { ascending: true })
                .limit(100);

            if (error) throw error;
            setMessages(data || []);

            // Mark messages as read
            if (isOpen && data?.length) {
                const unreadIds = data
                    .filter(m => !m.is_read && m.sender_id !== user.id)
                    .map(m => m.id);
                if (unreadIds.length) {
                    await supabase
                        .from("chat_messages")
                        .update({ is_read: true })
                        .in("id", unreadIds);
                }
            }
        } catch (error) {
            console.error("Error fetching chat messages:", error);
        } finally {
            setLoading(false);
        }
    }, [user, isOpen]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const { count, error } = await supabase
                .from("chat_messages")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("is_read", false)
                .neq("sender_id", user.id);

            if (!error) {
                setUnreadCount(count || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchMessages();
            fetchUnreadCount();
        }
    }, [user, fetchMessages, fetchUnreadCount]);

    // Subscribe to realtime updates
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel("chat_messages_realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    // Only add if relevant to this user
                    if (newMsg.user_id === user.id || newMsg.sender_id === user.id) {
                        setMessages(prev => [...prev, newMsg]);
                        if (newMsg.sender_id !== user.id && !isOpen) {
                            setUnreadCount(prev => prev + 1);
                        }
                        // Mark as read if chat is open
                        if (isOpen && newMsg.sender_id !== user.id) {
                            supabase
                                .from("chat_messages")
                                .update({ is_read: true })
                                .eq("id", newMsg.id);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, isOpen]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    // Mark all as read when opening
    useEffect(() => {
        if (isOpen && user) {
            setUnreadCount(0);
            fetchMessages();
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !user) return;
        setSending(true);
        try {
            const { error } = await supabase.from("chat_messages").insert({
                user_id: user.id,
                sender_id: user.id,
                message: newMessage.trim(),
                sender_role: senderRole,
                is_read: false,
            });

            if (error) throw error;
            setNewMessage("");
        } catch (error: any) {
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB");
            return;
        }

        setSending(true);
        try {
            const fileExt = file.name.split(".").pop();
            const filePath = `chat/${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("uploads")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("uploads")
                .getPublicUrl(filePath);

            const { error } = await supabase.from("chat_messages").insert({
                user_id: user.id,
                sender_id: user.id,
                image_url: publicUrl,
                sender_role: senderRole,
                is_read: false,
            });

            if (error) throw error;
        } catch (error: any) {
            toast.error("Failed to send image");
        } finally {
            setSending(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                    aria-label="Chat with Admin"
                >
                    <MessageCircle className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] rounded-2xl bg-background border shadow-2xl flex flex-col overflow-hidden animate-scale-in"
                    style={{ height: "500px", maxHeight: "calc(100vh - 120px)" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            <div>
                                <h3 className="font-semibold text-sm">Chat with Admin</h3>
                                <p className="text-xs opacity-80">We typically reply within hours</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                        {loading && messages.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No messages yet. Send a message to get started!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe
                                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                                        : "bg-muted rounded-bl-md"
                                                    }`}
                                            >
                                                {msg.image_url && (
                                                    <img
                                                        src={msg.image_url}
                                                        alt="Shared image"
                                                        className="rounded-lg max-w-full mb-1 cursor-pointer"
                                                        onClick={() => window.open(msg.image_url!, "_blank")}
                                                    />
                                                )}
                                                {msg.message && (
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                                )}
                                                <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString("en-NG", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 border-t bg-background">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="h-9 text-sm"
                                disabled={sending}
                            />
                            <Button
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || sending}
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
