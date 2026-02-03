import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CategorySetting {
  id: string;
  category_slug: string;
  coming_soon: boolean;
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

  const isComingSoon = (slug: string): boolean => {
    const setting = settings.find((s) => s.category_slug === slug);
    return setting?.coming_soon ?? (slug === "seasonal" || slug === "haihuwa");
  };

  const updateComingSoon = async (slug: string, comingSoon: boolean) => {
    try {
      // Check if setting exists
      const existing = settings.find((s) => s.category_slug === slug);
      
      if (existing) {
        const { error } = await supabase
          .from("category_settings")
          .update({ coming_soon: comingSoon, updated_at: new Date().toISOString() })
          .eq("category_slug", slug);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("category_settings")
          .insert({ category_slug: slug, coming_soon: comingSoon });

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
