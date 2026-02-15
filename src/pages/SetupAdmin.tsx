import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertTriangle, Shield, UserCog } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

interface AccountConfig {
    email: string;
    password: string;
    fullName: string;
    role: string;
    label: string;
}

const ACCOUNTS: AccountConfig[] = [
    {
        email: "abbatrading2017@gmail.com",
        password: "@MAG2026",
        fullName: "Admin Operations",
        role: "admin_ops",
        label: "Admin Operations",
    },
    {
        email: "abbatrading2013@gmail.com",
        password: "@MAG2026",
        fullName: "Super Admin",
        role: "super_admin",
        label: "Super Admin",
    },
];

export default function SetupAdmin() {
    const [loading, setLoading] = useState<string | null>(null);
    const [status, setStatus] = useState<Record<string, "idle" | "success" | "error">>({});
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSetup = async (account: AccountConfig) => {
        setLoading(account.role);
        setStatus(prev => ({ ...prev, [account.role]: "idle" }));
        setLogs([]);
        addLog(`Setting up ${account.label} (${account.email})...`);

        try {
            let userId: string | undefined;

            // Step 1: Check existing session
            addLog("Checking for existing session...");
            const { data: { session: existingSession } } = await supabase.auth.getSession();

            if (existingSession?.user?.email === account.email) {
                userId = existingSession.user.id;
                addLog(`Already logged in as ${account.email}`);
            }

            // Step 2: Try sign in
            if (!userId) {
                addLog(`Signing in as ${account.email}...`);
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: account.email,
                    password: account.password,
                });

                if (!signInError && signInData.session?.user) {
                    userId = signInData.session.user.id;
                    addLog("Sign in successful.");
                } else if (signInError) {
                    addLog(`Sign in failed: ${signInError.message}`);

                    // Rate limit check
                    if (signInError.message.includes("security") || signInError.message.includes("seconds")) {
                        addLog("Rate limited. Waiting 60s...");
                        await wait(60000);
                    }

                    // Step 3: Try sign up
                    addLog("Attempting sign up...");
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: account.email,
                        password: account.password,
                        options: { data: { full_name: account.fullName } },
                    });

                    if (signUpError) {
                        if (signUpError.message.includes("security") || signUpError.message.includes("rate limit")) {
                            addLog("ERROR: Rate limited. Wait 60s and try again, or create the user manually in Supabase Dashboard → Authentication → Users → Add User.");
                            setStatus(prev => ({ ...prev, [account.role]: "error" }));
                            setLoading(null);
                            return;
                        }
                        throw new Error(`SignUp failed: ${signUpError.message}`);
                    }

                    if (signUpData.user) {
                        userId = signUpData.user.id;
                        addLog("User created.");
                    } else {
                        addLog("WARNING: No user returned. Check Supabase Dashboard for email confirmation.");
                        setStatus(prev => ({ ...prev, [account.role]: "error" }));
                        setLoading(null);
                        return;
                    }
                }
            }

            if (!userId) throw new Error("No User ID obtained.");

            // Step 4: Upsert profile
            addLog(`Setting role to '${account.role}'...`);
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert({
                    id: userId,
                    full_name: account.fullName,
                    email: account.email,
                    role: account.role,
                    updated_at: new Date().toISOString(),
                });

            if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);

            addLog(`SUCCESS: ${account.label} account ready with role '${account.role}'.`);
            setStatus(prev => ({ ...prev, [account.role]: "success" }));
        } catch (error: any) {
            addLog(`ERROR: ${error.message}`);
            console.error(error);
            setStatus(prev => ({ ...prev, [account.role]: "error" }));
        } finally {
            setLoading(null);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto py-10 px-4">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">Account Setup & Repair</CardTitle>
                        <CardDescription>
                            Create or fix admin accounts. If rate limited, wait 60 seconds and retry.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Account Buttons */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {ACCOUNTS.map((account) => (
                                <div key={account.role} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        {account.role === "super_admin" ? (
                                            <Shield className="h-5 w-5 text-red-500" />
                                        ) : (
                                            <UserCog className="h-5 w-5 text-blue-500" />
                                        )}
                                        <h3 className="font-semibold">{account.label}</h3>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>Email: <span className="font-mono text-xs">{account.email}</span></p>
                                        <p>Role: <span className="font-mono text-xs">{account.role}</span></p>
                                    </div>
                                    <Button
                                        onClick={() => handleSetup(account)}
                                        className="w-full"
                                        size="sm"
                                        disabled={loading !== null}
                                        variant={account.role === "super_admin" ? "destructive" : "default"}
                                    >
                                        {loading === account.role ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        {loading === account.role
                                            ? "Working..."
                                            : `Setup ${account.label}`}
                                    </Button>
                                    {status[account.role] === "success" && (
                                        <div className="flex items-center gap-1 text-green-600 text-sm">
                                            <CheckCircle className="h-4 w-4" /> Ready
                                        </div>
                                    )}
                                    {status[account.role] === "error" && (
                                        <div className="flex items-center gap-1 text-red-600 text-sm">
                                            <AlertTriangle className="h-4 w-4" /> Failed — see logs
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Logs */}
                        {logs.length > 0 && (
                            <div className="p-4 bg-slate-100 rounded-md max-h-60 overflow-y-auto text-sm font-mono border">
                                {logs.map((log, i) => (
                                    <div
                                        key={i}
                                        className={
                                            log.includes("ERROR")
                                                ? "text-red-600"
                                                : log.includes("SUCCESS")
                                                    ? "text-green-600 font-bold"
                                                    : log.includes("WARNING")
                                                        ? "text-yellow-600"
                                                        : "text-slate-700"
                                        }
                                    >
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quick Links */}
                        {(status.admin_ops === "success" || status.super_admin === "success") && (
                            <div className="p-4 bg-green-50 text-green-700 rounded-md space-y-2">
                                <p className="font-semibold">✅ Accounts ready! Login links:</p>
                                <div className="flex gap-3 flex-wrap">
                                    <a href="/admin/login" className="underline font-medium">Admin Login →</a>
                                    <a href="/login" className="underline font-medium">Main Login →</a>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
