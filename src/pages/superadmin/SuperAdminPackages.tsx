import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPackages } from "@/hooks/usePackages";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/data/categories";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, Eye, EyeOff, Search, Loader2, RefreshCw } from "lucide-react";

export default function SuperAdminPackages() {
    const { packages, loading: packagesLoading, refetch: refetchPackages, addPackage, updatePackage, deletePackage, toggleVisibility } = useAdminPackages();
    const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const loading = packagesLoading || categoriesLoading;

    const refetch = () => {
        refetchPackages();
        refetchCategories();
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name || "Unknown";
    };

    const filteredPackages = packages.filter((pkg) => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || pkg.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return;
        try {
            await deletePackage(id);
            toast.success("Package deleted");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete package");
        }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            await toggleVisibility(id, !isActive);
            toast.success(!isActive ? "Package is now visible" : "Package hidden");
        } catch (err: any) {
            toast.error(err.message || "Failed to toggle visibility");
        }
    };

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold">Packages</h1>
                        <p className="text-muted-foreground">Manage all packages across categories</p>
                    </div>
                    <Button onClick={refetch} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search packages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Package className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No packages found</h3>
                            <p className="text-muted-foreground">Create packages from Admin → Packages or adjust filters.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPackages.map((pkg) => (
                            <Card key={pkg.id} className={!pkg.is_active ? "opacity-60" : ""}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <span className="truncate">{pkg.name}</span>
                                        <Badge variant="outline">{getCategoryName(pkg.category_id)}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>

                                    <div className="grid grid-cols-3 gap-1 py-1 border-y border-border/40 text-[10px]">
                                        <div className="text-center">
                                            <span className="block text-muted-foreground font-bold">VIP</span>
                                            <span className="font-black text-primary">{pkg.price_vip ? formatPrice(pkg.price_vip) : "—"}</span>
                                        </div>
                                        <div className="text-center border-x border-border/40">
                                            <span className="block text-muted-foreground font-bold">SPEC</span>
                                            <span className="font-black text-primary">{pkg.price_special ? formatPrice(pkg.price_special) : "—"}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-muted-foreground font-bold">STD</span>
                                            <span className="font-black text-primary">{pkg.price_standard ? formatPrice(pkg.price_standard) : "—"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button variant="ghost" size="sm" onClick={() => handleToggle(pkg.id, pkg.is_active)}>
                                            {pkg.is_active ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                            {pkg.is_active ? "Hide" : "Show"}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(pkg.id)}>
                                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
