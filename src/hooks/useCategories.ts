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
            const { data, error: dbError } = await (supabase
                .from("categories") as any)
                .select("*")
                .order("created_at", { ascending: true });

            if (dbError) throw dbError;
            setCategories(data as Category[] || []);
        } catch (err: any) {
            console.error("Error fetching categories:", err);
            setError(err);
            toast.error(err.message || "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const addCategory = async (category: Omit<Category, "id">) => {
        try {
            const { data, error } = await (supabase
                .from("categories") as any)
                .insert(category)
                .select()
                .single();

            if (error) throw error;
            await fetchCategories();
            return data;
        } catch (err: any) {
            toast.error(err.message || "Failed to add category");
            throw err;
        }
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        try {
            const { error } = await (supabase
                .from("categories") as any)
                .update(updates)
                .eq("id", id);

            if (error) throw error;
            await fetchCategories();
        } catch (err: any) {
            toast.error(err.message || "Failed to update category");
            throw err;
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            const { error } = await (supabase
                .from("categories") as any)
                .delete()
                .eq("id", id);

            if (error) throw error;
            await fetchCategories();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete category");
            throw err;
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
