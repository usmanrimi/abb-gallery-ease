import { AdminLayout } from "@/components/admin/AdminLayout";
import { Package } from "lucide-react";

export default function AdminPackages() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Packages</h1>
          <p className="text-muted-foreground">Manage your product packages</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You haven't added any packages yet. Start by creating your first package to display in your store.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
