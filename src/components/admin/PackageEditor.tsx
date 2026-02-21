import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Package } from "@/hooks/usePackages";
import { Category } from "@/hooks/useCategories";

interface PackageEditorProps {
    categories: Category[];
    editingPackage: Package | null;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export function PackageEditor({ categories, editingPackage, onSave, onCancel }: PackageEditorProps) {
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingPackage) {
            setFormData({
                category_id: editingPackage.category_id || "",
                name: editingPackage.name || "",
                description: editingPackage.description || "",
                image_cover_url: editingPackage.image_cover_url || "",
                image_detail_url: editingPackage.image_detail_url || "",
                price_vip: editingPackage.price_vip?.toString() || "",
                price_special: editingPackage.price_special?.toString() || "",
                price_standard: editingPackage.price_standard?.toString() || "",
                starting_from: editingPackage.starting_from?.toString() || "",
            });
        } else {
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
        }
    }, [editingPackage, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                price_vip: formData.price_vip ? Number(formData.price_vip) : null,
                price_special: formData.price_special ? Number(formData.price_special) : null,
                price_standard: formData.price_standard ? Number(formData.price_standard) : null,
                starting_from: formData.starting_from ? Number(formData.starting_from) : null,
            };
            await onSave(submitData);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-2">
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Package Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Alhaji Babba Package"
                            className="h-8 text-sm"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                            <SelectTrigger className="h-8 text-sm">
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

                <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter package details..."
                        rows={2}
                        className="resize-none text-sm min-h-[60px]"
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
                    <h3 className="text-[11px] font-black uppercase tracking-tighter mb-3 text-primary">Class Section</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider">VIP Price</Label>
                            <Input
                                type="number"
                                value={formData.price_vip}
                                onChange={(e) => setFormData({ ...formData, price_vip: e.target.value })}
                                placeholder="0"
                                className="h-8 text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-1 px-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-primary">Special Price</Label>
                            <Input
                                type="number"
                                value={formData.price_special}
                                onChange={(e) => setFormData({ ...formData, price_special: e.target.value })}
                                placeholder="0"
                                className="h-8 text-sm font-bold border-primary/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider">Standard Price</Label>
                            <Input
                                type="number"
                                value={formData.price_standard}
                                onChange={(e) => setFormData({ ...formData, price_standard: e.target.value })}
                                placeholder="0"
                                className="h-8 text-sm font-bold"
                            />
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-dashed border-border/50">
                        <div className="space-y-1 max-w-[150px]">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Manual Start Price</Label>
                            <Input
                                type="number"
                                value={formData.starting_from}
                                onChange={(e) => setFormData({ ...formData, starting_from: e.target.value })}
                                placeholder="0"
                                className="h-7 text-[11px] italic"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                    {editingPackage ? "Save Changes" : "Create Package"}
                </Button>
            </div>
        </form>
    );
}
