import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Loader2, Save } from "lucide-react";

interface PaymentSettings {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  additional_note: string | null;
}

export function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    additional_note: "",
  });

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

      if (data) {
        setSettings(data);
        setFormData({
          bank_name: data.bank_name,
          account_name: data.account_name,
          account_number: data.account_number,
          additional_note: data.additional_note || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to load payment settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        const { error } = await supabase
          .from("payment_settings")
          .update({
            bank_name: formData.bank_name,
            account_name: formData.account_name,
            account_number: formData.account_number,
            additional_note: formData.additional_note || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_settings").insert({
          bank_name: formData.bank_name,
          account_name: formData.account_name,
          account_number: formData.account_number,
          additional_note: formData.additional_note || null,
        });

        if (error) throw error;
      }

      toast.success("Payment settings saved successfully!");
      fetchSettings();
    } catch (error: any) {
      toast.error("Failed to save payment settings");
      console.error(error);
    } finally {
      setSaving(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Settings (Bank Transfer)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="e.g., Moniepoint"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_name">Account Name</Label>
            <Input
              id="account_name"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              placeholder="e.g., M. Abba Gallery"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_number">Account Number</Label>
          <Input
            id="account_number"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="e.g., 5024793663"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="additional_note">Additional Note (Optional)</Label>
          <Textarea
            id="additional_note"
            value={formData.additional_note}
            onChange={(e) => setFormData({ ...formData, additional_note: e.target.value })}
            placeholder="e.g., Send proof of payment after transfer."
            rows={2}
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
