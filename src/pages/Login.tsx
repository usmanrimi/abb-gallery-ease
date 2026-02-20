import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, role, loading, roleError, refreshRole } = useAuth();

  // DEBUG: Check Supabase Config
  useEffect(() => {
    console.log("Supabase Config Check:");
    console.log("URL:", import.meta.env.VITE_SUPABASE_URL ? "Set" : "Missing");
    console.log("Key (Pub):", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "Set" : "Missing");
    console.log("Key (Anon):", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Missing");

    // Alert if critical config is missing
    if (!import.meta.env.VITE_SUPABASE_URL) {
      toast({
        title: "Configuration Error",
        description: "VITE_SUPABASE_URL is missing!",
        variant: "destructive"
      });
    }
    if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      toast({
        title: "Configuration Error",
        description: "Supabase Key is missing!",
        variant: "destructive"
      });
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && role && !roleError) {
      console.log("Redirecting based on role:", role);
      if (role === "super_admin") {
        navigate("/super-admin");
      } else if (role === "admin_ops") {
        navigate("/admin");
      } else if (role === "customer") {
        navigate("/dashboard");
      }
    }
  }, [user, role, loading, navigate, roleError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
    setIsLoading(false);
  };

  if (loading) {
    return (
      <Layout hideFooter>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (roleError && user) {
    return (
      <Layout hideFooter>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-destructive/10 p-3 rounded-full">
                <Mail className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <CardTitle>Profile Load Failed</CardTitle>
            <CardDescription>
              We couldn't load your account details. This often happens if the account creation is still processing or there's a slow connection.
            </CardDescription>
            <div className="pt-4 space-y-2">
              <Button onClick={() => refreshRole()} className="w-full">
                Retry Loading Profile
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-scale-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card variant="elevated">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <img src={logo} alt="M. Abba Gallery" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your M. Abba Gallery account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Create one
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Shopping Made Easy
          </p>
        </div>
      </div>
    </Layout>
  );
}
