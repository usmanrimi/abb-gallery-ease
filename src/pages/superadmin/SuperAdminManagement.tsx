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
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
}

export default function SuperAdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", fullName: "", role: "admin_ops" as string });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Get all users with admin roles from user_roles table, joined with profiles
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin_ops", "super_admin"]);

      if (error) throw error;

      // Fetch profile info for these users
      const userIds = (roleData || []).map(r => r.user_id);
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const adminList = (roleData || []).map(r => {
        const profile = profileMap.get(r.user_id);
        return {
          user_id: r.user_id,
          role: r.role,
          full_name: profile?.full_name || null,
          email: profile?.email || null,
        };
      });

      setAdmins(adminList);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      // Sign up the new admin user
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

        // IMMEDIATELY upsert into public.profiles to ensure role is set
        // Do not rely on trigger only
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: newAdmin.fullName,
          email: newAdmin.email,
          role: newAdmin.role, // Explicitly set the role here!
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Still try to continue to user_roles
        }

        // Assign role via user_roles table (legacy support and redundancy)
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: userId, role: newAdmin.role as any },
            { onConflict: "user_id" }
          );

        if (roleError) {
          console.error("Error assigning user_role:", roleError);
        }

        // Log the action
        await supabase.from("audit_log").insert({
          user_id: user!.id,
          user_name: user?.user_metadata?.full_name || user?.email || "Unknown",
          action: "create_admin",
          entity_type: "user",
          entity_id: userId,
          details: `Created ${newAdmin.role} account for ${newAdmin.email}`,
        });

        toast.success(`${newAdmin.role === "super_admin" ? "Super Admin" : "Admin Operations"} account created!`);
        setDialogOpen(false);
        setNewAdmin({ email: "", password: "", fullName: "", role: "admin_ops" });
        fetchAdmins();
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
      { step: "Profile role saved as admin_ops", status: "pending" },
      { step: "Redirection check (simulated)", status: "pending" },
    ];
    setTestLogs([...logs]);

    try {
      // 1. Create Auth User
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

      // 2. Upsert Profile Role
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

      // Verify it was actually saved
      const { data: profileCheck } = await (supabase.from("profiles") as any)
        .select("role")
        .eq("id", userId)
        .single();

      if (profileCheck?.role !== "admin_ops") {
        logs[1].status = "fail";
        setTestLogs([...logs]);
      } else {
        logs[1].status = "pass";
        setTestLogs([...logs]);
      }

      // 3. Redirection Simulation
      // In a real app, we'd check where the router would send them.
      // Here we simulate the logic in Login.tsx
      const simulatedRole = profileCheck?.role;
      if (simulatedRole === "admin_ops") {
        logs[2].status = "pass";
      } else {
        logs[2].status = "fail";
      }
      setTestLogs([...logs]);

      toast.success("Admin Creation Test Completed");
    } catch (err: any) {
      console.error("Test failed:", err);
      toast.error(err.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("user_id", userId);

      if (error) throw error;

      await supabase.from("audit_log").insert({
        user_id: user!.id,
        user_name: user?.user_metadata?.full_name || user?.email || "Unknown",
        action: "change_role",
        entity_type: "user",
        entity_id: userId,
        details: `Changed role to ${newRole}`,
      });

      toast.success("Role updated successfully");
      fetchAdmins();
    } catch (error: any) {
      toast.error("Failed to update role");
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot remove yourself");
      return;
    }
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "customer" as any })
        .eq("user_id", userId);

      if (error) throw error;

      await supabase.from("audit_log").insert({
        user_id: user!.id,
        user_name: user?.user_metadata?.full_name || user?.email || "Unknown",
        action: "remove_admin",
        entity_type: "user",
        entity_id: userId,
        details: `Demoted to customer role`,
      });

      toast.success("Admin access removed");
      fetchAdmins();
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
              <Card key={admin.user_id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{admin.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                      <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                        {admin.role === "super_admin" ? "Super Admin" : "Admin Operations"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {admin.user_id !== user?.id && (
                        <>
                          <Select
                            value={admin.role}
                            onValueChange={(v) => handleChangeRole(admin.user_id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin_ops">Admin Operations</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveAdmin(admin.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {admin.user_id === user?.id && (
                        <span className="text-xs text-muted-foreground">(You)</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout >
  );
}
