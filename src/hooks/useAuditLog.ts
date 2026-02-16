import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook that provides a function to log admin/super-admin actions
 * to the audit_log table.
 */
export function useAuditLog() {
    const { user, role } = useAuth();

    const logAction = async (
        action: string,
        options?: {
            actionType?: string;
            targetType?: string;
            targetId?: string;
            details?: string;
        }
    ) => {
        if (!user) return;

        try {
            const { error } = await supabase.from("audit_log").insert({
                actor_id: user.id,
                actor_email: user.email || "",
                actor_role: role || "unknown",
                action,
                action_type: options?.actionType || action,
                target_type: options?.targetType || null,
                target_id: options?.targetId || null,
                details: options?.details || null,
            });

            if (error) {
                console.error("Failed to write audit log:", error);
            }
        } catch (err) {
            // Audit log failure should never block the main action
            console.error("Audit log error:", err);
        }
    };

    return { logAction };
}
