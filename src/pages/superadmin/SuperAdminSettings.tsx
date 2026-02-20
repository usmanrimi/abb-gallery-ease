import { useState } from "react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, Save, Palette, CreditCard, Settings, ToggleRight, List } from "lucide-react";

export default function SuperAdminSettings() {
  const { categories, loading: categoriesLoading, updateCategory } = useCategories();
  const { settings, loading: settingsLoading, updateSettings } = useGlobalSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleCategory = async (categoryId: string, name: string, checked: boolean) => {
    const result = await updateCategory(categoryId, { is_coming_soon: checked });
    if (result.success) {
      toast.success(`Category "${name}" updated`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    const result = await updateSettings(settings);
    setIsSaving(false);
  };

  if (settingsLoading || categoriesLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Global System Settings</h1>
            <p className="text-muted-foreground">Configure your gallery, payments, and system behavior</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Changes
          </Button>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <ToggleRight className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding & Identity</CardTitle>
                  <CardDescription>Control the visual identity of your gallery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Store Logo URL</Label>
                      <Input
                        value={settings?.logo_url || ""}
                        onChange={(e) => updateSettings({ logo_url: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Favicon URL</Label>
                      <Input
                        value={settings?.favicon_url || ""}
                        onChange={(e) => updateSettings({ favicon_url: e.target.value })}
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Theme Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="w-12 h-10 p-1"
                          value={settings?.theme_color || "#8B5CF6"}
                          onChange={(e) => updateSettings({ theme_color: e.target.value })}
                        />
                        <Input
                          value={settings?.theme_color || ""}
                          onChange={(e) => updateSettings({ theme_color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Text</Label>
                      <Input
                        value={settings?.footer_text || ""}
                        onChange={(e) => updateSettings({ footer_text: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Gateway (Paystack)</CardTitle>
                  <CardDescription>Configure how you receive payments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Enable Paystack Payments</Label>
                      <p className="text-sm text-muted-foreground">Toggle the entire payment system on or off.</p>
                    </div>
                    <Switch
                      checked={settings?.is_paystack_enabled}
                      onCheckedChange={(checked) => updateSettings({ is_paystack_enabled: checked })}
                    />
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Paystack Public Key</Label>
                      <Input
                        type="password"
                        value={settings?.paystack_public_key || ""}
                        onChange={(e) => updateSettings({ paystack_public_key: e.target.value })}
                        placeholder="pk_live_..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Input value={settings?.currency || "NGN"} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Mode</Label>
                        <Select value={settings?.payment_mode} onValueChange={(v: any) => updateSettings({ payment_mode: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct">Direct Checkout (Instant)</SelectItem>
                            <SelectItem value="custom">Quote Required (Admin Approval)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order Configuration</CardTitle>
                  <CardDescription>Customize order ID generation and tracking.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Order ID Prefix</Label>
                      <Input
                        value={settings?.order_id_prefix || ""}
                        onChange={(e) => updateSettings({ order_id_prefix: e.target.value })}
                        placeholder="MAG/KN/24/"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Serial Number Padding</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={settings?.order_serial_padding || 5}
                        onChange={(e) => updateSettings({ order_serial_padding: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded text-xs text-muted-foreground">
                    Example Order ID: <span className="font-mono text-primary">{settings?.order_id_prefix}{"1".padStart(settings?.order_serial_padding || 5, '0')}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>Enable or disable major system modules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Global Chat System</Label>
                        <p className="text-sm text-muted-foreground">Enable persistent customer-staff chat.</p>
                      </div>
                      <Switch
                        checked={settings?.is_chat_enabled}
                        onCheckedChange={(checked) => updateSettings({ is_chat_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Public Checkout</Label>
                        <p className="text-sm text-muted-foreground">Allow customers to complete purchases.</p>
                      </div>
                      <Switch
                        checked={settings?.is_checkout_enabled}
                        onCheckedChange={(checked) => updateSettings({ is_checkout_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>New User Signup</Label>
                        <p className="text-sm text-muted-foreground">Allow new customers to register accounts.</p>
                      </div>
                      <Switch
                        checked={settings?.is_signup_enabled}
                        onCheckedChange={(checked) => updateSettings({ is_signup_enabled: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <CardTitle>Category Visibility</CardTitle>
                  <CardDescription>Toggle which categories are shown as "Coming Soon".</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary overflow-hidden">
                            {category.image_url ? (
                              <img src={category.image_url} alt={category.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <Label className="text-base font-medium">{category.name}</Label>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {category.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {category.is_coming_soon ? "Coming Soon" : "Visible"}
                          </span>
                          <Switch
                            checked={category.is_coming_soon}
                            onCheckedChange={(checked) => handleToggleCategory(category.id, category.name, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
