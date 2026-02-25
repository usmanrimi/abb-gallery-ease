import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCategories, Category } from "@/hooks/useCategories";
import { useAuditLog } from "@/hooks/useAuditLog";
import { CategoryEditor } from "@/components/admin/CategoryEditor";
import { toast } from "sonner";
import { Package, Lock, Unlock, Loader2, RefreshCw, Image as ImageIcon, Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminCategories() {
    const { categories, loading, addCategory, updateCategory, deleteCategory, refetch } = useCategories();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const { logAction } = useAuditLog();

    const handleOpenDialog = (category?: Category) => {
        setEditingCategory(category || null);
        setIsDialogOpen(true);
    };

    const handleSave = async (data: Partial<Category>) => {
        setSaving(true);
        try {
            if (editingCategory) {
                const result = await updateCategory(editingCategory.id, data);
                if (result.success) {
                    toast.success("Category updated successfully");
                    await logAction("update_category", {
                        actionType: "update",
                        targetType: "category",
                        targetId: editingCategory.id,
                        details: `Updated category: ${data.name}`
                    });
                    setIsDialogOpen(false);
                }
            } else {
                const result = await addCategory(data as any);
                if (result.success) {
                    toast.success("Category created successfully");
                    await logAction("create_category", {
                        actionType: "create",
                        targetType: "category",
                        targetId: (result.data as any).id,
                        details: `Created category: ${data.name}`
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
                toast.success("Category deleted");
            }
        } catch (err: any) {
            console.error("Delete error:", err);
            toast.error(err.message || "Failed to delete category");
        }
    };

    const toggleComingSoon = async (category: Category) => {
        try {
            const newValue = !category.is_coming_soon;
            await updateCategory(category.id, { is_coming_soon: newValue });
            toast.success(`${category.name} is now ${newValue ? "Coming Soon" : "Live"}`);

            await logAction(newValue ? "category_coming_soon" : "category_go_live", {
                actionType: "update",
                targetType: "category",
                targetId: category.id,
                details: `${category.name} → ${newValue ? "Coming Soon" : "Live"}`,
            });
        } catch (err: any) {
            console.error("Toggle error:", err);
            toast.error(err.message || "Failed to toggle status");
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-display font-bold">Categories</h1>
                        <p className="text-muted-foreground">Manage category visibility and status</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" /> New Category
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : categories.length === 0 ? (
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
                        {categories.map((category) => {
                            const isComingSoon = category.is_coming_soon;

                            return (
                                <Card key={category.id} className={`overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 border-primary/20 bg-background/50 backdrop-blur-sm ${isComingSoon ? "border-dashed opacity-90" : ""}`}>
                                    <div className="aspect-video relative overflow-hidden">
                                        {category.image_url ? (
                                            <img
                                                src={category.image_url}
                                                alt={category.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted/30">
                                                <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                                            </div>
                                        )}

                                        {/* Premium Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0 duration-300">
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8 bg-background/90 backdrop-blur-sm shadow-sm hover:bg-primary hover:text-white transition-colors"
                                                onClick={() => handleOpenDialog(category)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="h-8 w-8 shadow-sm"
                                                onClick={() => handleDelete(category)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {isComingSoon && (
                                            <div className="absolute top-2 left-2">
                                                <Badge className="bg-orange-500/90 text-white border-none backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                    Coming Soon
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader className="p-4 pb-2 relative">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-display font-bold group-hover:text-primary transition-colors">{category.name}</CardTitle>
                                            <Switch
                                                checked={!isComingSoon}
                                                onCheckedChange={() => toggleComingSoon(category)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                        <CardDescription className="font-mono text-[9px] uppercase tracking-tighter opacity-70">
                                            SLUG: {category.slug}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4 italic group-hover:text-foreground/80 transition-colors">
                                            {category.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                            {isComingSoon ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                                    <Lock className="h-3 w-3" />
                                                    <span>LOCKED</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                    <Unlock className="h-3 w-3" />
                                                    <span>ACTIVE</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>

                                    {/* Intensified Gold Border Bottom */}
                                    <div className="h-1 w-full bg-gradient-to-r from-primary-light via-primary to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
                        </DialogHeader>
                        <CategoryEditor
                            category={editingCategory}
                            onSave={handleSave}
                            onCancel={() => setIsDialogOpen(false)}
                            isSaving={saving}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
