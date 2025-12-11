import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const stats = [
  {
    title: "Total Revenue",
    value: "₦0",
    icon: DollarSign,
  },
  {
    title: "Total Orders",
    value: "0",
    icon: ShoppingCart,
  },
  {
    title: "Active Customers",
    value: "0",
    icon: Users,
  },
  {
    title: "Pending Deliveries",
    value: "0",
    icon: Truck,
  },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin panel. Here's your store overview.</p>
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
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm">Orders will appear here once customers place them</p>
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
