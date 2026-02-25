import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import {
  Package as PackageIcon,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  Loader2,
  Activity,
  RefreshCw,
  Box,
  FolderOpen,
  Settings as SettingsIcon,
  Clock,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  pendingDeliveries: number;
  waitingForPrice: number;
  pendingPayments: number;
}

interface RecentOrder {
  id: string;
  custom_order_id: string | null;
  package_name: string;
  customer_name: string;
  final_price: number;
  status: string;
  payment_status: string | null;
  created_at: string;
}

interface ActivityLog {
  id: string;
  actor_email: string;
  action: string;
  details: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    pendingDeliveries: 0,
    waitingForPrice: 0,
    pendingPayments: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all orders for stats
      const { data: orders } = await supabase
        .from("orders")
        .select("id, final_price, status, payment_status, package_name, customer_name, created_at, user_id, custom_order_id")
        .order("created_at", { ascending: false });

      // Fetch recent relative activities
      const { data: logData } = await supabase
        .from("audit_log")
        .select("id, actor_id, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (logData) {
        setActivities(logData.map(log => ({
          ...log,
          actor_email: (log as any).actor_email || log.actor_id.slice(0, 8)
        })) as ActivityLog[]);
      }

      if (orders) {
        // Define paid statuses
        const paidStatuses = ["paid", "confirmed", "delivered", "processing", "ready_for_delivery", "out_for_delivery"];

        // Calculate stats - only count orders with paid status for revenue
        const paidOrders = orders.filter(o =>
          paidStatuses.includes(o.status) || o.payment_status === "paid"
        );
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.final_price) || 0), 0);

        const uniqueCustomers = new Set(orders.map(o => o.user_id)).size;
        const pendingOrders = orders.filter(o =>
          o.status === "ready_for_delivery" ||
          o.status === "out_for_delivery" ||
          o.payment_status === "proof_uploaded"
        ).length;

        const waitingForPrice = orders.filter(o => o.status === "waiting_for_price").length;
        const pendingPayments = orders.filter(o => o.status === "pending_payment" || o.status === "pending").length;

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          activeCustomers: uniqueCustomers,
          pendingDeliveries: pendingOrders,
          waitingForPrice,
          pendingPayments,
        });

        // Set recent orders (top 5)
        setRecentOrders(orders.slice(0, 5).map(o => ({
          ...o,
          custom_order_id: o.custom_order_id || o.id.slice(0, 8).toUpperCase(),
        })));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending_payment: { variant: "outline", label: "Pending Payment" },
      waiting_for_price: { variant: "outline", label: "Waiting for Price" },
      price_sent: { variant: "secondary", label: "Price Sent" },
      paid: { variant: "default", label: "Paid" },
      processing: { variant: "secondary", label: "Processing" },
      ready_for_delivery: { variant: "default", label: "Ready" },
      out_for_delivery: { variant: "default", label: "Out for Delivery" },
      delivered: { variant: "default", label: "Delivered" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      pending: { variant: "outline", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
    };
    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Active Customers",
      value: stats.activeCustomers.toString(),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Waiting for Price",
      value: stats.waitingForPrice.toString(),
      icon: Clock,
      color: "text-red-500",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments.toString(),
      icon: CreditCard,
      color: "text-amber-500",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your admin panel. Here's your store overview.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                  <p className="font-medium">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-mono text-[10px] text-primary mb-1">
                          #{order.custom_order_id || order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm font-semibold">{order.package_name}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-sm font-black text-primary">{formatPrice(order.final_price)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mb-4 opacity-50" />
                  <p className="font-medium">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Box className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.action.split("_").map(w => w.charAt(0) + w.slice(1)).join(" ")}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{activity.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-medium text-primary bg-primary/5 px-1.5 rounded">{activity.actor_email}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Packages", icon: PackageIcon, href: "/admin/packages" },
            { title: "Customers", icon: Users, href: "/admin/customers" },
            { title: "Categories", icon: FolderOpen, href: "/admin/categories" },
            { title: "Settings", icon: SettingsIcon, href: "/admin/settings" },
          ].map((action) => (
            <Link key={action.href} to={action.href}>
              <Card variant="interactive" className="h-full border-border/50 hover:border-primary/50 transition-all hover:bg-primary/[0.02]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm">{action.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
