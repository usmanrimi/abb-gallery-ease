import { AdminLayout } from "@/components/admin/AdminLayout";
import { BarChart3 } from "lucide-react";

export default function AdminReports() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground">View sales and analytics reports</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-lg bg-card">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            There's not enough data to generate reports yet. Reports will be available once you have sales and customer activity.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
