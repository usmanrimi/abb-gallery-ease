import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, Category } from "@/hooks/useCategories";
import { useAuditLog } from "@/hooks/useAuditLog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Image as ImageIcon,
    Trash2,
    Edit2,
    Loader2,
    RefreshCw,
    Package,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function SuperAdminCategories() {
    const { categories, loading, addCategory, updateCategory, deleteCategory, refetch } = useCategories();
    const { logAction } = useAuditLog();

    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        slug: "",
        is_coming_soon: false,
        image_url: ""
    });
    const [saving, setSaving] = useState(false);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || "",
                slug: category.slug,
                is_coming_soon: category.is_coming_soon,
                image_url: category.image_url || ""
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                description: "",
                slug: "",
                is_coming_soon: false,
                image_url: ""
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Name and Slug are required");
            return;
        }

        setSaving(true);
        try {
            if (editingCategory) {
                const result = await updateCategory(editingCategory.id, formData);
                if (result.success) {
                    toast.success("Category updated successfully");
                    await logAction("update_category", {
                        actionType: "update",
                        targetType: "category",
                        targetId: editingCategory.id,
                        details: `Updated category: ${formData.name}`
                    });
                    setIsDialogOpen(false);
                }
            } else {
                const result = await addCategory(formData as any);
                if (result.success) {
                    toast.success("Category created successfully");
                    await logAction("create_category", {
                        actionType: "create",
                        targetType: "category",
                        targetId: (result.data as any).id,
                        details: `Created category: ${formData.name}`
                    });
                    setIsDialogOpen(false);
                }
            }
        } catch (err: any) {
            console.error("Save error:", err);
            toast.error(err.message || "Failed to save category");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category: Category) => {
        if (!confirm(`Are you sure you want to delete "${category.name}"? This may affect packages in this category.`)) {
            return;
        }

        try {
            const result = await deleteCategory(category.id);
            if (result.success) {
                await logAction("delete_category", {
                    actionType: "delete",
                    targetType: "category",
                    targetId: category.id,
                    details: `Deleted category: ${category.name}`
                });
            }
        } catch (err: any) {
            console.error("Delete error:", err);
            toast.error(err.message || "Failed to delete category");
        }
    };

    const toggleComingSoon = async (category: Category) => {
        try {
            await updateCategory(category.id, { is_coming_soon: !category.is_coming_soon });
            toast.success(`${category.name} is now ${!category.is_coming_soon ? "Coming Soon" : "Live"}`);
        } catch (err: any) {
            console.error("Toggle error:", err);
            toast.error(err.message || "Failed to toggle status");
        }
    };

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold">Category Management</h1>
                        <p className="text-muted-foreground">Add and manage product categories and visibility</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> New Category
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold">No categories found</h3>
                            <p className="text-muted-foreground mb-6">Create your first category to get started.</p>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" /> Add Category
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCategories.map((category) => (
                            <Card key={category.id} className="overflow-hidden group">
                                <div className="aspect-video bg-muted/30 relative overflow-hidden border-b">
                                    {category.image_url ? (
                                        <img
                                            src={category.image_url}
                                            alt={category.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                                            onClick={() => handleOpenDialog(category)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(category)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {category.is_coming_soon && (
                                        <div className="absolute top-2 left-2">
                                            <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                Coming Soon
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-display">{category.name}</CardTitle>
                                        <Switch
                                            checked={!category.is_coming_soon}
                                            onCheckedChange={() => toggleComingSoon(category)}
                                        />
                                    </div>
                                    <CardDescription className="font-mono text-[10px] uppercase truncate">
                                        SLUG: {category.slug}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                                        {category.description || "No description provided."}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Category Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                name: val,
                                                slug: prev.slug || val.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
                                            }));
                                        }}
                                        placeholder="e.g. Kayan Lefe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (URL path)</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="kayan-lefe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        className="h-24"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief overview of this category..."
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                                    <div className="space-y-0.5">
                                        <Label>Active Status</Label>
                                        <p className="text-[10px] text-muted-foreground">Toggle "Coming Soon" status</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">{formData.is_coming_soon ? "Coming Soon" : "Live"}</span>
                                        <Switch
                                            checked={!formData.is_coming_soon}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_coming_soon: !checked }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <ImageUpload
                                    label="Category Image"
                                    defaultValue={formData.image_url}
                                    bucket="category-images"
                                    onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editingCategory ? "Update Category" : "Create Category"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </SuperAdminLayout>
    );
}
