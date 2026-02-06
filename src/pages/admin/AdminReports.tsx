import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import {
  BarChart3,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  ShoppingCart,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";

interface Order {
  id: string;
  custom_order_id: string | null;
  package_name: string;
  package_class: string | null;
  quantity: number;
  total_price: number;
  final_price: number;
  payment_method: string;
  payment_status: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  created_at: string;
}

interface ReportStats {
  totalOrders: number;
  paidOrders: number;
  pendingPayments: number;
  totalRevenue: number;
  topPackages: { name: string; count: number; revenue: number }[];
  salesByCategory: { category: string; count: number; revenue: number }[];
  monthlyData: { month: string; orders: number; revenue: number }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#10b981", "#f59e0b"];

export default function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [stats, setStats] = useState<ReportStats>({
    totalOrders: 0,
    paidOrders: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    topPackages: [],
    salesByCategory: [],
    monthlyData: [],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ordersData = data || [];
      setOrders(ordersData);

      // Calculate stats
      const paidStatuses = ["paid", "confirmed", "delivered", "processing"];
      const paidOrders = ordersData.filter((o) =>
        paidStatuses.includes(o.status) || o.payment_status === "paid"
      );
      const pendingOrders = ordersData.filter(
        (o) => !paidStatuses.includes(o.status) && o.payment_status !== "paid"
      );

      const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.final_price) || 0), 0);

      // Top packages
      const packageStats: Record<string, { count: number; revenue: number }> = {};
      ordersData.forEach((o) => {
        if (!packageStats[o.package_name]) {
          packageStats[o.package_name] = { count: 0, revenue: 0 };
        }
        packageStats[o.package_name].count += 1;
        if (paidStatuses.includes(o.status) || o.payment_status === "paid") {
          packageStats[o.package_name].revenue += Number(o.final_price) || 0;
        }
      });

      const topPackages = Object.entries(packageStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Sales by category (derive from package name prefix)
      const categoryStats: Record<string, { count: number; revenue: number }> = {};
      ordersData.forEach((o) => {
        const category = o.package_name.includes("Lefe") ? "Kayan Lefe" : "Kayan Sallah";
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, revenue: 0 };
        }
        categoryStats[category].count += 1;
        if (paidStatuses.includes(o.status) || o.payment_status === "paid") {
          categoryStats[category].revenue += Number(o.final_price) || 0;
        }
      });

      const salesByCategory = Object.entries(categoryStats).map(([category, data]) => ({
        category,
        ...data,
      }));

      // Monthly data
      const monthlyStats: Record<string, { orders: number; revenue: number }> = {};
      ordersData.forEach((o) => {
        const month = new Date(o.created_at).toLocaleDateString("en-NG", {
          month: "short",
          year: "2-digit",
        });
        if (!monthlyStats[month]) {
          monthlyStats[month] = { orders: 0, revenue: 0 };
        }
        monthlyStats[month].orders += 1;
        if (paidStatuses.includes(o.status) || o.payment_status === "paid") {
          monthlyStats[month].revenue += Number(o.final_price) || 0;
        }
      });

      const monthlyData = Object.entries(monthlyStats)
        .map(([month, data]) => ({ month, ...data }))
        .reverse();

      setStats({
        totalOrders: ordersData.length,
        paidOrders: paidOrders.length,
        pendingPayments: pendingOrders.length,
        totalRevenue,
        topPackages,
        salesByCategory,
        monthlyData,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const exportData = orders.map((o) => ({
      Date: new Date(o.created_at).toLocaleDateString("en-NG"),
      "Order ID": o.custom_order_id || o.id.slice(0, 8).toUpperCase(),
      "Customer Name": o.customer_name,
      "Customer Email": o.customer_email,
      "Customer WhatsApp": o.customer_whatsapp,
      Category: o.package_name.includes("Lefe") ? "Kayan Lefe" : "Kayan Sallah",
      Package: o.package_name,
      Class: o.package_class || "N/A",
      Quantity: o.quantity,
      "Amount (₦)": o.final_price,
      "Payment Method": o.payment_method || "N/A",
      "Payment Status": o.payment_status || "pending",
      "Order Status": o.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

    // Auto-size columns
    const maxWidth = 20;
    const wscols = Object.keys(exportData[0] || {}).map(() => ({ wch: maxWidth }));
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, `MAG-Sales-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-primary",
    },
    {
      title: "Paid Orders",
      value: stats.paidOrders,
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "text-primary",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">View sales performance and business insights</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchReportData} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={exportToExcel} disabled={orders.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ${stat.color}`}>
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

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string) => [
                            name === "revenue" ? formatPrice(value) : value,
                            name === "revenue" ? "Revenue" : "Orders",
                          ]}
                        />
                        <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Sales by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.salesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.salesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="revenue"
                          nameKey="category"
                          label={({ category, percent }) =>
                            `${category} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {stats.salesByCategory.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatPrice(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Packages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Selling Packages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topPackages.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topPackages.map((pkg, i) => (
                      <div
                        key={pkg.name}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-sm text-muted-foreground">{pkg.count} orders</p>
                          </div>
                        </div>
                        <p className="font-semibold text-primary">{formatPrice(pkg.revenue)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    No sales data available
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
