import { AdminLayout } from "@/components/admin/AdminLayout";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your store settings</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card">
          <Settings className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Settings coming soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Store settings and configuration options will be available here soon.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
