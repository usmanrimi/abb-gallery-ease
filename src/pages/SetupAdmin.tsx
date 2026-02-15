import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function SetupAdmin() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSetup = async () => {
        setLoading(true);
        setStatus("idle");
        setLogs([]);
        addLog("Starting Admin Setup...");

        const email = "abbatrading2017@gmail.com";
        const password = "@MAG2026";
        const fullName = "Admin Operations";

        try {
            let userId: string | undefined;

            // Step 1: Check if already logged in
            addLog("Checking for existing session...");
            const { data: { session: existingSession } } = await supabase.auth.getSession();

            if (existingSession?.user) {
                userId = existingSession.user.id;
                addLog(`Already logged in as: ${existingSession.user.email} (ID: ${userId})`);
            }

            // Step 2: If no session, try sign in
            if (!userId) {
                addLog(`Attempting sign in as ${email}...`);
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (!signInError && signInData.session?.user) {
                    userId = signInData.session.user.id;
                    addLog("Sign in successful.");
                } else if (signInError) {
                    addLog(`Sign in failed: ${signInError.message}`);

                    // Check for rate limit
                    if (signInError.message.includes("security") || signInError.message.includes("seconds")) {
                        addLog("Rate limited. Waiting 60 seconds before trying signup...");
                        addLog("Please wait...");
                        await wait(60000);
                    }

                    // Step 3: Try sign up
                    addLog("Attempting sign up...");
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: { full_name: fullName }
                        }
                    });

                    if (signUpError) {
                        // If rate limited again, give manual instructions
                        if (signUpError.message.includes("security") || signUpError.message.includes("seconds")) {
                            addLog("ERROR: Still rate limited by Supabase.");
                            addLog("ALTERNATIVE: Create this user manually in Supabase Dashboard → Authentication → Users → Add User");
                            addLog(`Email: ${email}, Password: ${password}`);
                            addLog("Then come back and click the button again to set the role.");
                            setStatus("error");
                            setLoading(false);
                            return;
                        }
                        throw new Error(`SignUp failed: ${signUpError.message}`);
                    }

                    if (signUpData.user) {
                        userId = signUpData.user.id;
                        addLog("User created successfully.");
                    } else {
                        addLog("WARNING: SignUp returned no user. The account may need email confirmation.");
                        addLog("Check Supabase Dashboard → Authentication → Users to see if the user exists.");
                        addLog("If the user exists, try clicking the button again after 60 seconds.");
                        setStatus("error");
                        setLoading(false);
                        return;
                    }
                }
            }

            if (!userId) {
                throw new Error("Could not obtain a User ID. Please try again in 60 seconds.");
            }

            // Step 4: Upsert profile with admin_ops role
            addLog(`Updating profile for User ID: ${userId}...`);
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: fullName,
                    role: 'admin_ops',
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                throw new Error(`Profile update failed: ${profileError.message}`);
            }

            addLog("SUCCESS: Profile updated to 'admin_ops'.");
            setStatus("success");

        } catch (error: any) {
            addLog(`ERROR: ${error.message}`);
            console.error(error);
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto py-10 px-4">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">Admin Setup & Repair</CardTitle>
                        <CardDescription>
                            Create or fix the main Admin Operations account. If you get a rate limit error, wait 60 seconds and try again.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-md">
                            <h3 className="font-semibold mb-2">Target Account:</h3>
                            <p>Email: <span className="font-mono">abbatrading2017@gmail.com</span></p>
                            <p>Role: <span className="font-mono">admin_ops</span></p>
                            <p>Password: <span className="font-mono">@MAG2026</span></p>
                        </div>

                        <Button
                            onClick={handleSetup}
                            className="w-full"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loading ? "Working... (may take up to 60s)" : "Create / Fix Admin Account"}
                        </Button>

                        {logs.length > 0 && (
                            <div className="mt-6 p-4 bg-slate-100 rounded-md max-h-60 overflow-y-auto text-sm font-mono border">
                                {logs.map((log, i) => (
                                    <div key={i} className={log.includes("ERROR") ? "text-red-600" : log.includes("SUCCESS") ? "text-green-600 font-bold" : log.includes("WARNING") ? "text-yellow-600" : "text-slate-700"}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}

                        {status === "success" && (
                            <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                <span>Admin account is ready! You can now <a href="/admin/login" className="underline font-bold">Log In</a>.</span>
                            </div>
                        )}
                        {status === "error" && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                <span>Setup failed. Check the logs above. Try again in 60 seconds.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
