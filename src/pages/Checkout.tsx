import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/data/categories";
import { ChevronRight, CreditCard, Calendar, Truck, CheckCircle2, User, Mail, Phone, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Discount-based payment plans
const discountPlans = [
  { id: "one-time", label: "One-Time Payment", discount: 0.10, description: "10% discount" },
  { id: "3-months", label: "3 Months", discount: 0.06, description: "6% discount" },
  { id: "6-months", label: "6 Months", discount: 0.02, description: "2% discount" },
  { id: "12-months", label: "12 Months", discount: 0, description: "0% discount" },
];

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const orderData = location.state as any;

  const [paymentPlan, setPaymentPlan] = useState("one-time");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Customer contact information
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    email: "",
    whatsappNumber: "",
  });

  if (!orderData) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No items in checkout</h1>
          <Link to="/categories">
            <Button>Browse Packages</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const { package: pkg, selectedClass, quantity, notes, unitPrice } = orderData;
  
  const totalPrice = unitPrice * quantity;
  const selectedPlan = discountPlans.find((p) => p.id === paymentPlan);
  const discountAmount = selectedPlan ? totalPrice * selectedPlan.discount : 0;
  const finalPrice = totalPrice - discountAmount;
  
  const monthlyPayment = paymentPlan !== "one-time" && selectedPlan
    ? finalPrice / parseInt(paymentPlan)
    : 0;

  const isFormValid = customerInfo.fullName.trim() && customerInfo.email.trim() && customerInfo.whatsappNumber.trim();

  const handleSubmit = async () => {
    if (!isFormValid) {
      toast({
        title: "Please fill in all required fields",
        description: "Full Name, Email, and WhatsApp Number are required.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please login to submit order",
        description: "You need to be logged in to place an order.",
        variant: "destructive",
      });
      navigate("/login", { state: { from: location } });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        package_name: pkg.name,
        package_class: selectedClass?.name || null,
        quantity,
        notes: notes || null,
        total_price: totalPrice,
        final_price: finalPrice,
        discount_amount: discountAmount,
        payment_method: paymentPlan,
        installment_plan: paymentPlan !== "one-time" ? paymentPlan : null,
        delivery_date: deliveryDate || null,
        delivery_time: deliveryTime || null,
        customer_name: customerInfo.fullName,
        customer_email: customerInfo.email,
        customer_whatsapp: customerInfo.whatsappNumber,
        status: "pending",
      });

      if (error) throw error;

      navigate("/order-confirmation", {
        state: {
          ...orderData,
          totalPrice,
          paymentMethod: paymentPlan,
          discountAmount,
          deliveryDate,
          deliveryTime,
          finalPrice,
          customerInfo,
        },
      });
    } catch (error: any) {
      toast({
        title: "Error submitting order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Checkout</span>
        </nav>

        <h1 className="text-3xl font-bold font-display mb-8">Calculate Your Cost</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex-1">
                    <h3 className="font-semibold">{pkg.name}</h3>
                    {selectedClass && (
                      <p className="text-sm text-muted-foreground">
                        Class: {selectedClass.name} - {formatPrice(selectedClass.price)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Quantity: {quantity}
                    </p>
                    {notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Notes: {notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      className="pl-10"
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      placeholder="e.g., +234 801 234 5678"
                      className="pl-10"
                      value={customerInfo.whatsappNumber}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, whatsappNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method with Discounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method (Choose for Discount)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={paymentPlan}
                  onValueChange={setPaymentPlan}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {discountPlans.map((plan) => {
                    const planDiscount = totalPrice * plan.discount;
                    const planFinal = totalPrice - planDiscount;
                    const planMonthly = plan.id !== "one-time" ? planFinal / parseInt(plan.id) : planFinal;
                    return (
                      <Label
                        key={plan.id}
                        htmlFor={plan.id}
                        className={cn(
                          "flex flex-col gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                          paymentPlan === plan.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={plan.id} id={plan.id} />
                          <span className="font-semibold">{plan.label}</span>
                        </div>
                        <div className="pl-6 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-success">
                            <Percent className="h-3 w-3" />
                            {plan.description}
                          </div>
                          {plan.id !== "one-time" ? (
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(planMonthly)}/month
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Pay {formatPrice(planFinal)} now
                            </p>
                          )}
                          {plan.discount > 0 && (
                            <p className="text-xs text-success">
                              Save {formatPrice(planDiscount)}
                            </p>
                          )}
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Delivery Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Delivery Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">Preferred Delivery Date</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Preferred Time</Label>
                    <Input
                      id="deliveryTime"
                      placeholder="e.g., 10AM–12PM, Evening"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll confirm the exact delivery time with you once your order is processed.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Total */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Your Cost</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({quantity}x)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount ({selectedPlan?.description})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Final Cost</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                  {paymentPlan !== "one-time" && (
                    <p className="text-sm text-muted-foreground mt-1 text-right">
                      {formatPrice(monthlyPayment)}/month for {paymentPlan.replace("-", " ")}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? "Submitting..." : "Calculate My Cost"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
