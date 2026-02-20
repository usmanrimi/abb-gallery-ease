import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  image_cover_url: string | null;
  image_detail_url: string | null;
  price_vip: number | null;
  price_special: number | null;
  price_standard: number | null;
  starting_from: number | null;
  is_active: boolean;
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
      let query = (supabase
        .from("packages") as any)
        .select("*")
        .eq("is_active", true);

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
        const packagesWithClasses = (dbPackages as any[]).map(pkg => {
          const dynamicClasses: PackageClass[] = [];
          if (pkg.price_vip) {
            dynamicClasses.push({
              id: "vip",
              name: "VIP",
              price: Number(pkg.price_vip),
              description: "Premium quality with luxury items and exclusive service.",
              sort_order: 1
            });
          }
          if (pkg.price_special) {
            dynamicClasses.push({
              id: "special",
              name: "Special",
              price: Number(pkg.price_special),
              description: "High quality selection with carefully curated items.",
              sort_order: 2
            });
          }
          if (pkg.price_standard) {
            dynamicClasses.push({
              id: "standard",
              name: "Standard",
              price: Number(pkg.price_standard),
              description: "Quality items suitable for everyday celebrations.",
              sort_order: 3
            });
          }

          return {
            ...pkg,
            classes: dynamicClasses,
          };
        });

        setPackages(packagesWithClasses as Package[]);
      } else {
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
      const { data: dbPackages, error: dbError } = await (supabase
        .from("packages") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) {
        console.error("DB error:", dbError);
        setError(new Error(dbError.message));
        setPackages([]);
        setLoading(false);
        return;
      }

      if (dbPackages && dbPackages.length > 0) {
        const packagesWithClasses = (dbPackages as any[]).map(pkg => {
          const dynamicClasses: PackageClass[] = [];
          if (pkg.price_vip) {
            dynamicClasses.push({
              id: "vip",
              name: "VIP",
              price: Number(pkg.price_vip),
              description: "Premium quality with luxury items and exclusive service.",
              sort_order: 1
            });
          }
          if (pkg.price_special) {
            dynamicClasses.push({
              id: "special",
              name: "Special",
              price: Number(pkg.price_special),
              description: "High quality selection with carefully curated items.",
              sort_order: 2
            });
          }
          if (pkg.price_standard) {
            dynamicClasses.push({
              id: "standard",
              name: "Standard",
              price: Number(pkg.price_standard),
              description: "Quality items suitable for everyday celebrations.",
              sort_order: 3
            });
          }

          return {
            ...pkg,
            classes: dynamicClasses,
          };
        });

        setPackages(packagesWithClasses as Package[]);
      } else {
        setPackages([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching packages:", err);
    } finally {
      setLoading(false);
    }
  };

  const logAuditAction = async (action: string, targetId: string, details: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await (supabase
        .from("profiles") as any)
        .select("email, role")
        .eq("id", user.id)
        .single();

      await (supabase.from("audit_log") as any).insert({
        actor_id: user.id,
        actor_email: (profile as any)?.email || user.email || "",
        actor_role: (profile as any)?.role || "unknown",
        action,
        action_type: action,
        target_type: "package",
        target_id: targetId,
        details,
      });
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  const addPackage = async (pkg: Omit<Package, "id" | "is_active" | "classes">) => {
    const { data, error } = await (supabase
      .from("packages") as any)
      .insert({
        category_id: pkg.category_id,
        name: pkg.name,
        description: pkg.description,
        image_cover_url: pkg.image_cover_url,
        image_detail_url: pkg.image_detail_url,
        price_vip: pkg.price_vip,
        price_special: pkg.price_special,
        price_standard: pkg.price_standard,
        starting_from: pkg.starting_from,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditAction("create_package", data?.id || "", `Created package: ${pkg.name}`);
    await fetchPackages();
    return data;
  };

  const updatePackage = async (id: string, updates: Partial<Omit<Package, "classes">>) => {
    const { error } = await (supabase
      .from("packages") as any)
      .update({
        name: updates.name,
        description: updates.description,
        category_id: updates.category_id,
        image_cover_url: updates.image_cover_url,
        image_detail_url: updates.image_detail_url,
        price_vip: updates.price_vip,
        price_special: updates.price_special,
        price_standard: updates.price_standard,
        starting_from: updates.starting_from,
        is_active: updates.is_active,
      })
      .eq("id", id);

    if (error) throw error;

    await logAuditAction("edit_package", id, `Updated package: ${updates.name || id}`);
    await fetchPackages();
  };

  const deletePackage = async (id: string) => {
    const pkg = packages.find(p => p.id === id);
    const { error } = await (supabase
      .from("packages") as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
    await logAuditAction("delete_package", id, `Deleted package: ${pkg?.name || id}`);
    await fetchPackages();
  };

  const toggleVisibility = async (id: string, isActive: boolean) => {
    const pkg = packages.find(p => p.id === id);
    const { error } = await (supabase
      .from("packages") as any)
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) throw error;
    await logAuditAction(
      isActive ? "show_package" : "hide_package",
      id,
      `${isActive ? "Shown" : "Hidden"} package: ${pkg?.name || id}`
    );
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
