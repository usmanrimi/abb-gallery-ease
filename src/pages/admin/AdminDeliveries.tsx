import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Truck, Search, RefreshCw, Phone, MapPin, Calendar, Loader2, Package } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Delivery {
  id: string;
  order_id: string;
  custom_order_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  package_name: string;
  delivery_address: string | null;
  delivery_notes: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  status: string;
  created_at: string;
}

const statusOptions = [
  { value: "pending", label: "Pending Assignment", color: "bg-yellow-500" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

export default function AdminDeliveries() {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error: any) {
      console.error("Error fetching deliveries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, orderId: string, newStatus: string) => {
    try {
      // Update delivery status
      const { error: deliveryError } = await (supabase as any)
        .from("deliveries")
        .update({ status: newStatus })
        .eq("id", deliveryId);

      if (deliveryError) throw deliveryError;

      // Map delivery status to order status
      const orderStatusMap: Record<string, string> = {
        pending: "ready_for_delivery",
        scheduled: "ready_for_delivery",
        out_for_delivery: "ready_for_delivery",
        delivered: "delivered",
        cancelled: "cancelled",
      };

      // Update order status
      const { error: orderError } = await (supabase as any)
        .from("orders")
        .update({ status: orderStatusMap[newStatus] || newStatus })
        .eq("id", orderId);

      if (orderError) throw orderError;

      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, status: newStatus } : d))
      );

      toast({
        title: "Status updated",
        description: `Delivery marked as ${newStatus.replace("_", " ")}`,
      });

      // Audit log
      const delivery = deliveries.find(d => d.id === deliveryId);
      await logAction(
        `delivery_${newStatus}`,
        {
          actionType: `delivery_${newStatus}`,
          targetType: "delivery",
          targetId: deliveryId,
          details: `Delivery ${delivery?.custom_order_id || orderId} → ${newStatus.replace(/_/g, " ")}`,
        }
      );
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const updateDeliveryDate = async (deliveryId: string, orderId: string, date: string, time: string) => {
    try {
      const { error: deliveryError } = await (supabase as any)
        .from("deliveries")
        .update({
          delivery_date: date || null,
          delivery_time: time || null,
          status: "scheduled"
        })
        .eq("id", deliveryId);

      if (deliveryError) throw deliveryError;

      const { error: orderError } = await (supabase as any)
        .from("orders")
        .update({
          delivery_date: date || null,
          delivery_time: time || null
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      setDeliveries((prev) =>
        prev.map((d) => (d.id === deliveryId ? { ...d, delivery_date: date, delivery_time: time, status: "scheduled" } : d))
      );

      toast({
        title: "Delivery scheduled",
        description: `Order ${orderId.slice(0, 8)} set for ${date}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update delivery time",
        variant: "destructive",
      });
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.custom_order_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = statusOptions.find((s) => s.value === status);
    return (
      <Badge variant="outline" className="capitalize">
        <div className={`h-2 w-2 rounded-full mr-2 ${config?.color || "bg-gray-500"}`} />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Deliveries</h1>
            <p className="text-muted-foreground">Track and manage order deliveries</p>
          </div>
          <Button onClick={fetchDeliveries} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, order ID, or package..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Truck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deliveries found</h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery || statusFilter !== "all"
                  ? "No deliveries match your filters."
                  : "Deliveries will appear here when orders are ready for dispatch."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDeliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-primary font-semibold">
                              {delivery.custom_order_id || delivery.order_id.slice(0, 8).toUpperCase()}
                            </span>
                            {getStatusBadge(delivery.status)}
                          </div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {delivery.package_name}
                          </h3>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium">{delivery.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`https://wa.me/${delivery.customer_whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {delivery.customer_whatsapp}
                          </a>
                        </div>
                        {delivery.delivery_address && (
                          <div className="flex items-start gap-2 sm:col-span-2">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                            <span>{delivery.delivery_address}</span>
                          </div>
                        )}
                        {delivery.delivery_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {new Date(delivery.delivery_date).toLocaleDateString("en-NG")}
                              {delivery.delivery_time && ` at ${delivery.delivery_time}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {delivery.delivery_notes && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          <span className="font-medium">Notes:</span> {delivery.delivery_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          className="w-40 h-8 text-xs"
                          defaultValue={delivery.delivery_date || ""}
                          onChange={(e) => updateDeliveryDate(delivery.id, delivery.order_id, e.target.value, delivery.delivery_time || "")}
                        />
                        <Input
                          type="time"
                          className="w-32 h-8 text-xs"
                          defaultValue={delivery.delivery_time || ""}
                          onChange={(e) => updateDeliveryDate(delivery.id, delivery.order_id, delivery.delivery_date || "", e.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((status) => (
                          <Button
                            key={status.value}
                            variant={delivery.status === status.value ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => updateDeliveryStatus(delivery.id, delivery.order_id, status.value)}
                            disabled={delivery.status === status.value}
                          >
                            {status.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
