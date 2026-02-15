import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DebugEnv() {
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [config, setConfig] = useState<any>({});

    const checkConnection = async () => {
        setStatus("loading");
        setMessage("Testing connection...");

        const url = import.meta.env.VITE_SUPABASE_URL;
        const pubKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        setConfig({
            url: url ? `${url.substring(0, 8)}...` : "MISSING",
            pubKey: pubKey ? `${pubKey.substring(0, 5)}...` : "MISSING",
            anonKey: anonKey ? `${anonKey.substring(0, 5)}...` : "MISSING",
        });

        try {
            // Simple query to test connection
            const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true });

            if (error) {
                throw error;
            }

            setStatus("success");
            setMessage("Connected to Supabase successfully!");
        } catch (err: any) {
            console.error("Connection error:", err);
            setStatus("error");
            setMessage(err.message || "Failed to connect");
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Environment Debugger</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-semibold">VITE_SUPABASE_URL:</div>
                        <div className={config.url === "MISSING" ? "text-red-500 font-bold" : "text-green-600"}>
                            {config.url}
                        </div>

                        <div className="font-semibold">VITE_SUPABASE_PUBLISHABLE_KEY:</div>
                        <div className={config.pubKey === "MISSING" ? "text-red-500 font-bold" : "text-green-600"}>
                            {config.pubKey}
                        </div>

                        <div className="font-semibold">VITE_SUPABASE_ANON_KEY:</div>
                        <div className={config.anonKey === "MISSING" ? "text-orange-500 font-bold" : "text-green-600"}>
                            {config.anonKey}
                        </div>
                    </div>

                    <div className={`p-4 rounded-md ${status === "success" ? "bg-green-100 text-green-800" :
                            status === "error" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}>
                        <span className="font-bold">Status:</span> {message}
                    </div>

                    <Button onClick={checkConnection} className="w-full">
                        Retry Connection
                    </Button>

                    <p className="text-xs text-muted-foreground mt-4">
                        If "Key (Pub)" is MISSING, ensure <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> is set in Vercel.
                        <br />
                        If "Key (Anon)" is present, the app should work via fallback.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
