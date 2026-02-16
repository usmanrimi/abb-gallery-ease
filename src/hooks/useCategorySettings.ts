import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CategorySetting {
  id: string;
  category_id: string;
  is_coming_soon: boolean;
  updated_at: string;
}

export function useCategorySettings() {
  const [settings, setSettings] = useState<CategorySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from("category_settings")
        .select("*");

      if (dbError) throw dbError;
      setSettings(data || []);
    } catch (err) {
      console.error("Error fetching category settings:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isComingSoon = (categoryId: string): boolean => {
    const setting = settings.find((s) => s.category_id === categoryId);
    // Default: "3" (Haihuwa) and "4" (Seasonal) are coming soon unless overridden
    return setting?.is_coming_soon ?? (categoryId === "3" || categoryId === "4");
  };

  const updateComingSoon = async (categoryId: string, comingSoon: boolean) => {
    try {
      const existing = settings.find((s) => s.category_id === categoryId);

      if (existing) {
        const { error } = await supabase
          .from("category_settings")
          .update({ is_coming_soon: comingSoon, updated_at: new Date().toISOString() })
          .eq("category_id", categoryId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("category_settings")
          .insert({ category_id: categoryId, is_coming_soon: comingSoon });

        if (error) throw error;
      }

      await fetchSettings();
      return { success: true };
    } catch (err) {
      console.error("Error updating category setting:", err);
      return { success: false, error: err };
    }
  };

  return {
    settings,
    loading,
    error,
    isComingSoon,
    updateComingSoon,
    refetch: fetchSettings,
  };
}
