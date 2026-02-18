import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle2, Truck, ChevronRight, Loader2, CreditCard, Upload, Wallet, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: string;
  custom_order_id: string | null;
  package_name: string;
  package_class: string | null;
  quantity: number;
  total_price: number;
  final_price: number;
  admin_set_price: number | null;
  status: string;
  payment_status: string | null;
  payment_proof_url: string | null;
  created_at: string;
  admin_response: string | null;
  custom_request: string | null;
}

const statusConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  pending_payment: {
    label: "Pending Payment",
    icon: CreditCard,
    variant: "outline",
    description: "Complete payment to proceed",
  },
  waiting_for_price: {
    label: "Waiting for Price",
    icon: Clock,
    variant: "outline",
    description: "Admin is reviewing your custom request",
  },
  price_sent: {
    label: "Price Sent",
    icon: CreditCard,
    variant: "secondary",
    description: "Review the price and make payment",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    variant: "default",
    description: "Payment confirmed, preparing your order",
  },
  processing: {
    label: "Processing",
    icon: Package,
    variant: "secondary",
    description: "Your order is being prepared",
  },
  ready_for_delivery: {
    label: "Ready for Delivery",
    icon: Truck,
    variant: "default",
    description: "Your order is ready for dispatch",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    variant: "default",
    description: "Your order is on its way!",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    variant: "default",
    description: "Order completed",
  },
  cancelled: {
    label: "Cancelled",
    icon: Clock,
    variant: "destructive",
    description: "Order was cancelled",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "outline",
    description: "Awaiting processing",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    variant: "default",
    description: "Payment confirmed",
  },
};

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

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

  const canPayNow = (order: Order) => {
    return (
      order.admin_set_price &&
      order.admin_set_price > 0 &&
      (order.status === "price_sent" || order.status === "pending_payment" || order.status === "waiting_for_price") &&
      order.payment_status !== "paid" &&
      order.payment_status !== "proof_uploaded"
    );
  };

  const handlePayNow = async (order: Order) => {
    if (!user) return;
    setPayingOrderId(order.id);
    try {
      const amount = order.admin_set_price || order.final_price;
      const { data, error } = await supabase.functions.invoke("paystack", {
        body: {
          action: "initialize",
          email: user.email,
          amount,
          orderId: order.id,
          callback_url: `${window.location.origin}/order-confirmation`,
          metadata: {
            customer_name: user.user_metadata?.full_name || "",
            custom_order_id: order.custom_order_id || "",
            package: order.package_name,
          },
        },
      });

      if (error || !data?.authorization_url) {
        toast({
          title: "Card payment unavailable",
          description: data?.message || "Please try again later.",
          variant: "default",
        });
        return;
      }

      window.location.href = data.authorization_url;
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setPayingOrderId(null);
    }
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
              const showPaymentUpload =
                (order.status === "pending_payment" || order.status === "processing" || order.status === "price_sent") &&
                !order.payment_proof_url;

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
                          <span className="font-mono text-sm text-primary font-semibold">
                            {order.custom_order_id || order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {order.payment_status === "proof_uploaded" && (
                            <Badge variant="outline" className="text-xs">
                              <Upload className="h-3 w-3 mr-1" />
                              Proof Sent
                            </Badge>
                          )}
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

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold text-primary">{formatPrice(displayPrice)}</p>
                          {order.admin_set_price && (
                            <p className="text-xs text-success">Price confirmed by admin</p>
                          )}
                        </div>
                        {canPayNow(order) && (
                          <Button
                            size="sm"
                            onClick={() => handlePayNow(order)}
                            disabled={payingOrderId === order.id}
                            className="whitespace-nowrap"
                          >
                            {payingOrderId === order.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Wallet className="h-4 w-4 mr-1" />
                            )}
                            Pay Now
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 rounded-lg bg-muted/50">
                                <p className="font-mono text-sm text-primary font-semibold mb-2">
                                  {order.custom_order_id || order.id.slice(0, 8).toUpperCase()}
                                </p>
                                <h4 className="font-semibold mb-2">{order.package_name}</h4>
                                {order.package_class && (
                                  <p className="text-sm text-muted-foreground">Class: {order.package_class}</p>
                                )}
                                <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                                {order.custom_request && (
                                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-xs font-medium">Custom Request:</p>
                                    <p className="text-sm">{order.custom_request}</p>
                                  </div>
                                )}
                                <p className="font-semibold text-primary mt-2">{formatPrice(displayPrice)}</p>
                              </div>



                              {/* Waiting for admin price message */}
                              {order.status === "waiting_for_price" && (
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  <p className="text-sm text-amber-700 text-center">
                                    Admin is reviewing your custom request. You'll receive the final price soon.
                                  </p>
                                </div>
                              )}

                              {/* Proof uploaded message */}
                              {order.payment_status === "proof_uploaded" && (
                                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <p className="text-sm text-blue-700 text-center">
                                    Payment proof uploaded. Admin will verify and confirm shortly.
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-6 pt-4 border-t">
                      {(() => {
                        const progressSteps = [
                          { key: "paid", label: "Paid", icon: CreditCard },
                          { key: "processing", label: "Processing", icon: Package },
                          { key: "ready_for_delivery", label: "Ready", icon: Truck },
                          { key: "delivered", label: "Delivered", icon: CheckCircle2 },
                        ];
                        const statusOrder = ["pending", "pending_payment", "waiting_for_price", "price_sent", "paid", "processing", "ready_for_delivery", "out_for_delivery", "delivered"];
                        const currentIdx = statusOrder.indexOf(order.status);
                        return (
                          <div className="flex items-center gap-1">
                            {progressSteps.map((step, index) => {
                              const stepIdx = statusOrder.indexOf(step.key);
                              const isActive = currentIdx >= stepIdx;
                              const StepIcon = step.icon;
                              return (
                                <div key={step.key} className="flex items-center gap-1">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                      <StepIcon className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground hidden sm:block">{step.label}</span>
                                  </div>
                                  {index < progressSteps.length - 1 && (
                                    <div className={`h-0.5 w-6 sm:w-10 ${currentIdx > stepIdx ? "bg-primary" : "bg-muted"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
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
