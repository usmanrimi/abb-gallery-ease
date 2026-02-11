import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import { Loader2, TrendingUp } from "lucide-react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PackageStat {
  name: string;
  count: number;
  revenue: number;
}

export default function SuperAdminAnalytics() {
  const [topPackages, setTopPackages] = useState<PackageStat[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("package_name, final_price, status, payment_status, created_at");

      if (orders) {
        const paidStatuses = ["paid", "confirmed", "delivered", "processing", "ready_for_delivery", "out_for_delivery"];
        const paidOrders = orders.filter(o => paidStatuses.includes(o.status) || o.payment_status === "paid");

        // Top packages
        const pkgMap: Record<string, PackageStat> = {};
        paidOrders.forEach(o => {
          if (!pkgMap[o.package_name]) pkgMap[o.package_name] = { name: o.package_name, count: 0, revenue: 0 };
          pkgMap[o.package_name].count += 1;
          pkgMap[o.package_name].revenue += Number(o.final_price) || 0;
        });
        setTopPackages(Object.values(pkgMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10));

        // Monthly data (last 6 months)
        const monthly: Record<string, { revenue: number; orders: number }> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleString("en", { month: "short", year: "2-digit" });
          monthly[key] = { revenue: 0, orders: 0 };
        }
        paidOrders.forEach(o => {
          const d = new Date(o.created_at);
          const key = d.toLocaleString("en", { month: "short", year: "2-digit" });
          if (monthly[key]) {
            monthly[key].revenue += Number(o.final_price) || 0;
            monthly[key].orders += 1;
          }
        });
        setMonthlyData(Object.entries(monthly).map(([month, data]) => ({ month, ...data })));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Analytics</h1>
          <p className="text-muted-foreground">Revenue trends and top-selling packages</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Trend (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Packages */}
            <Card>
              <CardHeader>
                <CardTitle>Top-Selling Packages</CardTitle>
              </CardHeader>
              <CardContent>
                {topPackages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sales data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topPackages.map((pkg, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{pkg.count} orders</p>
                          </div>
                        </div>
                        <span className="font-semibold text-primary">{formatPrice(pkg.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}
