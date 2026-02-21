import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminPackages, Package } from "@/hooks/usePackages";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/data/categories";
import { Package as PackageIcon, ImageIcon, Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PackageEditor } from "@/components/admin/PackageEditor";

// Seed data for Kayan Sallah packages
const kayanSallahSeedData = [
  { name: "Alhaji Babba Package", description: "Premium package for distinguished gentlemen", starting_price: 500000 },
  { name: "Hajiya Babba Package", description: "Premium package for distinguished ladies", starting_price: 500000 },
  { name: "Manyan Yara Package", description: "Package for young adults", starting_price: 200000 },
  { name: "Babban Yaya Package", description: "Package for elder brothers", starting_price: 200000 },
  { name: "Grandma Package", description: "Special package for grandmothers", starting_price: 100000 },
  { name: "Marayu Package (Male)", description: "Charity package for orphans (male)", starting_price: 50000 },
  { name: "Babbar Yaya Package", description: "Package for elder sisters", starting_price: 200000 },
  { name: "Grandpa Package", description: "Special package for grandfathers", starting_price: 100000 },
  { name: "Marayu Package (Female)", description: "Charity package for orphans (female)", starting_price: 50000 },
  { name: "Dan Lele Package", description: "Package for young boys", starting_price: 150000 },
  { name: "Hadimai Package (Male)", description: "Package for helpers (male)", starting_price: 100000 },
  { name: "Masses (Male)", description: "Affordable package for men", starting_price: 50000 },
  { name: "Distribution Package (Male)", description: "Bulk distribution package (male)", starting_price: 50000 },
  { name: "Hadimai Package (Female)", description: "Package for helpers (female)", starting_price: 100000 },
  { name: "Masses (Female)", description: "Affordable package for women", starting_price: 50000 },
  { name: "Distribution Package (Female)", description: "Bulk distribution package (female)", starting_price: 50000 },
  { name: "Ya Imam Package", description: "Package for religious leaders (Ya Malam)", starting_price: 100000 },
  { name: "Family Combo Package", description: "Complete family celebration package", starting_price: 350000 },
  { name: "Iyayen Na Package", description: "Package for parents", starting_price: 200000 },
  { name: "Yar Lele Package", description: "Package for young girls", starting_price: 150000 },
  { name: "Babbar Yarinya Package", description: "Package for teenage girls", starting_price: 150000 },
];

export default function AdminPackages() {
  const { packages, loading: packagesLoading, addPackage, updatePackage, deletePackage, toggleVisibility } = useAdminPackages();
  const { categories, loading: categoriesLoading } = useCategories();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const loading = packagesLoading || categoriesLoading;

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const handleSeedKayanSallah = async () => {
    if (!confirm("This will add all Kayan Sallah packages with VIP, SPECIAL, and STANDARD pricing tiers. Continue?")) return;

    setIsSeeding(true);
    try {
      for (const pkg of kayanSallahSeedData) {
        await addPackage({
          category_id: "kayan-sallah",
          name: pkg.name,
          description: pkg.description,
          image_cover_url: null,
          image_detail_url: null,
          price_vip: 350000,
          price_special: 200000,
          price_standard: 50000,
          starting_from: pkg.starting_price,
        });
      }
      toast.success("All Kayan Sallah packages have been added!");
    } catch (error: any) {
      console.error("Error seeding packages:", error);
      toast.error(error.message || "Failed to seed some packages.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsAddDialogOpen(true);
  };

  const handleSave = async (submitData: any) => {
    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, submitData);
        toast.success("Package updated successfully");
      } else {
        await addPackage(submitData as any);
        toast.success("Package created successfully");
      }
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving package:", error);
      toast.error(error.message || "Failed to save package");
      throw error;
    }
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Are you sure you want to delete "${pkg.name}"?`)) return;

    try {
      await deletePackage(pkg.id);
      toast.success("Package deleted successfully!");
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package.");
    }
  };

  const handleToggleVisibility = async (pkg: Package) => {
    try {
      await toggleVisibility(pkg.id, !pkg.is_active);
      toast.success(pkg.is_active ? "Package is now hidden" : "Package is now visible");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update visibility.");
    }
  };

  // Group packages by category
  const packagesByCategory = packages.reduce((acc: Record<string, Package[]>, pkg) => {
    if (!acc[pkg.category_id]) acc[pkg.category_id] = [];
    acc[pkg.category_id].push(pkg);
    return acc;
  }, {});

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Package Management</h1>
            <p className="text-muted-foreground">Create and manage your service packages and pricing tiers.</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingPackage(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPackage ? "Edit Package" : "Add New Package"}</DialogTitle>
              </DialogHeader>
              <PackageEditor
                categories={categories}
                editingPackage={editingPackage}
                onSave={handleSave}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {packages.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center bg-muted/20 border-dashed">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PackageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No packages yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start by adding your first package to the catalog or seed default data.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
              <Button variant="outline" onClick={handleSeedKayanSallah} disabled={isSeeding}>
                {isSeeding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Seed Kayan Sallah
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(packagesByCategory).map(([categoryId, catPackages]) => (
              <div key={categoryId} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1 font-bold">
                    {getCategoryName(categoryId)}
                  </Badge>
                  <div className="h-px flex-1 bg-border/50"></div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {catPackages.map((pkg) => (
                    <Card key={pkg.id} className={`overflow-hidden border-border/50 hover:border-primary/30 transition-all ${!pkg.is_active ? "opacity-60 grayscale" : "shadow-sm hover:shadow-md"}`}>
                      <div className="aspect-video bg-muted/30 relative flex items-center justify-center overflow-hidden">
                        {pkg.image_cover_url ? (
                          <img
                            src={pkg.image_cover_url}
                            alt={pkg.name}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                            <ImageIcon className="h-10 w-10" />
                            <span className="text-[10px] uppercase font-bold tracking-tighter">No cover</span>
                          </div>
                        )}
                        {!pkg.is_active && (
                          <Badge variant="destructive" className="absolute top-2 right-2 shadow-sm">
                            <EyeOff className="h-3 w-3 mr-1" /> Inactive
                          </Badge>
                        )}
                        {pkg.is_active && (
                          <Badge variant="secondary" className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border-none shadow-sm">
                            <Eye className="h-3 w-3 mr-1 text-primary" /> Active
                          </Badge>
                        )}
                      </div>
                      <CardHeader className="p-4 space-y-1">
                        <CardTitle className="text-lg font-bold leading-tight line-clamp-1">{pkg.name}</CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">{pkg.description || "No description provided."}</p>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-4">
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40">
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">VIP</p>
                            <p className="text-xs font-black text-primary">{pkg.price_vip ? formatPrice(pkg.price_vip) : "—"}</p>
                          </div>
                          <div className="text-center border-x border-border/40">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">Special</p>
                            <p className="text-xs font-black text-primary">{pkg.price_special ? formatPrice(pkg.price_special) : "—"}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold">Standard</p>
                            <p className="text-xs font-black text-primary">{pkg.price_standard ? formatPrice(pkg.price_standard) : "—"}</p>
                          </div>
                        </div>

                        <div className="flex justify-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-[11px] font-bold uppercase transition-colors hover:bg-primary/10"
                            onClick={() => handleOpenEdit(pkg)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 px-2 transition-colors ${pkg.is_active ? "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200" : "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"}`}
                            onClick={() => handleToggleVisibility(pkg)}
                          >
                            {pkg.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2 shadow-sm"
                            onClick={() => handleDelete(pkg)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
