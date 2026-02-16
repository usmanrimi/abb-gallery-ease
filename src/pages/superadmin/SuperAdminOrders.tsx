import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import { ShoppingCart, Search, RefreshCw, Loader2 } from "lucide-react";

interface Order {
    id: string;
    custom_order_id: string | null;
    package_name: string;
    package_class: string | null;
    quantity: number;
    final_price: number;
    customer_name: string;
    customer_email: string;
    status: string;
    payment_status: string | null;
    created_at: string;
}

export default function SuperAdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("orders").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally { setLoading(false); }
    };

    const filteredOrders = orders.filter((o) => {
        const matchesSearch = o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.package_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            pending_payment: { variant: "outline", label: "Pending Payment" },
            waiting_for_price: { variant: "outline", label: "Waiting for Price" },
            price_sent: { variant: "secondary", label: "Price Sent" },
            paid: { variant: "default", label: "Paid" },
            processing: { variant: "secondary", label: "Processing" },
            ready_for_delivery: { variant: "default", label: "Ready" },
            out_for_delivery: { variant: "default", label: "Out for Delivery" },
            delivered: { variant: "default", label: "Delivered" },
            cancelled: { variant: "destructive", label: "Cancelled" },
        };
        const c = config[status] || { variant: "outline" as const, label: status };
        return <Badge variant={c.variant}>{c.label}</Badge>;
    };

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold">All Orders</h1>
                        <p className="text-muted-foreground">View all orders across the platform ({orders.length} total)</p>
                    </div>
                    <Button onClick={fetchOrders} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by name, email, or package..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending_payment">Pending Payment</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map((order) => (
                            <Card key={order.id}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{order.package_name}</span>
                                                {order.package_class && <Badge variant="outline">{order.package_class}</Badge>}
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{order.customer_name}</span>
                                                <span>{order.customer_email}</span>
                                                <span className="font-medium text-primary">{formatPrice(order.final_price)}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
