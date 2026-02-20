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
    if (!confirm("This will add all Kayan Sallah packages with VIP, SPECIAL, and STANDARD classes. Continue?")) return;

    setIsSeeding(true);
    try {
      for (const pkg of kayanSallahSeedData) {
        await addPackage({
          category_id: "kayan-sallah",
          name: pkg.name,
          description: pkg.description,
          image_url: null,
          class_image_url: null,
          has_classes: true,
          base_price: null,
          starting_price: pkg.starting_price,
          classes: [
            { name: "VIP", price: 350000, description: "Premium quality with luxury items" },
            { name: "SPECIAL", price: 200000, description: "High quality with selected items" },
            { name: "STANDARD", price: 50000, description: "Quality items for the family" },
          ],
        });
      }
      toast.success("All Kayan Sallah packages have been added!");
    } catch (error) {
      console.error("Error seeding packages:", error);
      toast.error("Failed to seed some packages. Please try again.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    category_id: "1",
    name: "",
    description: "",
    image_url: "",
    class_image_url: "",
    has_classes: true,
    base_price: "",
    starting_price: "",
    classes: [
      { name: "VIP", price: "", description: "Premium quality with luxury items" },
      { name: "SPECIAL", price: "", description: "High quality with selected items" },
      { name: "STANDARD", price: "", description: "Quality items for the family" },
    ] as { name: string; price: string; description: string }[],
  });

  const resetForm = () => {
    setFormData({
      category_id: categories[0]?.id || "1",
      name: "",
      description: "",
      image_url: "",
      class_image_url: "",
      has_classes: true,
      base_price: "",
      starting_price: "",
      classes: [
        { name: "VIP", price: "", description: "Premium quality with luxury items" },
        { name: "SPECIAL", price: "", description: "High quality with selected items" },
        { name: "STANDARD", price: "", description: "Quality items for the family" },
      ],
    });
    setEditingPackage(null);
  };

  const openEditDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      category_id: pkg.category_id,
      name: pkg.name,
      description: pkg.description || "",
      image_url: pkg.image_url || "",
      class_image_url: pkg.class_image_url || "",
      has_classes: pkg.has_classes,
      base_price: pkg.base_price?.toString() || "",
      starting_price: pkg.starting_price?.toString() || "",
      classes: pkg.classes?.map(c => ({
        name: c.name,
        price: c.price.toString(),
        description: c.description,
      })) || [
          { name: "VIP", price: "", description: "Premium quality with luxury items" },
          { name: "SPECIAL", price: "", description: "High quality with selected items" },
          { name: "STANDARD", price: "", description: "Quality items for the family" },
        ],
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const packageData = {
        category_id: formData.category_id,
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url || null,
        class_image_url: formData.class_image_url || null,
        has_classes: formData.has_classes,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
        classes: formData.has_classes ? formData.classes.filter(c => c.price).map((c, index) => ({
          name: c.name,
          price: parseFloat(c.price),
          description: c.description,
          sort_order: index,
        })) : [],
      };

      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
        toast.success("Package updated successfully!");
      } else {
        await addPackage(packageData);
        toast.success("Package added successfully!");
      }

      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package. Please try again.");
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
      await toggleVisibility(pkg.id, !pkg.is_hidden);
      toast.success(pkg.is_hidden ? "Package is now visible" : "Package is now hidden");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update visibility.");
    }
  };

  // Group packages by category
  const packagesByCategory = packages.reduce((acc, pkg) => {
    const catId = pkg.category_id;
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(pkg);
    return acc;
  }, {} as Record<string, Package[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Packages</h1>
            <p className="text-muted-foreground">Manage your product packages and pricing</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPackage ? "Edit Package" : "Add New Package"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                  <div className="space-y-2">
                    <Label htmlFor="name">Package Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alhaji Babba Package"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the package..."
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ImageUpload
                    label="Card Image (shown in package list)"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    placeholder="Upload card image"
                  />
                  <ImageUpload
                    label="Detail Page Image (class section)"
                    value={formData.class_image_url}
                    onChange={(url) => setFormData({ ...formData, class_image_url: url })}
                    placeholder="Upload detail image"
                  />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <Switch
                    id="has_classes"
                    checked={formData.has_classes}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_classes: checked })}
                  />
                  <Label htmlFor="has_classes">Has Class Tiers (VIP, SPECIAL, STANDARD)</Label>
                </div>

                {formData.has_classes ? (
                  <div className="space-y-3">
                    <Label>Class Pricing</Label>
                    <div className="space-y-2">
                      <div className="space-y-2">
                        <Label htmlFor="starting_price">Starting Price</Label>
                        <Input
                          id="starting_price"
                          type="number"
                          value={formData.starting_price}
                          onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                          placeholder="e.g. 500000"
                        />
                      </div>
                      {formData.classes.map((cls, index) => (
                        <div key={cls.name} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                          <span className="font-medium w-24">{cls.name}</span>
                          <Input
                            type="number"
                            value={cls.price}
                            onChange={(e) => {
                              const newClasses = [...formData.classes];
                              newClasses[index].price = e.target.value;
                              setFormData({ ...formData, classes: newClasses });
                            }}
                            placeholder="Price"
                            className="w-32"
                          />
                          <Input
                            value={cls.description}
                            onChange={(e) => {
                              const newClasses = [...formData.classes];
                              newClasses[index].description = e.target.value;
                              setFormData({ ...formData, classes: newClasses });
                            }}
                            placeholder="Description"
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Fixed Price</Label>
                    <Input
                      id="base_price"
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      placeholder="e.g. 1500000"
                      required={!formData.has_classes}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingPackage ? "Update Package" : "Add Package"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : packages.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first package to the catalog, or seed Kayan Sallah packages.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Package
                </Button>
                <Button variant="secondary" onClick={handleSeedKayanSallah} disabled={isSeeding}>
                  {isSeeding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Seed Kayan Sallah Packages
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(packagesByCategory).map(([categoryId, categoryPackages]) => (
            <div key={categoryId} className="space-y-4">
              <h2 className="text-xl font-semibold">{getCategoryName(categoryId)}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryPackages.map((pkg) => (
                  <Card key={pkg.id} className={`overflow-hidden ${pkg.is_hidden ? "opacity-60" : ""}`}>
                    <div className="aspect-video bg-muted relative flex items-center justify-center p-2">
                      {pkg.image_url && pkg.image_url !== "/placeholder.svg" ? (
                        <img
                          src={pkg.image_url}
                          alt={pkg.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-10 w-10" />
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                      {pkg.is_hidden && (
                        <Badge variant="secondary" className="absolute top-2 right-2">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {pkg.name}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleVisibility(pkg)}
                            title={pkg.is_hidden ? "Show package" : "Hide package"}
                          >
                            {pkg.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(pkg)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(pkg)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {pkg.description}
                      </p>

                      {pkg.starting_price && (
                        <p className="text-sm font-medium text-primary">
                          Starting from {formatPrice(pkg.starting_price)}
                        </p>
                      )}

                      {pkg.has_classes && pkg.classes && pkg.classes.length > 0 && (
                        <div className="space-y-1">
                          {pkg.classes.map((cls) => (
                            <div
                              key={cls.id}
                              className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                            >
                              <span className="font-medium">{cls.name}</span>
                              <span className="font-semibold text-primary">
                                {formatPrice(cls.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!pkg.has_classes && pkg.base_price && (
                        <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                          <span className="font-medium">Fixed Price</span>
                          <span className="font-semibold text-primary">
                            {formatPrice(pkg.base_price)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
