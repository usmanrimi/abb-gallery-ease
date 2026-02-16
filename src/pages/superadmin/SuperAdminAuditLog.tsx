import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditEntry {
  id: string;
  actor_id: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  action_type: string | null;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export default function SuperAdminAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching audit log:", error);
      }
      setLogs((data as AuditEntry[]) || []);
    } catch (err) {
      console.error("Audit log error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Unique action types for filter
  const actionTypes = Array.from(new Set(logs.map((l) => l.action_type || l.action).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase()) ||
      log.target_id?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filterAction === "all" || log.action_type === filterAction || log.action === filterAction;

    return matchesSearch && matchesFilter;
  });

  const getActionBadge = (action: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      create_admin: "default",
      change_role: "secondary",
      remove_admin: "destructive",
      update_price: "secondary",
      update_order: "outline",
      confirm_payment: "default",
      create_package: "default",
      edit_package: "secondary",
      delete_package: "destructive",
      update_category: "secondary",
      category_coming_soon: "outline",
      category_go_live: "default",
      verify_payment: "default",
      reject_payment: "destructive",
      respond_to_order: "secondary",
      set_custom_price: "secondary",
    };
    return <Badge variant={colors[action] || "outline"}>{action.replace(/_/g, " ")}</Badge>;
  };

  const formatTimestamp = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Audit Log</h1>
            <p className="text-muted-foreground">
              Track all admin actions across the platform
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by actor, action, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type!}>
                  {type!.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit entries found</h3>
              <p className="text-muted-foreground max-w-md">
                {search || filterAction !== "all"
                  ? "No entries match your filters. Try adjusting your search criteria."
                  : "Audit entries will appear here as admins perform actions."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action_type || log.action)}
                        {log.target_type && (
                          <span className="text-xs text-muted-foreground">
                            on {log.target_type}
                            {log.target_id && (
                              <span className="font-mono ml-1">{log.target_id.slice(0, 8)}</span>
                            )}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{log.actor_email || "Unknown"}</span>
                        {log.actor_role && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {log.actor_role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
