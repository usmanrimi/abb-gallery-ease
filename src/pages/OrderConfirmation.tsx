import { useLocation, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/data/categories";
import { CheckCircle2, Package, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { PaymentInstructions } from "@/components/order/PaymentInstructions";

interface OrderConfirmationData {
  cartItems?: CartItem[];
  totalAmount?: number;
  finalPrice?: number;
  paymentMethod?: string;
  installmentPlan?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  hasCustomOrders?: boolean;
}

export default function OrderConfirmation() {
  const location = useLocation();
  const orderData = location.state as OrderConfirmationData | null;

  if (!orderData || !orderData.cartItems || orderData.cartItems.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No order found</h1>
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
    paymentMethod, 
    installmentPlan, 
    deliveryDate, 
    deliveryTime,
    hasCustomOrders 
  } = orderData;
  
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

  // Separate custom and regular orders
  const customItems = cartItems.filter(
    item => item.selectedClass?.id === "custom" || !!item.customRequest
  );
  const regularItems = cartItems.filter(
    item => item.selectedClass?.id !== "custom" && !item.customRequest
  );
  
  // Calculate totals for regular items only
  const regularItemsTotal = regularItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="max-w-2xl mx-auto animate-scale-in">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
            </div>

            <h1 className="text-3xl font-bold font-display md:text-4xl mb-4">
              Order Received!
            </h1>
            
            <p className="text-lg text-muted-foreground mb-2">
              Thank you for your order. Your order number is:
            </p>
            
            <p className="text-2xl font-mono font-bold text-primary mb-6">
              {orderId}
            </p>
          </div>

          {/* Custom Orders - Pending Admin Response */}
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
                
                <div className="space-y-3">
                  {customItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-4 rounded-xl bg-background border">
                      <Package className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{item.package.name}</p>
                        <p className="text-sm text-amber-600">Custom Request</p>
                        {item.customRequest && (
                          <p className="text-sm text-muted-foreground mt-1">
                            "{item.customRequest}"
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-amber-600">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-dashed border-amber-500/30">
                  <p className="text-sm text-center text-amber-700">
                    You'll receive a notification once admin sets the price. Payment instructions will be shown then.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regular Orders - Show Payment Instructions */}
          {regularItems.length > 0 && (
            <>
              <div className="mb-6">
                <PaymentInstructions amount={regularItemsTotal} />
              </div>

              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Ready for Payment</h3>
                      <p className="text-muted-foreground">
                        Please transfer to the account above. We will confirm your payment and process your order within <strong>24-48 hours</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-semibold">Order Details</h4>
                    
                    {regularItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                        <Package className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{item.package.name}</p>
                          {item.selectedClass && (
                            <p className="text-sm text-muted-foreground">{item.selectedClass.name} Class</p>
                          )}
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                    ))}
                    
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                      <p className="font-medium">
                        {paymentMethod === "one-time" ? "One-Time Payment" : `Installment (${paymentMethod?.replace("-", " ")})`}
                      </p>
                    </div>

                    {(deliveryDate || deliveryTime) && (
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-1">Preferred Delivery</p>
                        <p className="font-medium">
                          {deliveryDate && new Date(deliveryDate).toLocaleDateString("en-NG", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {deliveryTime && ` • ${deliveryTime}`}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-primary">{formatPrice(regularItemsTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* If only custom orders, show simplified card */}
          {regularItems.length === 0 && customItems.length > 0 && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">What happens next?</h3>
                    <p className="text-muted-foreground">
                      Our team will review your custom request and send you the final price within <strong>24 hours</strong>. 
                      You'll receive payment instructions once the price is confirmed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
      </div>
    </Layout>
  );
}
