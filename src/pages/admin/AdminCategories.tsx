import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCategories } from "@/hooks/useCategories";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Package, Lock, Unlock, Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";

export default function AdminCategories() {
    const { categories, loading, updateCategory, refetch } = useCategories();
    const [updating, setUpdating] = useState<string | null>(null);
    const { logAction } = useAuditLog();

    const toggleComingSoon = async (categoryId: string, currentValue: boolean) => {
        setUpdating(categoryId);
        const newValue = !currentValue;

        try {
            const result = await updateCategory(categoryId, { is_coming_soon: newValue });
            if (result.success) {
                const categoryName = categories.find(c => c.id === categoryId)?.name || categoryId;
                toast.success(`Category ${newValue ? "marked as Coming Soon" : "is now Live"}`);

                await logAction(newValue ? "category_coming_soon" : "category_go_live", {
                    actionType: "update_category",
                    targetType: "category",
                    targetId: categoryId,
                    details: `${categoryName} → ${newValue ? "Coming Soon" : "Live"}`,
                });
            }
        } catch (error: any) {
            console.error("Error updating category:", error);
            toast.error(error.message || "Failed to update category status");
        } finally {
            setUpdating(null);
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
                    <Button variant="outline" onClick={refetch} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
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
                            <p className="text-muted-foreground">Please contact a Super Admin to create categories.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => {
                            const isComingSoon = category.is_coming_soon;
                            const isUpdating = updating === category.id;

                            return (
                                <Card key={category.id} className={`overflow-hidden group ${isComingSoon ? "border-dashed opacity-80" : ""}`}>
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
                                        {isComingSoon && (
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
                                                checked={!isComingSoon}
                                                onCheckedChange={() => toggleComingSoon(category.id, isComingSoon)}
                                                disabled={isUpdating}
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
                                        <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                                            {isComingSoon ? (
                                                <Lock className="h-3 w-3 text-orange-500" />
                                            ) : (
                                                <Unlock className="h-3 w-3 text-green-500" />
                                            )}
                                            <span className={isComingSoon ? "text-orange-600" : "text-green-600"}>
                                                {isComingSoon ? "Coming Soon (Locked)" : "Live (Visible)"}
                                            </span>
                                            {isUpdating && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
