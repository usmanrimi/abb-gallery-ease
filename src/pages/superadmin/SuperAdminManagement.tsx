import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Shield, UserPlus, Loader2, Trash2 } from "lucide-react";
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
      // Get all profiles with admin roles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .in("role", ["admin_ops", "super_admin"]);

      if (error) throw error;

      const adminList = (profiles || []).map(p => ({
        user_id: p.id,
        role: p.role,
        full_name: p.full_name || null,
        email: p.email || null,
      }));

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
        // Update the role in profiles table - This is the Single Source of Truth
        // Note: The profile row is usually created by a trigger on auth.users, 
        // but we need to ensure the role is updated

        // Wait a moment for trigger to create profile if it exists, otherwise insert/update
        setTimeout(async () => {
          const { error: roleError } = await supabase
            .from("profiles")
            .update({
              role: newAdmin.role as any,
              full_name: newAdmin.fullName
            })
            .eq("id", signUpData.user!.id);

          if (roleError) {
            console.error("Error updating profile role:", roleError);
            toast.error("User created but failed to assign role. Please try updating role manually.");
          } else {
            // Log the action
            await supabase.from("audit_log").insert({
              user_id: user!.id,
              user_name: user?.user_metadata?.full_name || user?.email || "Unknown",
              action: "create_admin",
              entity_type: "user",
              entity_id: signUpData.user!.id,
              details: `Created ${newAdmin.role} account for ${newAdmin.email}`,
            });

            toast.success(`${newAdmin.role === "super_admin" ? "Super Admin" : "Admin Operations"} account created!`);
            setDialogOpen(false);
            setNewAdmin({ email: "", password: "", fullName: "", role: "admin_ops" });
            fetchAdmins();
          }
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole as any })
        .eq("id", userId);

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
        .from("profiles")
        .update({ role: "customer" as any })
        .eq("id", userId);

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
    </SuperAdminLayout>
  );
}
