import { AdminLayout } from "@/components/admin/AdminLayout";
import { ShoppingCart } from "lucide-react";

export default function AdminOrders() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You haven't received any orders yet. Orders will appear here once customers start placing them.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
