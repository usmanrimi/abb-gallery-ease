import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Users,
  ShoppingCart,
  Truck,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatPrice } from "@/data/categories";
import { AdminLayout } from "@/components/admin/AdminLayout";

const stats = [
  {
    title: "Total Revenue",
    value: formatPrice(2450000),
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Total Orders",
    value: "156",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    title: "Active Customers",
    value: "89",
    change: "+5.1%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Pending Deliveries",
    value: "23",
    change: "-3.2%",
    trend: "down",
    icon: Truck,
  },
];

const recentOrders = [
  { id: "ORD-001", customer: "Amina Ibrahim", package: "Sallah VIP", amount: 150000, status: "pending" },
  { id: "ORD-002", customer: "Fatima Mohammed", package: "Bridal Special", amount: 350000, status: "processing" },
  { id: "ORD-003", customer: "Aisha Yusuf", package: "Baby Welcome", amount: 80000, status: "delivered" },
  { id: "ORD-004", customer: "Hadiza Sani", package: "Family Bundle", amount: 200000, status: "processing" },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your store overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}>
                    {stat.change}
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
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
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {order.id}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "pending"
                          ? "bg-secondary/50 text-secondary-foreground"
                          : order.status === "processing"
                          ? "bg-primary/10 text-primary"
                          : "bg-success/10 text-success"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="font-medium mt-1">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">{order.package}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(order.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
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
