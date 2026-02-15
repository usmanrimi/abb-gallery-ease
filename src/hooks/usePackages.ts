import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/categories";

export interface PackageClass {
  id: string;
  name: string;
  price: number;
  description: string;
  sort_order?: number;
}

export interface Package {
  id: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string | null;
  class_image_url: string | null;
  has_classes: boolean;
  base_price: number | null;
  starting_price: number | null;
  is_hidden: boolean;
  classes?: PackageClass[];
}

// Hook to fetch packages from database ONLY (no static fallback)
export function usePackages(categoryId?: string) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchPackages();
  }, [categoryId]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("packages")
        .select("*")
        .eq("is_hidden", false);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data: dbPackages, error: dbError } = await query.order("created_at", { ascending: true });

      if (dbError) {
        console.error("DB error:", dbError);
        setError(new Error(dbError.message));
        setPackages([]);
        setLoading(false);
        return;
      }

      if (dbPackages && dbPackages.length > 0) {
        // Fetch classes for each package
        const packageIds = dbPackages.map(p => p.id);
        const { data: classesData } = await supabase
          .from("package_classes")
          .select("*")
          .in("package_id", packageIds)
          .order("sort_order", { ascending: true });

        const packagesWithClasses = dbPackages.map(pkg => ({
          ...pkg,
          classes: classesData?.filter(c => c.package_id === pkg.id).map(c => ({
            id: c.id,
            name: c.name,
            price: Number(c.price),
            description: c.description || "",
            sort_order: c.sort_order,
          })) || [],
        }));

        setPackages(packagesWithClasses);
      } else {
        // No packages in DB - return empty
        setPackages([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching packages:", err);
    } finally {
      setLoading(false);
    }
  };

  return { packages, loading, error, refetch: fetchPackages };
}

// Hook for admin to fetch ALL packages including hidden ones
export function useAdminPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data: dbPackages, error: dbError } = await supabase
        .from("packages")
        .select("*")
        .order("category_id", { ascending: true })
        .order("created_at", { ascending: true });

      if (dbError) {
        console.error("DB error:", dbError);
        setError(new Error(dbError.message));
        setPackages([]);
        setLoading(false);
        return;
      }

      if (dbPackages && dbPackages.length > 0) {
        // Fetch classes for each package
        const packageIds = dbPackages.map(p => p.id);
        const { data: classesData } = await supabase
          .from("package_classes")
          .select("*")
          .in("package_id", packageIds)
          .order("sort_order", { ascending: true });

        const packagesWithClasses = dbPackages.map(pkg => ({
          ...pkg,
          classes: classesData?.filter(c => c.package_id === pkg.id).map(c => ({
            id: c.id,
            name: c.name,
            price: Number(c.price),
            description: c.description || "",
            sort_order: c.sort_order,
          })) || [],
        }));

        setPackages(packagesWithClasses);
      } else {
        // No packages in DB - admin should create them, don't show static data
        setPackages([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching packages:", err);
    } finally {
      setLoading(false);
    }
  };

  const addPackage = async (pkg: Omit<Package, "id" | "is_hidden" | "classes"> & { classes?: Omit<PackageClass, "id">[] }) => {
    const { data, error } = await supabase
      .from("packages")
      .insert({
        category_id: pkg.category_id,
        name: pkg.name,
        description: pkg.description,
        image_url: pkg.image_url,
        class_image_url: pkg.class_image_url,
        has_classes: pkg.has_classes,
        base_price: pkg.base_price,
        starting_price: pkg.starting_price,
      })
      .select()
      .single();

    if (error) throw error;

    // Add classes if provided
    if (pkg.classes && pkg.classes.length > 0 && data) {
      const classesToInsert = pkg.classes.map((c, index) => ({
        package_id: data.id,
        name: c.name,
        price: c.price,
        description: c.description,
        sort_order: index,
      }));

      await supabase.from("package_classes").insert(classesToInsert);
    }

    await fetchPackages();
    return data;
  };

  const updatePackage = async (id: string, updates: Partial<Omit<Package, "classes">> & { classes?: Omit<PackageClass, "id">[] }) => {
    const { error } = await supabase
      .from("packages")
      .update({
        name: updates.name,
        description: updates.description,
        category_id: updates.category_id,
        image_url: updates.image_url,
        class_image_url: updates.class_image_url,
        has_classes: updates.has_classes,
        base_price: updates.base_price,
        starting_price: updates.starting_price,
        is_hidden: updates.is_hidden,
      })
      .eq("id", id);

    if (error) throw error;

    // Update classes if provided
    if (updates.classes !== undefined) {
      // First delete existing classes
      await supabase
        .from("package_classes")
        .delete()
        .eq("package_id", id);

      // Then insert new classes
      if (updates.classes.length > 0) {
        const classesToInsert = updates.classes.map((c, index) => ({
          package_id: id,
          name: c.name,
          price: c.price,
          description: c.description,
          sort_order: index,
        }));

        await supabase.from("package_classes").insert(classesToInsert);
      }
    }

    await fetchPackages();
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchPackages();
  };

  const toggleVisibility = async (id: string, isHidden: boolean) => {
    const { error } = await supabase
      .from("packages")
      .update({ is_hidden: isHidden })
      .eq("id", id);

    if (error) throw error;
    await fetchPackages();
  };

  return { 
    packages, 
    loading, 
    error, 
    refetch: fetchPackages,
    addPackage,
    updatePackage,
    deletePackage,
    toggleVisibility,
  };
}

// Get category name from ID
export function getCategoryName(categoryId: string): string {
  const category = categories.find(c => c.id === categoryId);
  return category?.name || "Unknown";
}
