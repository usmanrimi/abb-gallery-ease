import { AdminLayout } from "@/components/admin/AdminLayout";
import { PaymentSettings } from "@/components/admin/PaymentSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCategorySettings } from "@/hooks/useCategorySettings";
import { toast } from "sonner";
import { Loader2, Calendar, Baby } from "lucide-react";

export default function AdminSettings() {
  const { settings, loading, isComingSoon, updateComingSoon } = useCategorySettings();

  const handleToggle = async (slug: string, checked: boolean) => {
    const result = await updateComingSoon(slug, checked);
    if (result.success) {
      toast.success(`Category "${slug}" is now ${checked ? "Coming Soon" : "visible"}`);
    } else {
      toast.error("Failed to update category setting");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your store settings</p>
        </div>

        <PaymentSettings />

        {/* Coming Soon Toggle Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Category Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">Seasonal Packages</Label>
                      <p className="text-sm text-muted-foreground">
                        Ramadan, Harmattan, Raining, Back to School packages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {isComingSoon("seasonal") ? "Coming Soon" : "Visible"}
                    </span>
                    <Switch
                      checked={isComingSoon("seasonal")}
                      onCheckedChange={(checked) => handleToggle("seasonal", checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Baby className="h-5 w-5" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">Haihuwa</Label>
                      <p className="text-sm text-muted-foreground">
                        Baby shower and naming ceremony packages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {isComingSoon("haihuwa") ? "Coming Soon" : "Visible"}
                    </span>
                    <Switch
                      checked={isComingSoon("haihuwa")}
                      onCheckedChange={(checked) => handleToggle("haihuwa", checked)}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  When "Coming Soon" is enabled, customers will see the category but won't be able to browse its packages.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
