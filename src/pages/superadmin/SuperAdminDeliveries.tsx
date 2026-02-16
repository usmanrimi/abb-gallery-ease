import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Search, RefreshCw, Loader2 } from "lucide-react";

interface Delivery {
    id: string;
    order_id: string;
    custom_order_id: string | null;
    customer_name: string | null;
    customer_whatsapp: string | null;
    package_name: string | null;
    delivery_date: string | null;
    delivery_time: string | null;
    status: string;
    created_at: string;
}

export default function SuperAdminDeliveries() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => { fetchDeliveries(); }, []);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("deliveries").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            setDeliveries(data || []);
        } catch (err) {
            console.error("Error fetching deliveries:", err);
        } finally { setLoading(false); }
    };

    const filtered = deliveries.filter((d) =>
        statusFilter === "all" || d.status === statusFilter
    );

    const getStatusBadge = (status: string) => {
        const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            ready: { variant: "outline", label: "Ready" },
            out_for_delivery: { variant: "secondary", label: "Out for Delivery" },
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
                        <h1 className="text-2xl font-display font-bold">Deliveries</h1>
                        <p className="text-muted-foreground">Track all deliveries ({deliveries.length} total)</p>
                    </div>
                    <Button onClick={fetchDeliveries} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Truck className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No deliveries found</h3>
                            <p className="text-muted-foreground">Deliveries are auto-created when orders move to processing/paid status.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((d) => (
                            <Card key={d.id}>
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{d.package_name || "Unknown Package"}</span>
                                                {getStatusBadge(d.status)}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{d.customer_name || "N/A"}</span>
                                                {d.delivery_date && <span>📅 {d.delivery_date}</span>}
                                                {d.delivery_time && <span>🕐 {d.delivery_time}</span>}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(d.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
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
