import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GlobalSettings {
    id: string;
    logo_url: string | null;
    favicon_url: string | null;
    theme_color: string;
    footer_text: string;
    paystack_public_key: string | null;
    is_paystack_enabled: boolean;
    currency: string;
    payment_mode: 'direct' | 'custom';
    order_id_prefix: string;
    order_serial_padding: number;
    is_chat_enabled: boolean;
    is_checkout_enabled: boolean;
    is_signup_enabled: boolean;
    updated_at: string;
    updated_by: string | null;
}

export function useGlobalSettings() {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from("global_settings")
                .select("*")
                .eq("id", "current")
                .maybeSingle();

            if (error) throw error;
            if (data) {
                setSettings(data as GlobalSettings);
            }
        } catch (err: any) {
            console.error("Error fetching global settings:", err);
            toast.error("Failed to load global settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (updates: Partial<GlobalSettings>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await (supabase as any)
                .from("global_settings")
                .update({ ...updates, updated_at: new Promise(resolve => resolve(new Date().toISOString())), updated_by: user?.id })
                .eq("id", "current");

            if (error) throw error;
            await fetchSettings();
            toast.success("Settings updated successfully");
            return { success: true };
        } catch (err: any) {
            console.error("Error updating settings:", err);
            toast.error(err.message || "Failed to update settings");
            return { success: false, error: err };
        }
    };

    return {
        settings,
        loading,
        updateSettings,
        refetch: fetchSettings
    };
}
