import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCategories } from "@/hooks/useCategories";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Package, Lock, Unlock, Loader2, RefreshCw } from "lucide-react";

export default function AdminCategories() {
    const { categories, loading, updateCategory, refetch } = useCategories();
    const [updating, setUpdating] = useState<string | null>(null);
    const { logAction } = useAuditLog();

    const toggleComingSoon = async (categoryId: string, currentValue: boolean) => {
        setUpdating(categoryId);
        const newValue = !currentValue;

        try {
            await updateCategory(categoryId, { is_coming_soon: newValue });

            const categoryName = categories.find(c => c.id === categoryId)?.name || categoryId;
            toast.success(`Category ${newValue ? "marked as Coming Soon" : "is now Live"}`);

            await logAction(newValue ? "category_coming_soon" : "category_go_live", {
                actionType: "update_category",
                targetType: "category",
                targetId: categoryId,
                details: `${categoryName} → ${newValue ? "Coming Soon" : "Live"}`,
            });
        } catch (error) {
            console.error("Error updating category:", error);
            toast.error("Failed to update category status");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-bold">Categories</h1>
                        <p className="text-muted-foreground">Manage category visibility and other settings</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categories.map((category) => {
                            const isComingSoon = category.is_coming_soon;
                            const isUpdating = updating === category.id;

                            return (
                                <Card key={category.id} className={isComingSoon ? "bg-muted/40 border-dashed" : ""}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${isComingSoon ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                                                <Package className="h-5 w-5" />
                                            </div>
                                            {category.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                                            {category.description}
                                        </p>

                                        <div className="flex items-center justify-between p-3 rounded-lg bg-card border shadow-sm">
                                            <div className="flex items-center gap-2">
                                                {isComingSoon ? (
                                                    <Lock className="h-4 w-4 text-orange-500" />
                                                ) : (
                                                    <Unlock className="h-4 w-4 text-green-500" />
                                                )}
                                                <span className="font-medium text-sm">
                                                    {isComingSoon ? "Coming Soon (Locked)" : "Live (Visible)"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                                <Switch
                                                    checked={isComingSoon}
                                                    onCheckedChange={() => toggleComingSoon(category.id, isComingSoon || false)}
                                                    disabled={isUpdating}
                                                />
                                            </div>
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
