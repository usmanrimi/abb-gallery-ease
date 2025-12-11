import { AdminLayout } from "@/components/admin/AdminLayout";
import { Users } from "lucide-react";

export default function AdminCustomers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer accounts</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have any customers yet. Customers will appear here once they create accounts and place orders.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
