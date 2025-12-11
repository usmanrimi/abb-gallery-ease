import { AdminLayout } from "@/components/admin/AdminLayout";
import { Truck } from "lucide-react";

export default function AdminDeliveries() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Deliveries</h1>
          <p className="text-muted-foreground">Track and manage deliveries</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card">
          <Truck className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No deliveries yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            There are no deliveries to track yet. Deliveries will appear here once orders are dispatched.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
