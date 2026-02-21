import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPackages, Package } from "@/hooks/usePackages";
import { useCategories } from "@/hooks/useCategories";
import { formatPrice } from "@/data/categories";
import { toast } from "sonner";
import { Package as PackageIcon, Pencil, Trash2, Eye, EyeOff, Search, Loader2, RefreshCw, Plus } from "lucide-react";
import { PackageEditor } from "@/components/admin/PackageEditor";

export default function SuperAdminPackages() {
    const { packages, loading: packagesLoading, refetch: refetchPackages, addPackage, updatePackage, deletePackage, toggleVisibility } = useAdminPackages();
    const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);

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
            (pkg.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || pkg.category_id === categoryFilter;
        return matchesSearch && matchesCategory;
    });

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
            refetch();
        } catch (error: any) {
            console.error("Error saving package:", error);
            toast.error(error.message || "Failed to save package");
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return;
        try {
            await deletePackage(id);
            toast.success("Package deleted");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete package");
        }
    };

    const handleToggle = async (pkg: Package) => {
        try {
            await toggleVisibility(pkg.id, !pkg.is_active);
            toast.success(!pkg.is_active ? "Package is now visible" : "Package hidden");
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
                    <div className="flex gap-2">
                        <Button onClick={refetch} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                            setIsAddDialogOpen(open);
                            if (!open) setEditingPackage(null);
                        }}>
                            <DialogTrigger asChild>
                                <Button onClick={handleOpenAdd} size="sm">
                                    <Plus className="h-4 w-4 mr-2" /> Add Package
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
                            <PackageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No packages found</h3>
                            <p className="text-muted-foreground">Create packages or adjust filters.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPackages.map((pkg) => (
                            <Card key={pkg.id} className={!pkg.is_active ? "opacity-60 grayscale" : "shadow-sm hover:shadow-md transition-all"}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <span className="truncate">{pkg.name}</span>
                                        <Badge variant="outline">{getCategoryName(pkg.category_id)}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">{pkg.description || "No description provided."}</p>

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

                                    <div className="flex items-center gap-2 pt-2">
                                        <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] font-bold uppercase" onClick={() => handleOpenEdit(pkg)}>
                                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleToggle(pkg)}>
                                            {pkg.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => handleDelete(pkg.id)}>
                                            <Trash2 className="h-4 w-4" />
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
