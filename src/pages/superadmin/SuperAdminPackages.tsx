import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPackages, getCategoryName } from "@/hooks/usePackages";
import { categories } from "@/data/categories";
import { formatPrice } from "@/data/categories";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, Eye, EyeOff, Search, Loader2, RefreshCw } from "lucide-react";

export default function SuperAdminPackages() {
    const { packages, loading, refetch, addPackage, updatePackage, deletePackage, toggleVisibility } = useAdminPackages();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

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

    const handleToggle = async (id: string, isHidden: boolean) => {
        try {
            await toggleVisibility(id, !isHidden);
            toast.success(isHidden ? "Package is now visible" : "Package hidden");
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
                            <Card key={pkg.id} className={pkg.is_hidden ? "opacity-60" : ""}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <span className="truncate">{pkg.name}</span>
                                        <Badge variant="outline">{getCategoryName(pkg.category_id)}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
                                    {pkg.has_classes && pkg.classes && pkg.classes.length > 0 ? (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Classes: </span>
                                            {pkg.classes.map((c) => (
                                                <Badge key={c.id} variant="secondary" className="mr-1 mb-1">
                                                    {c.name}: {formatPrice(c.price)}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : pkg.base_price ? (
                                        <p className="text-sm font-medium text-primary">{formatPrice(pkg.base_price)}</p>
                                    ) : null}
                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button variant="ghost" size="sm" onClick={() => handleToggle(pkg.id, pkg.is_hidden)}>
                                            {pkg.is_hidden ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                            {pkg.is_hidden ? "Show" : "Hide"}
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
