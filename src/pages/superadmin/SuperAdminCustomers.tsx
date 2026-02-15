import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/categories";
import { Users, Mail, Phone, Package, Loader2, ShoppingCart } from "lucide-react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";

interface CustomerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export default function SuperAdminCustomers() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, final_price");

      const orderStats = (orders || []).reduce((acc, order) => {
        if (!acc[order.user_id]) acc[order.user_id] = { count: 0, total: 0 };
        acc[order.user_id].count += 1;
        acc[order.user_id].total += Number(order.final_price) || 0;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      setCustomers((profiles || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        created_at: p.created_at || "",
        order_count: orderStats[p.id]?.count || 0,
        total_spent: orderStats[p.id]?.total || 0,
      })));
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">All Customers</h1>
          <p className="text-muted-foreground">Complete customer overview</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.filter(c => c.order_count > 0).length}</p>
                  <p className="text-sm text-muted-foreground">Active Buyers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatPrice(customers.reduce((sum, c) => sum + c.total_spent, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {customer.full_name || "Unknown Customer"}
                    {customer.order_count > 0 && (
                      <Badge variant="secondary">{customer.order_count} orders</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {customer.phone}
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Spent</span>
                      <span className="font-semibold text-primary">{formatPrice(customer.total_spent)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
