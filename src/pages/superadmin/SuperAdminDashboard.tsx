import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import {
  Users,
  ShoppingCart,
  Truck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CreditCard,
  Loader2,
  Activity,
  RefreshCw,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";

interface DashboardMetrics {
  totalCustomers: number;
  activeCustomers7d: number;
  activeBuyers30d: number;
  totalRevenue: number;
  ordersToday: number;
  ordersThisWeek: number;
  pendingPayments: number;
  waitingForPrice: number;
  deliveriesPending: number;
}

interface Alert {
  type: "warning" | "info";
  message: string;
  count: number;
}

interface ActivityLog {
  id: string;
  actor_email: string;
  action: string;
  details: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    activeCustomers7d: 0,
    activeBuyers30d: 0,
    totalRevenue: 0,
    ordersToday: 0,
    ordersThisWeek: 0,
    pendingPayments: 0,
    waitingForPrice: 0,
    deliveriesPending: 0,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data } = await supabase
        .from("audit_log")
        .select("id, actor_id, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setActivities(data.map(log => ({
          ...log,
          actor_email: (log as any).actor_email || (log as any).actor_id?.slice(0, 8) || "System"
        })) as ActivityLog[]);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000).toISOString();

      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, final_price, status, payment_status, user_id, created_at");

      // Fetch profiles count
      const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      // Fetch deliveries
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("id, status");

      if (orders) {
        const paidStatuses = ["paid", "confirmed", "delivered", "processing", "ready_for_delivery", "out_for_delivery"];
        const paidOrders = orders.filter(o => paidStatuses.includes(o.status) || o.payment_status === "paid");

        // Active customers (ordered in last 7 days)
        const activeCustomers7d = new Set(
          orders.filter(o => o.created_at >= sevenDaysAgo).map(o => o.user_id)
        ).size;

        // Active buyers (paid in last 30 days)
        const activeBuyers30d = new Set(
          paidOrders.filter(o => o.created_at >= thirtyDaysAgo).map(o => o.user_id)
        ).size;

        const ordersToday = orders.filter(o => o.created_at >= todayStart).length;
        const ordersThisWeek = orders.filter(o => o.created_at >= weekStart).length;
        const pendingPayments = orders.filter(o =>
          o.status === "pending_payment" || o.payment_status === "pending_payment"
        ).length;
        const waitingForPrice = orders.filter(o => o.status === "waiting_for_price").length;

        const deliveriesPending = (deliveries || []).filter(d =>
          d.status === "ready" || d.status === "out_for_delivery"
        ).length;

        setMetrics({
          totalCustomers: totalCustomers || 0,
          activeCustomers7d,
          activeBuyers30d,
          totalRevenue: paidOrders.reduce((sum, o) => sum + (Number(o.final_price) || 0), 0),
          ordersToday,
          ordersThisWeek,
          pendingPayments,
          waitingForPrice,
          deliveriesPending,
        });

        // Build alerts
        const newAlerts: Alert[] = [];
        if (waitingForPrice > 0) {
          newAlerts.push({ type: "warning", message: "Orders waiting for admin pricing", count: waitingForPrice });
        }
        const proofUploaded = orders.filter(o => o.payment_status === "proof_uploaded").length;
        if (proofUploaded > 0) {
          newAlerts.push({ type: "warning", message: "Transfers waiting confirmation", count: proofUploaded });
        }
        if (deliveriesPending > 0) {
          newAlerts.push({ type: "info", message: "Deliveries pending", count: deliveriesPending });
        }
        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    { title: "Total Customers", value: metrics.totalCustomers, icon: Users, color: "text-blue-600" },
    { title: "Active (7 days)", value: metrics.activeCustomers7d, icon: Activity, color: "text-green-600" },
    { title: "Active Buyers (30d)", value: metrics.activeBuyers30d, icon: ShoppingCart, color: "text-purple-600" },
    { title: "Total Revenue", value: formatPrice(metrics.totalRevenue), icon: TrendingUp, color: "text-primary" },
    { title: "Orders Today", value: metrics.ordersToday, icon: ShoppingCart, color: "text-orange-600" },
    { title: "Orders This Week", value: metrics.ordersThisWeek, icon: ShoppingCart, color: "text-cyan-600" },
    { title: "Pending Payments", value: metrics.pendingPayments, icon: CreditCard, color: "text-yellow-600" },
    { title: "Waiting for Price", value: metrics.waitingForPrice, icon: Clock, color: "text-red-600" },
    { title: "Deliveries Pending", value: metrics.deliveriesPending, icon: Truck, color: "text-indigo-600" },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Owner/HQ overview of the entire business</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchMetrics(); fetchActivities(); }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Overview
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metricCards.map((card, i) => (
            <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-xl font-bold">{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Operational Alerts */}
          <div className="lg:col-span-1 space-y-6">
            {alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Operational Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alerts.map((alert, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{alert.message}</span>
                      <Badge variant={alert.type === "warning" ? "destructive" : "secondary"}>
                        {alert.count}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                <Link to="/super-admin/admins">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" /> Admin Management
                  </Button>
                </Link>
                <Link to="/super-admin/categories">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Package className="h-4 w-4" /> Category Management
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Activity Logs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No recorded activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold truncate">
                            {activity.action.replace(/_/g, " ").toUpperCase()}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.details}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 bg-muted/50">{activity.actor_email}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
