import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/data/categories";
import { Loader2, User, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { customerInfoSchema } from "@/lib/validations";

interface PackageData {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  hasClasses: boolean;
  basePrice?: number;
  startingPrice?: number;
}

interface ClassData {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageData: PackageData;
  selectedClass: ClassData;
  quantity: number;
  notes: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    email: "",
    whatsappNumber: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const totalAmount = selectedClass.price * quantity;

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
      // Create order with pending_payment status (strictly Paystack)
      const { data: orderData, error } = await supabase.from("orders").insert({
        user_id: user.id,
        package_name: packageData.name,
        package_class: selectedClass.name,
        quantity,
        notes: notes || null,
        total_price: totalAmount,
        final_price: totalAmount,
        discount_amount: 0,
        payment_method: "paystack",
        payment_status: "pending_payment",
        customer_name: customerInfo.fullName.trim(),
        customer_email: customerInfo.email.trim().toLowerCase(),
        customer_whatsapp: customerInfo.whatsappNumber.trim(),
        status: "pending_payment",
      }).select().single();

      if (error) throw error;

      if (orderData) {
        // Initialize Paystack payment
        try {
          const { data: result, error: paystackError } = await supabase.functions.invoke("paystack", {
            body: {
              action: "initialize",
              email: customerInfo.email.trim().toLowerCase(),
              amount: totalAmount,
              orderId: orderData.id,
              callback_url: `${window.location.origin}/order-confirmation`,
              metadata: {
                customer_name: customerInfo.fullName,
                package_name: packageData.name,
              },
            },
          });

          if (paystackError || !result) {
            console.error("Paystack API Error:", paystackError);
            throw new Error(paystackError?.message || "Failed to contact payment server.");
          }

          if (result.error) {
            toast.error(result.message || "Payment initialization failed.");
          } else if (result.authorization_url) {
            // Redirect to Paystack
            window.location.href = result.authorization_url;
            return;
          }
        } catch (paystackError: any) {
          console.error("Paystack error:", paystackError);
          toast.error(paystackError.message || "Payment service unavailable. Please check your connection.");
        }
      }
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
          <DialogTitle className="text-xl font-display">Checkout</DialogTitle>
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

          <div className="p-4 rounded-xl border bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground">
              Secure payment via Paystack (Card, Bank Transfer, USSD).
            </p>
          </div>

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
              `Pay Now - ${formatPrice(totalAmount)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

