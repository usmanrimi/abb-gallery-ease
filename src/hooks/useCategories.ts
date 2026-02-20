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
}

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error: dbError } = await (supabase as any)
                .from("categories")
                .select("*")
                .order("created_at", { ascending: true });

            if (dbError) throw dbError;
            setCategories(data as Category[] || []);
        } catch (err: any) {
            console.error("Error fetching categories:", err);
            setError(err);
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
            return { success: true, data };
        } catch (err: any) {
            console.error("Error adding category:", err);
            return { success: false, error: err };
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
            console.error("Error updating category:", err);
            return { success: false, error: err };
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
            return { success: true };
        } catch (err: any) {
            console.error("Error deleting category:", err);
            return { success: false, error: err };
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
