import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/data/categories";
import { CheckCircle2, Package, Clock, ArrowRight, AlertCircle, Loader2, XCircle } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderConfirmationData {
  cartItems?: CartItem[];
  totalAmount?: number;
  finalPrice?: number;
  deliveryDate?: string;
  deliveryTime?: string;
  hasCustomOrders?: boolean;
  orderIds?: string[];
}

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const orderData = location.state as OrderConfirmationData | null;

  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">("idle");
  const [verifiedOrder, setVerifiedOrder] = useState<any>(null);

  // Check for Paystack callback
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  useEffect(() => {
    if (reference) {
      verifyPayment(reference);
    }
  }, [reference]);

  const verifyPayment = async (ref: string) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack", {
        body: {
          action: "verify",
          reference: ref,
        },
      });

      if (error || !data || data.status !== "success") {
        throw new Error(data?.message || "Payment verification failed");
      }

      setVerificationStatus("success");
      setVerifiedOrder({
        reference: ref,
        amount: data.amount,
      });

      toast({
        title: "Payment Successful",
        description: "Your order has been confirmed!",
        variant: "default",
      });

    } catch (error: any) {
      console.error("Verification error:", error);
      setVerificationStatus("error");
      toast({
        title: "Verification Failed",
        description: "Could not verify payment. Please contact support if you were debited.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  // 1. Loading State (Verifying)
  if (verifying) {
    return (
      <Layout>
        <div className="container py-32 text-center flex flex-col items-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
          <h1 className="text-2xl font-bold mb-2">Verifying Payment...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your transaction.</p>
        </div>
      </Layout>
    );
  }

  // 2. Error State
  if (verificationStatus === "error") {
    return (
      <Layout>
        <div className="container py-32 text-center flex flex-col items-center">
          <XCircle className="h-16 w-16 text-destructive mb-6" />
          <h1 className="text-2xl font-bold mb-4">Payment Verification Failed</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            We couldn't verify your payment. If you have been debited, please contact support with your reference: <span className="font-mono font-bold">{reference}</span>
          </p>
          <div className="flex gap-4">
            <Link to="/orders">
              <Button variant="outline">View Orders</Button>
            </Link>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // 3. Success State (Verified Payment)
  if (verificationStatus === "success") {
    return (
      <Layout>
        <div className="container py-16 md:py-20 text-center animate-scale-in">
          <div className="flex justify-center mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display md:text-4xl mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your order. We have received your payment.
          </p>

          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span className="text-muted-foreground">Payment Reference</span>
                <span className="font-mono font-medium">{verifiedOrder?.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-primary text-lg">{formatPrice(verifiedOrder?.amount)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/orders">
              <Button size="lg" className="w-full sm:w-auto">
                Track Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // 4. Default State (Custom Order Submission / No Data)
  if (!orderData || !orderData.cartItems || orderData.cartItems.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No order details found</h1>
          <Link to="/categories">
            <Button>Browse Packages</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const {
    cartItems,
    finalPrice = 0,
    deliveryDate,
    deliveryTime,
    orderIds,
  } = orderData;

  const displayOrderId = orderIds?.length ? orderIds[0] : `ORD-${Date.now().toString(36).toUpperCase()}`;

  // Filter for Custom Items (only remaining flow that lands here without payment)
  const customItems = cartItems.filter(
    item => item.selectedClass?.id === "custom" || !!item.customRequest
  );

  // NOTE: Regular items should not theoretically land here anymore without payment, 
  // but if they do (e.g. edge case), we just show them as "Order Received" without payment instructions.

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto animate-scale-in">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
            </div>

            <h1 className="text-3xl font-bold font-display md:text-4xl mb-4">
              Request Received
            </h1>

            <p className="text-lg text-muted-foreground mb-2">
              Your order number is:
            </p>

            <p className="text-2xl font-mono font-bold text-primary mb-6">
              {displayOrderId}
            </p>
          </div>

          {/* Custom Orders Message */}
          {customItems.length > 0 && (
            <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Custom Order - Awaiting Price</h3>
                    <p className="text-muted-foreground">
                      Your custom request has been submitted. Admin will review and send you the final price.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {customItems.map((item, i) => (
                    <p key={i} className="text-sm font-medium">• {item.package.name}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link to="/orders">
              <Button size="lg" className="w-full sm:w-auto">
                View My Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
