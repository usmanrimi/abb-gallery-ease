import { useState, useEffect, useCallback, useRef } from "react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Send,
    MessageCircle,
    Loader2,
    Image as ImageIcon,
    User,
    Shield,
    Eye,
    CheckCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface Conversation {
    user_id: string;
    full_name: string | null;
    email: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    assignedAdmin: string | null;
    assignedAdminId: string | null;
}

export default function SuperAdminChat() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedUserIdRef = useRef<string | null>(null);

    // Keep ref in sync
    useEffect(() => {
        selectedUserIdRef.current = selectedUserId;
    }, [selectedUserId]);

    // Fetch all conversations (grouped by user_id)
    const fetchConversations = useCallback(async () => {
        try {
            const { data: allMessages, error } = await supabase
                .from("chat_messages")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Group by user_id
            const grouped = new Map<string, ChatMessage[]>();
            (allMessages || []).forEach((msg) => {
                const key = msg.user_id || msg.sender_id;
                if (!key) return;
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(msg);
            });

            // Get all unique user_ids (customers + admins who sent)
            const allUserIds = new Set<string>();
            (allMessages || []).forEach((msg) => {
                if (msg.user_id) allUserIds.add(msg.user_id);
                if (msg.sender_id) allUserIds.add(msg.sender_id);
            });

            const { data: profiles } = await (supabase
                .from("profiles") as any)
                .select("id, full_name, email, role")
                .in("id", Array.from(allUserIds));

            const profileMap = new Map<
                string,
                { full_name: string | null; email: string | null; role: string | null }
            >();
            (profiles || []).forEach((p: any) =>
                profileMap.set(p.id, {
                    full_name: p.full_name,
                    email: p.email,
                    role: p.role || null,
                })
            );

            const customerUserIds = Array.from(grouped.keys()).filter((uid) => {
                const profile = profileMap.get(uid);
                // Show conversations from non-admin users (customers)
                return (
                    profile &&
                    profile.role !== "admin_ops" &&
                    profile.role !== "super_admin"
                );
            });

            const convos: Conversation[] = customerUserIds
                .map((uid) => {
                    const msgs = grouped.get(uid)!;
                    const latest = msgs[0];
                    const unread = msgs.filter(
                        (m) => !m.is_read && m.sender_role === "customer"
                    ).length;
                    const profile = profileMap.get(uid);

                    // Find assigned admin (last admin who sent a message in this conversation)
                    const lastAdminMsg = msgs.find((m) => m.sender_role === "admin");
                    let assignedAdmin: string | null = null;
                    let assignedAdminId: string | null = null;
                    if (lastAdminMsg?.sender_id) {
                        const adminProfile = profileMap.get(lastAdminMsg.sender_id);
                        assignedAdmin = adminProfile?.full_name || adminProfile?.email || "Admin";
                        assignedAdminId = lastAdminMsg.sender_id;
                    }

                    return {
                        user_id: uid,
                        full_name: profile?.full_name || "Unknown User",
                        email: profile?.email || "",
                        lastMessage:
                            latest.message || (latest.image_url ? "📷 Image" : ""),
                        lastMessageTime: latest.created_at,
                        unreadCount: unread,
                        assignedAdmin,
                        assignedAdminId,
                    };
                })
                .sort(
                    (a, b) =>
                        new Date(b.lastMessageTime).getTime() -
                        new Date(a.lastMessageTime).getTime()
                );

            setConversations(convos);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch messages for selected user
    const fetchMessages = useCallback(async () => {
        if (!selectedUserId) return;
        try {
            const { data, error } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("user_id", selectedUserId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Mark unread messages as read
            const unreadIds = (data || [])
                .filter((m) => !m.is_read && m.sender_role === "customer")
                .map((m) => m.id);
            if (unreadIds.length) {
                await supabase
                    .from("chat_messages")
                    .update({ is_read: true })
                    .in("id", unreadIds);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, [selectedUserId]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Subscribe to realtime
    useEffect(() => {
        console.log("Subscribing to superadmin global chat realtime...");
        const channel = supabase
            .channel("superadmin_chat_all_messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    console.log("SuperAdmin realtime message received:", newMsg);

                    const currentSelectedId = selectedUserIdRef.current;
                    if (currentSelectedId && (newMsg.user_id === currentSelectedId || newMsg.sender_id === currentSelectedId)) {
                        setMessages((prev) => {
                            // Deduplicate
                            if (prev.some((m) => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });

                        // Mark as read if super admin has this convo open and it's from customer
                        if (newMsg.sender_role === "customer") {
                            supabase
                                .from("chat_messages")
                                .update({ is_read: true })
                                .eq("id", newMsg.id)
                                .then(({ error }) => {
                                    if (error) console.error("Error marking message as read:", error);
                                });
                        }
                    }

                    // Always refresh conversations list to update oversight list
                    fetchConversations();
                }
            )
            .subscribe((status) => {
                console.log("SuperAdmin chat subscription status:", status);
            });

        return () => {
            console.log("Unsubscribing from superadmin chat realtime");
            supabase.removeChannel(channel);
        };
    }, [fetchConversations]); // Removed selectedUserId to keep subscription stable

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector(
                "[data-radix-scroll-area-viewport]"
            );
            if (viewport) {
                setTimeout(() => {
                    viewport.scrollTop = viewport.scrollHeight;
                }, 100);
            }
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !user || !selectedUserId) return;

        const messageText = newMessage.trim();
        setNewMessage(""); // Clear early
        setSending(true);
        setMessageSent(false);

        try {
            const { data, error } = await supabase.from("chat_messages").insert({
                user_id: selectedUserId,
                sender_id: user.id,
                message: messageText,
                sender_role: "admin",
                is_read: false,
            }).select().single();

            if (error) throw error;

            if (data) {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });
            }

            setMessageSent(true);
            setTimeout(() => setMessageSent(false), 2000);

            // Refresh conversations list
            fetchConversations();
        } catch (error: any) {
            setNewMessage(messageText); // Restore on error
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file || !user || !selectedUserId) return;
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
            const {
                data: { publicUrl },
            } = supabase.storage.from("uploads").getPublicUrl(filePath);
            const { error } = await supabase.from("chat_messages").insert({
                user_id: selectedUserId,
                sender_id: user.id,
                image_url: publicUrl,
                sender_role: "admin",
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

    const selectedConvo = conversations.find(
        (c) => c.user_id === selectedUserId
    );

    return (
        <SuperAdminLayout>
            <div className="flex flex-col h-[calc(100vh-120px)]">
                <div className="mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Global Chat Monitor</h1>
                            <p className="text-muted-foreground text-sm">
                                Oversee all customer-admin conversations in real-time
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
                    {/* Conversations List */}
                    <Card className="md:col-span-1 flex flex-col min-h-0">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                All Conversations
                                {conversations.length > 0 && (
                                    <Badge variant="secondary" className="ml-auto">
                                        {conversations.length}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <p className="text-sm text-muted-foreground">
                                        No conversations yet
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1 px-2 pb-2">
                                    {conversations.map((convo) => (
                                        <button
                                            key={convo.user_id}
                                            onClick={() => setSelectedUserId(convo.user_id)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUserId === convo.user_id
                                                ? "bg-primary/10 border border-primary/20"
                                                : "hover:bg-muted"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {convo.full_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {convo.lastMessage}
                                                        </p>
                                                        {convo.assignedAdmin && (
                                                            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                                                                <Shield className="h-2.5 w-2.5" />
                                                                {convo.assignedAdmin}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(convo.lastMessageTime).toLocaleDateString(
                                                            "en-NG",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                            }
                                                        )}
                                                    </span>
                                                    {convo.unreadCount > 0 && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="text-[10px] h-5 min-w-[20px] justify-center"
                                                        >
                                                            {convo.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </Card>

                    {/* Chat Messages */}
                    <Card className="md:col-span-2 flex flex-col min-h-0">
                        {selectedUserId ? (
                            <>
                                <CardHeader className="py-3 px-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {selectedConvo?.full_name || "Customer"}
                                                <span className="text-xs text-muted-foreground font-normal ml-1">
                                                    {selectedConvo?.email}
                                                </span>
                                            </CardTitle>
                                            {selectedConvo?.assignedAdmin && (
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    Handled by:{" "}
                                                    <span className="font-medium">
                                                        {selectedConvo.assignedAdmin}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">
                                            <Eye className="h-3 w-3 mr-1" />
                                            Oversight Mode
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-muted-foreground">
                                                No messages in this conversation
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {messages.map((msg) => {
                                                const isAdmin = msg.sender_role === "admin";
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex ${isAdmin ? "justify-end" : "justify-start"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${isAdmin
                                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                                : "bg-muted rounded-bl-md"
                                                                }`}
                                                        >
                                                            {/* Sender Badge */}
                                                            <p
                                                                className={`text-[10px] font-semibold mb-1 flex items-center gap-1 ${isAdmin
                                                                    ? "text-primary-foreground/70"
                                                                    : "text-muted-foreground"
                                                                    }`}
                                                            >
                                                                {isAdmin ? (
                                                                    <>
                                                                        <Shield className="h-2.5 w-2.5" /> Admin
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <User className="h-2.5 w-2.5" /> Customer
                                                                    </>
                                                                )}
                                                            </p>
                                                            {msg.image_url && (
                                                                <img
                                                                    src={msg.image_url}
                                                                    alt="Shared image"
                                                                    className="rounded-lg max-w-full mb-1 cursor-pointer"
                                                                    onClick={() =>
                                                                        window.open(msg.image_url!, "_blank")
                                                                    }
                                                                />
                                                            )}
                                                            {msg.message && (
                                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                                    {msg.message}
                                                                </p>
                                                            )}
                                                            <div className={`flex items-center gap-1.5 mt-1`}>
                                                                <p
                                                                    className={`text-[10px] ${isAdmin
                                                                        ? "text-primary-foreground/60"
                                                                        : "text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {new Date(
                                                                        msg.created_at
                                                                    ).toLocaleTimeString("en-NG", {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })}
                                                                </p>
                                                                {msg.is_read && isAdmin && (
                                                                    <CheckCheck
                                                                        className={`h-3 w-3 ${isAdmin
                                                                            ? "text-primary-foreground/60"
                                                                            : "text-blue-500"
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

                                <div className="p-3 border-t">
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
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Reply as Super Admin..."
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
                                            ) : messageSent ? (
                                                <CheckCheck className="h-4 w-4" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <Eye className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">
                                        Select a conversation to monitor
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        You can view and participate in any customer-admin chat
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
