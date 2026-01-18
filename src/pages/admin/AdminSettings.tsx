import { AdminLayout } from "@/components/admin/AdminLayout";
import { PaymentSettings } from "@/components/admin/PaymentSettings";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your store settings</p>
        </div>

        <PaymentSettings />
      </div>
    </AdminLayout>
  );
}
