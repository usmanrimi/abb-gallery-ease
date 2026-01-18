import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle2, Truck, ChevronRight, MessageCircle, Loader2 } from "lucide-react";
import { formatPrice } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OrderChat } from "@/components/order/OrderChat";
import { PaymentInstructions } from "@/components/order/PaymentInstructions";

interface Order {
  id: string;
  package_name: string;
  package_class: string | null;
  quantity: number;
  total_price: number;
  final_price: number;
  admin_set_price: number | null;
  status: string;
  created_at: string;
  admin_response: string | null;
  custom_request: string | null;
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    variant: "secondary" as const,
    description: "We're reviewing your order",
  },
  processing: {
    label: "Processing",
    icon: Package,
    variant: "default" as const,
    description: "Your order is being prepared",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    variant: "default" as const,
    description: "Payment confirmed",
  },
  delivered: {
    label: "Delivered",
    icon: Truck,
    variant: "outline" as const,
    description: "Order completed",
  },
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayPrice = (order: Order) => {
    return order.admin_set_price || order.final_price;
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your orders</h1>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">My Orders</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display">My Orders</h1>
          <p className="mt-2 text-muted-foreground">
            Track and manage your orders
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                Start shopping to see your orders here
              </p>
              <Link to="/categories">
                <Button>Browse Packages</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = status.icon;
              const displayPrice = getDisplayPrice(order);

              return (
                <Card
                  key={order.id}
                  variant="interactive"
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">
                            {order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{order.package_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.package_class ? `${order.package_class} Class • ` : ""}Qty: {order.quantity}
                        </p>
                        {order.custom_request && (
                          <p className="text-sm text-primary mt-1">Custom Request: {order.custom_request}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Ordered on{" "}
                          {new Date(order.created_at).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>

                        {order.admin_response && (
                          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-sm font-medium text-primary">Admin Response:</p>
                            <p className="text-sm">{order.admin_response}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold text-primary">{formatPrice(displayPrice)}</p>
                          {order.admin_set_price && (
                            <p className="text-xs text-success">Price confirmed by admin</p>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Details & Chat
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2">{order.package_name}</h4>
                                {order.package_class && (
                                  <p className="text-sm text-muted-foreground">Class: {order.package_class}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                                <p className="font-semibold text-primary mt-2">{formatPrice(displayPrice)}</p>
                              </div>

                              {/* Payment Instructions */}
                              <PaymentInstructions amount={displayPrice} />

                              {/* Chat */}
                              <OrderChat orderId={order.id} isAdmin={false} />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          {Object.entries(statusConfig).map(([key, config], index) => {
                            const Icon = config.icon;
                            const statusOrder = ["pending", "processing", "confirmed", "delivered"];
                            const currentIndex = statusOrder.indexOf(order.status);
                            const isActive = currentIndex >= index;
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                {index < Object.keys(statusConfig).length - 1 && (
                                  <div
                                    className={`h-0.5 w-8 sm:w-12 ${
                                      currentIndex > index
                                        ? "bg-primary"
                                        : "bg-muted"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {status.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
