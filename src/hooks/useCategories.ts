import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Category {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    slug: string;
    is_coming_soon: boolean;
    is_visible: boolean;
    created_at?: string;
}

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: dbError } = await (supabase as any)
                .from("categories")
                .select("*")
                .order("created_at", { ascending: true });

            if (dbError) throw dbError;
            setCategories(data as Category[] || []);
        } catch (err: any) {
            const msg = err.message || "Failed to fetch categories";
            console.error("Error fetching categories:", err);
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const addCategory = async (category: Omit<Category, "id">) => {
        try {
            const { data, error } = await (supabase as any)
                .from("categories")
                .insert(category)
                .select()
                .single();

            if (error) throw error;
            await fetchCategories();
            toast.success("Category added successfully");
            return { success: true, data };
        } catch (err: any) {
            const msg = err.message || "Failed to add category";
            console.error("Error adding category:", err);
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        try {
            const { error } = await (supabase as any)
                .from("categories")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
            await fetchCategories();
            return { success: true };
        } catch (err: any) {
            const msg = err.message || "Failed to update category";
            console.error("Error updating category:", err);
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from("categories")
                .delete()
                .eq("id", id);

            if (error) throw error;
            await fetchCategories();
            toast.success("Category deleted");
            return { success: true };
        } catch (err: any) {
            const msg = err.message || "Failed to delete category";
            console.error("Error deleting category:", err);
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    return {
        categories,
        loading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
        refetch: fetchCategories,
    };
}
