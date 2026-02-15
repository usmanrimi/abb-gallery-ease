import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { categories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Lock, Unlock, Loader2, RefreshCw } from "lucide-react";

interface CategorySetting {
    category_slug: string;
    coming_soon: boolean;
}

export default function AdminCategories() {
    const [settings, setSettings] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("category_settings")
                .select("*");

            if (error) throw error;

            const settingsMap: Record<string, boolean> = {};
            data?.forEach((s) => {
                settingsMap[s.category_slug] = s.coming_soon;
            });

            setSettings(settingsMap);
        } catch (error) {
            console.error("Error fetching category settings:", error);
            toast.error("Failed to load category settings");
        } finally {
            setLoading(false);
        }
    };

    const toggleComingSoon = async (slug: string, currentValue: boolean) => {
        setUpdating(slug);
        const newValue = !currentValue;

        try {
            // Check if setting exists first
            const { data: existing } = await supabase
                .from("category_settings")
                .select("*")
                .eq("category_slug", slug)
                .single();

            let error;

            if (existing) {
                const { error: updateError } = await supabase
                    .from("category_settings")
                    .update({ coming_soon: newValue, updated_at: new Date().toISOString() })
                    .eq("category_slug", slug);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("category_settings")
                    .insert({ category_slug: slug, coming_soon: newValue });
                error = insertError;
            }

            if (error) throw error;

            setSettings(prev => ({ ...prev, [slug]: newValue }));
            toast.success(`Category ${newValue ? "marked as Coming Soon" : "is now Live"}`);
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
                    <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
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
                            const isComingSoon = settings[category.slug] || false;
                            const isUpdating = updating === category.slug;

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
                                                    onCheckedChange={() => toggleComingSoon(category.slug, isComingSoon)}
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
