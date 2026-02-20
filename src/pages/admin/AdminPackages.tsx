import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminPackages, Package, PackageClass } from "@/hooks/usePackages";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/data/categories";
import { Package as PackageIcon, ImageIcon, Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          is_active: true
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

  // Form state
  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    description: "",
    image_cover_url: "",
    image_detail_url: "",
    price_vip: "",
    price_special: "",
    price_standard: "",
    starting_from: "",
  });

  const handleOpenAdd = () => {
    setFormData({
      category_id: categories.length > 0 ? categories[0].id : "",
      name: "",
      description: "",
      image_cover_url: "",
      image_detail_url: "",
      price_vip: "",
      price_special: "",
      price_standard: "",
      starting_from: "",
    });
    setEditingPackage(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      category_id: pkg.category_id,
      name: pkg.name,
      description: pkg.description || "",
      image_cover_url: pkg.image_cover_url || "",
      image_detail_url: pkg.image_detail_url || "",
      price_vip: pkg.price_vip?.toString() || "",
      price_special: pkg.price_special?.toString() || "",
      price_standard: pkg.price_standard?.toString() || "",
      starting_from: pkg.starting_from?.toString() || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = {
      ...formData,
      price_vip: formData.price_vip ? Number(formData.price_vip) : null,
      price_special: formData.price_special ? Number(formData.price_special) : null,
      price_standard: formData.price_standard ? Number(formData.price_standard) : null,
      starting_from: formData.starting_from ? Number(formData.starting_from) : null,
    };

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
    } finally {
      setIsSubmitting(false);
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPackage ? "Edit Package" : "Add New Package"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Package Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alhaji Babba Package"
                        className="h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter package details..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <ImageUpload
                      label="Cover Image"
                      defaultValue={formData.image_cover_url}
                      onUpload={(url) => setFormData({ ...formData, image_cover_url: url })}
                      bucket="package-images"
                    />
                    <ImageUpload
                      label="Detail Image"
                      defaultValue={formData.image_detail_url}
                      onUpload={(url) => setFormData({ ...formData, image_detail_url: url })}
                      bucket="package-images"
                    />
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <h3 className="text-sm font-black uppercase tracking-tighter mb-4 text-primary">Class Section</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider">VIP Price</Label>
                        <Input
                          type="number"
                          value={formData.price_vip}
                          onChange={(e) => setFormData({ ...formData, price_vip: e.target.value })}
                          placeholder="0"
                          className="h-9 font-bold"
                        />
                      </div>
                      <div className="space-y-1.5 border-x border-border/30 px-4">
                        <Label className="text-xs font-bold uppercase tracking-wider text-primary">Special Price</Label>
                        <Input
                          type="number"
                          value={formData.price_special}
                          onChange={(e) => setFormData({ ...formData, price_special: e.target.value })}
                          placeholder="0"
                          className="h-9 font-bold border-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider">Standard Price</Label>
                        <Input
                          type="number"
                          value={formData.price_standard}
                          onChange={(e) => setFormData({ ...formData, price_standard: e.target.value })}
                          placeholder="0"
                          className="h-9 font-bold"
                        />
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed border-border/50">
                      <div className="space-y-1.5 max-w-[200px]">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manual Start Price</Label>
                        <Input
                          type="number"
                          value={formData.starting_from}
                          onChange={(e) => setFormData({ ...formData, starting_from: e.target.value })}
                          placeholder="0"
                          className="h-8 text-xs italic"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingPackage ? "Save Changes" : "Create Package"}
                  </Button>
                </div>
              </form>
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
                            onClick={() => toggleVisibility(pkg.id, !pkg.is_active)}
                          >
                            {pkg.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-2 shadow-sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this package?")) {
                                deletePackage(pkg.id);
                              }
                            }}
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
