import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import {
  Package,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  Loader2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  pendingDeliveries: number;
}

interface RecentOrder {
  id: string;
  package_name: string;
  customer_name: string;
  final_price: number;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    pendingDeliveries: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
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
        .select("id, final_price, status, package_name, customer_name, created_at, user_id")
        .order("created_at", { ascending: false });

      if (orders) {
        // Calculate stats
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.final_price) || 0), 0);
        const uniqueCustomers = new Set(orders.map(o => o.user_id)).size;
        const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "processing").length;

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          activeCustomers: uniqueCustomers,
          pendingDeliveries: pendingOrders,
        });

        // Set recent orders (top 5)
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const statCards = [
    {
      title: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
    },
    {
      title: "Active Customers",
      value: stats.activeCustomers.toString(),
      icon: Users,
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries.toString(),
      icon: Truck,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin panel. Here's your store overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm">View All</Button>
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
                <p className="text-sm">Orders will appear here once customers place them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className="font-medium">{order.package_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="font-semibold text-primary">{formatPrice(order.final_price)}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Manage Packages", icon: Package, href: "/admin/packages" },
            { title: "View Customers", icon: Users, href: "/admin/customers" },
            { title: "Process Orders", icon: ShoppingCart, href: "/admin/orders" },
            { title: "Track Deliveries", icon: Truck, href: "/admin/deliveries" },
          ].map((action) => (
            <Link key={action.href} to={action.href}>
              <Card variant="interactive" className="h-full">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium">{action.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
