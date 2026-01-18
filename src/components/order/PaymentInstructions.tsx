import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPrice } from "@/data/categories";

interface PaymentSettings {
  bank_name: string;
  account_name: string;
  account_number: string;
  additional_note: string | null;
}

interface PaymentInstructionsProps {
  amount?: number;
  showAmount?: boolean;
}

export function PaymentInstructions({ amount, showAmount = true }: PaymentInstructionsProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setSettings(data);
    } catch (error: any) {
      console.error("Failed to load payment settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyAccountNumber = () => {
    if (settings?.account_number) {
      navigator.clipboard.writeText(settings.account_number);
      setCopied(true);
      toast.success("Account number copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Payment details not available. Please contact support.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Bank Transfer Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-background border space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Bank</span>
            <span className="font-medium">{settings.bank_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Account Name</span>
            <span className="font-medium">{settings.account_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Account Number</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-primary text-lg">
                {settings.account_number}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyAccountNumber}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {showAmount && amount && (
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm text-muted-foreground">Amount to Transfer</span>
              <span className="font-bold text-xl text-primary">{formatPrice(amount)}</span>
            </div>
          )}
        </div>

        {settings.additional_note && (
          <p className="text-sm text-muted-foreground text-center">
            {settings.additional_note}
          </p>
        )}

        <div className="p-4 rounded-xl bg-muted/50 border border-dashed">
          <p className="text-sm text-center text-muted-foreground">
            Please transfer to the account above. Admin will confirm your order after payment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
