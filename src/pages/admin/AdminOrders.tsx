import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import { ShoppingCart, MessageSquare, Search, Calendar, RefreshCw, DollarSign } from "lucide-react";
import { OrderChat } from "@/components/order/OrderChat";

interface Order {
  id: string;
  user_id: string;
  package_name: string;
  package_class: string | null;
  quantity: number;
  notes: string | null;
  custom_request: string | null;
  total_price: number;
  final_price: number;
  admin_set_price: number | null;
  discount_amount: number;
  payment_method: string;
  installment_plan: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRespond = async () => {
    if (!selectedOrder) return;
    
    setIsSubmitting(true);
    try {
      const updateData: any = {
        admin_response: response,
        status: newStatus || selectedOrder.status,
      };

      // If custom price is set, add it to the update
      if (customPrice && parseFloat(customPrice) > 0) {
        updateData.admin_set_price = parseFloat(customPrice);
      }

      // Update order with response, status, and potentially custom price
      const { error: orderError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      // Create notification for customer
      let notificationMessage = response || `Your order status has been updated to ${newStatus || selectedOrder.status}`;
      if (customPrice && parseFloat(customPrice) > 0) {
        notificationMessage = `Your order has been priced at ${formatPrice(parseFloat(customPrice))}. ${response || "Please proceed with payment."}`;
      }

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: selectedOrder.user_id,
          order_id: selectedOrder.id,
          title: customPrice ? `Price Set: ${selectedOrder.package_name}` : `Order Update: ${selectedOrder.package_name}`,
          message: notificationMessage,
        });

      if (notifError) throw notifError;

      toast({
        title: "Response sent",
        description: "Customer has been notified",
      });

      setSelectedOrder(null);
      setResponse("");
      setNewStatus("");
      setCustomPrice("");
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error sending response",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.package_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "secondary",
      confirmed: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders and respond to inquiries</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or package..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || statusFilter !== "all"
                ? "No orders match your search criteria."
                : "You haven't received any orders yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{order.package_name}</h3>
                          {order.package_class && (
                            <p className="text-sm text-muted-foreground">Class: {order.package_class}</p>
                          )}
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Customer:</span>{" "}
                          <span className="font-medium">{order.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          <span className="font-medium">{order.customer_email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">WhatsApp:</span>{" "}
                          <span className="font-medium">{order.customer_whatsapp}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>{" "}
                          <span className="font-medium">{order.quantity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment:</span>{" "}
                          <span className="font-medium">{order.payment_method}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>{" "}
                          <span className="font-medium text-primary">
                            {formatPrice(order.admin_set_price || order.final_price)}
                          </span>
                          {order.admin_set_price && (
                            <span className="ml-1 text-xs text-success">(Custom)</span>
                          )}
                        </div>
                      </div>
                      {order.notes && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Notes:</span> {order.notes}
                        </p>
                      )}
                      {order.custom_request && (
                        <div className="p-3 mt-2 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-sm font-medium text-primary">Custom Request:</p>
                          <p className="text-sm">{order.custom_request}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString("en-NG", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setResponse(order.admin_response || "");
                              setNewStatus(order.status);
                              setCustomPrice(order.admin_set_price?.toString() || "");
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Respond
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Respond to Order</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-4">
                              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                <p className="font-medium">{order.package_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Customer: {order.customer_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Current Price: {formatPrice(order.final_price)}
                                </p>
                                {order.custom_request && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs text-primary font-medium">Custom Request:</p>
                                    <p className="text-sm">{order.custom_request}</p>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Update Status</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Custom Price Setting - especially for Custom orders */}
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Set Final Price (₦)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="Enter final price..."
                                  value={customPrice}
                                  onChange={(e) => setCustomPrice(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Set a custom price for this order. Customer will be notified.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label>Message to Customer</Label>
                                <Textarea
                                  placeholder="Enter your response..."
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  rows={4}
                                />
                              </div>

                              <Button
                                className="w-full"
                                onClick={handleRespond}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "Sending..." : "Send Response"}
                              </Button>
                            </div>

                            {/* Chat Section */}
                            <div>
                              <OrderChat orderId={order.id} isAdmin={true} />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
