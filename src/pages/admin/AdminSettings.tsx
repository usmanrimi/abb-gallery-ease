import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";

export default function AdminSettings() {
  const { categories, loading, updateCategory } = useCategories();

  const handleToggle = async (categoryId: string, name: string, checked: boolean) => {
    const result = await updateCategory(categoryId, { is_coming_soon: checked });
    if (result.success) {
      toast.success(`Category "${name}" is now ${checked ? "Coming Soon" : "visible"}`);
    } else {
      toast.error(`Failed to update category "${name}"`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your store settings</p>
        </div>

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
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No categories found to manage.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary overflow-hidden">
                        {category.image_url ? (
                          <img src={category.image_url} alt={category.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <Label className="text-base font-medium">{category.name}</Label>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {category.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {category.is_coming_soon ? "Coming Soon" : "Visible"}
                      </span>
                      <Switch
                        checked={category.is_coming_soon}
                        onCheckedChange={(checked) => handleToggle(category.id, category.name, checked)}
                      />
                    </div>
                  </div>
                ))}

                <p className="text-xs text-muted-foreground pt-2">
                  When "Coming Soon" is enabled, customers will see the category but won't be able to browse its packages.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
