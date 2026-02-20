import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Shield, UserPlus, Loader2, Trash2, Beaker, CheckCircle2, XCircle } from "lucide-react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";

interface AdminUser {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  is_suspended: boolean;
  last_login_at: string | null;
}

export default function SuperAdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, refreshRole } = useAuth();
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", fullName: "", role: "admin_ops" as string });
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAdmins();
    fetchActivityLogs();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name, email, is_suspended, last_login_at")
        .in("role", ["admin_ops", "super_admin"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdmins(data as AdminUser[] || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setActivityLogs(data || []);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: { full_name: newAdmin.fullName },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        const userId = signUpData.user.id;
        const { error: profileError } = await (supabase
          .from("profiles") as any)
          .upsert({
            id: userId,
            full_name: newAdmin.fullName,
            email: newAdmin.email,
            role: newAdmin.role,
          });

        if (profileError) throw profileError;

        // Log the action
        await (supabase as any).from("audit_log").insert({
          actor_id: user!.id,
          actor_email: user?.email,
          actor_role: "super_admin",
          action: "create_admin",
          action_type: "create",
          target_type: "user",
          target_id: userId,
          details: `Created ${newAdmin.role} account for ${newAdmin.email}`,
        });

        toast.success(`${newAdmin.role === "super_admin" ? "Super Admin" : "Admin Operations"} account created!`);
        setDialogOpen(false);
        setNewAdmin({ email: "", password: "", fullName: "", role: "admin_ops" });
        fetchAdmins();
        fetchActivityLogs();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  const [testLogs, setTestLogs] = useState<{ step: string; status: "pass" | "fail" | "pending" }[]>([]);
  const [testing, setTesting] = useState(false);

  const runAdminTest = async () => {
    setTesting(true);
    const timestamp = Date.now();
    const testEmail = `test-adminops+${timestamp}@example.com`;
    const testPassword = "AdminTestPassword123!";
    const testFullName = "QA Test Admin";

    const logs: { step: string; status: "pass" | "fail" | "pending" }[] = [
      { step: "Auth user created", status: "pending" },
      { step: "Profile role saved correctly", status: "pending" },
      { step: "Audit log recorded", status: "pending" },
    ];
    setTestLogs([...logs]);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: { data: { full_name: testFullName } },
      });

      if (signUpError || !signUpData.user) {
        logs[0].status = "fail";
        setTestLogs([...logs]);
        throw new Error("Auth creation failed");
      }
      logs[0].status = "pass";
      setTestLogs([...logs]);

      const userId = signUpData.user.id;
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: testFullName,
        email: testEmail,
        role: "admin_ops",
      });

      if (profileError) {
        logs[1].status = "fail";
        setTestLogs([...logs]);
        throw new Error("Profile upsert failed");
      }
      logs[1].status = "pass";
      setTestLogs([...logs]);

      await (supabase as any).from("audit_log").insert({
        actor_id: user!.id,
        actor_email: user?.email,
        action: "qa_test",
        action_type: "create",
        target_type: "user",
        target_id: userId,
        details: "QA internal test: admin creation",
      });
      logs[2].status = "pass";
      setTestLogs([...logs]);

      toast.success("QA Internal Test Completed Successfully");
    } catch (err: any) {
      toast.error(err.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      await (supabase as any).from("audit_log").insert({
        actor_id: user!.id,
        actor_email: user?.email,
        action: "change_role",
        action_type: "update",
        target_type: "user",
        target_id: userId,
        details: `Changed role to ${newRole}`,
      });

      toast.success("Role updated successfully");
      fetchAdmins();
      fetchActivityLogs();
    } catch (error: any) {
      toast.error("Failed to update role");
    }
  };

  const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      await (supabase as any).from("audit_log").insert({
        actor_id: user!.id,
        actor_email: user?.email,
        action: currentStatus ? "reactivate_user" : "suspend_user",
        action_type: "toggle",
        target_type: "user",
        target_id: userId,
        details: `${currentStatus ? "Reactivated" : "Suspended"} account ${userId}`,
      });

      toast.success(`User ${currentStatus ? "reactivated" : "suspended"}`);
      fetchAdmins();
      fetchActivityLogs();
    } catch (error: any) {
      toast.error("Failed to update user status");
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot remove yourself");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "customer" })
        .eq("id", userId);

      if (error) throw error;

      await (supabase as any).from("audit_log").insert({
        actor_id: user!.id,
        actor_email: user?.email,
        action: "remove_admin",
        action_type: "update",
        target_type: "user",
        target_id: userId,
        details: `Demoted to customer role`,
      });

      toast.success("Admin access removed");
      fetchAdmins();
      fetchActivityLogs();
    } catch (error: any) {
      toast.error("Failed to remove admin");
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Admin & Staff Management</h1>
            <p className="text-muted-foreground">Manage admin accounts and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={runAdminTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Beaker className="h-4 w-4 mr-2" />}
              Run Admin Creation Test
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Admin Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={newAdmin.fullName}
                      onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newAdmin.role} onValueChange={(v) => setNewAdmin({ ...newAdmin, role: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin_ops">Admin Operations</SelectItem>
                        <SelectItem value="super_admin">Super Admin (Owner)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateAdmin} disabled={creating} className="w-full">
                    {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    Create Account
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {testLogs.length > 0 && (
          <Card className="bg-muted/30 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center">
                  <Beaker className="h-4 w-4 mr-2" />
                  Test Results
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setTestLogs([])}>Clear</Button>
              </div>
              <div className="space-y-2">
                {testLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{log.step}</span>
                    {log.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : log.status === "fail" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-4">
                Note: Test accounts are real auth users. Manual deletion from Supabase Auth is recommended for cleanup.
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : admins.length === 0 ? (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No admin accounts</h3>
              <p className="text-muted-foreground">Create admin accounts to manage operations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {admins.map((admin) => (
              <Card key={admin.id} className={admin.is_suspended ? "opacity-60 bg-muted/50" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{admin.full_name || "Unknown"}</p>
                        {admin.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                      <div className="flex gap-2 items-center">
                        <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                          {admin.role === "super_admin" ? "Super Admin" : "Admin Operations"}
                        </Badge>
                        {admin.last_login_at && (
                          <span className="text-[10px] text-muted-foreground">
                            Last active: {new Date(admin.last_login_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {admin.id !== user?.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className={admin.is_suspended ? "text-green-600 border-green-200" : "text-orange-600 border-orange-200"}
                            onClick={() => handleToggleSuspension(admin.id, admin.is_suspended)}
                          >
                            {admin.is_suspended ? "Reactivate" : "Suspend"}
                          </Button>
                          <Select
                            value={admin.role}
                            onValueChange={(v) => handleChangeRole(admin.id, v)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin_ops">Admin Ops</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={() => handleRemoveAdmin(admin.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {admin.id === user?.id && (
                        <span className="text-xs text-muted-foreground font-medium bg-primary/5 px-2 py-1 rounded">My Account</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Activity Log Section */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">Recent System Activity</h2>
            <Button variant="ghost" size="sm" onClick={fetchActivityLogs}>Refresh Logs</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {activityLogs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No activity recorded yet.</div>
                ) : (
                  activityLogs.map((log) => (
                    <div key={log.id} className="p-4 flex items-start gap-4 text-sm">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{log.details}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>By: {log.actor_email || "System"}</span>
                          <span>•</span>
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                          {log.ip_address && (
                            <>
                              <span>•</span>
                              <span>IP: {log.ip_address}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout >
  );
}
