import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { CheckCircle2, XCircle, AlertTriangle, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminQA() {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [checks, setChecks] = useState<any[]>([]);

    const runChecks = async () => {
        setLoading(true);
        const results = [];

        // 1. Auth Check
        results.push({
            name: "Authentication",
            status: user ? "pass" : "fail",
            message: user ? `Logged in as ${user.email}` : "Not logged in",
        });

        // 2. Role Check
        results.push({
            name: "Role Verification",
            status: role === "super_admin" ? "pass" : "fail",
            message: `Current role: ${role}`,
        });

        // 3. Profiles Table Access
        try {
            const { data, error } = await supabase.from("profiles").select("count").single();
            results.push({
                name: "DB: Profiles Access",
                status: error ? "fail" : "pass",
                message: error ? error.message : "Read access confirmed",
            });
        } catch (e: any) {
            results.push({ name: "DB: Profiles Access", status: "fail", message: e.message });
        }

        // 4. Categories Access
        try {
            const { data, error } = await supabase.from("categories").select("*").limit(1);
            results.push({
                name: "DB: Categories Data",
                status: !error ? "pass" : "fail",
                message: error ? error.message : `Found ${data?.length || 0} categories`,
            });
        } catch (e: any) {
            results.push({ name: "DB: Categories Data", status: "fail", message: e.message });
        }

        // 5. Orders Access
        try {
            const { error } = await supabase.from("orders").select("id").limit(1);
            results.push({
                name: "DB: Orders Access",
                status: !error ? "pass" : "fail",
                message: error ? error.message : "Read access confirmed",
            });
        } catch (e: any) {
            results.push({ name: "DB: Orders Access", status: "fail", message: e.message });
        }

        // 6. Paystack Config Check
        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        results.push({
            name: "Env: Paystack Key",
            status: paystackKey ? "pass" : "fail",
            message: paystackKey ? "Key present (starts with pk_...)" : "Missing VITE_PAYSTACK_PUBLIC_KEY",
        });

        setChecks(results);
        setLoading(false);
    };

    useEffect(() => {
        runChecks();
    }, []);

    const copyReport = () => {
        const report = checks.map(c => `[${c.status.toUpperCase()}] ${c.name}: ${c.message}`).join("\n");
        navigator.clipboard.writeText(report);
        toast.success("Debug report copied to clipboard");
    };

    return (
        <Layout>
            <div className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">System QA Dashboard</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={runChecks} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Rerun Checks
                        </Button>
                        <Button onClick={copyReport}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Report
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {checks.map((check, index) => (
                        <Card key={index} className={check.status === "pass" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {check.name}
                                </CardTitle>
                                {check.status === "pass" ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground mt-2 font-mono break-all">
                                    {check.message}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Route Protection Verification</h2>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" onClick={() => window.open('/admin', '_blank')}>Test Admin Route</Button>
                        <Button variant="secondary" onClick={() => window.open('/customer', '_blank')}>Test Customer Route</Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
