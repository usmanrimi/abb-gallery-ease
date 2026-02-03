import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { formatPrice, Package, PackageClass } from "@/data/categories";
import { CreditCard, Building2, Copy, Check, Loader2, User, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { customerInfoSchema } from "@/lib/validations";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageData: Package;
  selectedClass: PackageClass;
  quantity: number;
  notes: string;
}

type PaymentMethod = "card" | "transfer";

export function PaymentModal({
  open,
  onOpenChange,
  packageData,
  selectedClass,
  quantity,
  notes,
}: PaymentModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{
    bank_name: string;
    account_name: string;
    account_number: string;
    additional_note: string;
  } | null>(null);

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    email: "",
    whatsappNumber: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const totalAmount = selectedClass.price * quantity;

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .single();

      if (!error && data) {
        setPaymentSettings(data);
      }
    };

    if (open) {
      fetchPaymentSettings();
    }
  }, [open]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const result = customerInfoSchema.safeParse(customerInfo);
    
    if (!result.success) {
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    if (!user) {
      toast.error("Please login to complete your order");
      onOpenChange(false);
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order with 'processing' status (ready for payment)
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        package_name: packageData.name,
        package_class: selectedClass.name,
        quantity,
        notes: notes || null,
        total_price: totalAmount,
        final_price: totalAmount,
        discount_amount: 0,
        payment_method: paymentMethod,
        customer_name: customerInfo.fullName.trim(),
        customer_email: customerInfo.email.trim().toLowerCase(),
        customer_whatsapp: customerInfo.whatsappNumber.trim(),
        status: "processing", // Ready for payment
      });

      if (error) throw error;

      toast.success("Order submitted successfully!");
      onOpenChange(false);
      
      navigate("/order-confirmation", {
        state: {
          cartItems: [{
            id: `${packageData.id}-${selectedClass.id}`,
            package: packageData,
            selectedClass,
            quantity,
            notes,
            unitPrice: selectedClass.price,
          }],
          totalPrice: totalAmount,
          finalPrice: totalAmount,
          paymentMethod,
          hasCustomOrders: false,
        },
      });
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast.error(error.message || "Failed to submit order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="p-4 rounded-xl bg-muted/50">
            <h3 className="font-semibold mb-2">{packageData.name}</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedClass.name} × {quantity}
              </span>
              <span className="font-semibold text-primary">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Information</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="pm-fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pm-fullName"
                    placeholder="Enter your full name"
                    className={cn("pl-10", validationErrors.fullName && "border-destructive")}
                    value={customerInfo.fullName}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, fullName: e.target.value });
                      if (validationErrors.fullName) {
                        setValidationErrors((prev) => ({ ...prev, fullName: "" }));
                      }
                    }}
                    maxLength={100}
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="text-xs text-destructive">{validationErrors.fullName}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="pm-email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pm-email"
                    type="email"
                    placeholder="Enter your email"
                    className={cn("pl-10", validationErrors.email && "border-destructive")}
                    value={customerInfo.email}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, email: e.target.value });
                      if (validationErrors.email) {
                        setValidationErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    maxLength={255}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-xs text-destructive">{validationErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="pm-whatsapp">WhatsApp Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pm-whatsapp"
                    type="tel"
                    placeholder="+234 801 234 5678"
                    className={cn("pl-10", validationErrors.whatsappNumber && "border-destructive")}
                    value={customerInfo.whatsappNumber}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, whatsappNumber: e.target.value });
                      if (validationErrors.whatsappNumber) {
                        setValidationErrors((prev) => ({ ...prev, whatsappNumber: "" }));
                      }
                    }}
                    maxLength={20}
                  />
                </div>
                {validationErrors.whatsappNumber && (
                  <p className="text-xs text-destructive">{validationErrors.whatsappNumber}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h4 className="font-semibold">Payment Method</h4>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="grid gap-3"
            >
              <Label
                htmlFor="transfer"
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
                  paymentMethod === "transfer"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="transfer" id="transfer" />
                <Building2 className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <span className="font-medium">Bank Transfer</span>
                  <p className="text-xs text-muted-foreground">Transfer to our bank account</p>
                </div>
              </Label>
              
              <Label
                htmlFor="card"
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
                  paymentMethod === "card"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="card" id="card" />
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <span className="font-medium">Card Payment</span>
                  <p className="text-xs text-muted-foreground">Pay with debit/credit card</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Bank Transfer Details */}
          {paymentMethod === "transfer" && paymentSettings && (
            <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
              <h4 className="font-semibold text-primary">Bank Transfer Details</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-medium">{paymentSettings.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="font-medium">{paymentSettings.account_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">
                      {paymentSettings.account_number}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(paymentSettings.account_number)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-primary text-lg">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
              
              {paymentSettings.additional_note && (
                <p className="text-xs text-muted-foreground border-t pt-2">
                  {paymentSettings.additional_note}
                </p>
              )}
            </div>
          )}

          {/* Card Payment Note */}
          {paymentMethod === "card" && (
            <div className="p-4 rounded-xl border bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                You will be redirected to complete card payment after order confirmation.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm Order - ${formatPrice(totalAmount)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
