import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "./ImageUpload";
import { Category } from "@/hooks/useCategories";
import { Loader2 } from "lucide-react";

interface CategoryEditorProps {
    category?: Category | null;
    onSave: (data: Partial<Category>) => Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
}

export function CategoryEditor({ category, onSave, onCancel, isSaving = false }: CategoryEditorProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        slug: "",
        is_coming_soon: false,
        image_url: ""
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || "",
                description: category.description || "",
                slug: category.slug || "",
                is_coming_soon: !!category.is_coming_soon,
                image_url: category.image_url || ""
            });
        } else {
            setFormData({
                name: "",
                description: "",
                slug: "",
                is_coming_soon: false,
                image_url: ""
            });
        }
    }, [category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [id]: value };

            // Auto-generate slug from name if slug is empty or was auto-generated
            if (id === "name" && (!prev.slug || prev.slug === prev.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""))) {
                newData.slug = value.toLowerCase().trim().replace(/ /g, "-").replace(/[^\w-]+/g, "");
            }

            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Category Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Kayan Lefe"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL identifier)</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder="kayan-lefe"
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">Unique identifier used in the browser address bar.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description of this category..."
                            className="h-24"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="space-y-0.5">
                            <Label htmlFor="is_coming_soon">Coming Soon</Label>
                            <p className="text-[10px] text-muted-foreground">Mark as not yet available for purchase</p>
                        </div>
                        <Switch
                            id="is_coming_soon"
                            checked={formData.is_coming_soon}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_coming_soon: checked }))}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <ImageUpload
                        label="Category Cover Image"
                        defaultValue={formData.image_url}
                        bucket="category-images"
                        onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-w-[120px]"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        category ? "Update Category" : "Create Category"
                    )}
                </Button>
            </div>
        </form>
    );
}
