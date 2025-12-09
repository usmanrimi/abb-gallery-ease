import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/data/categories";
import { ChevronRight, CreditCard, Calendar, Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const installmentPlans = [
  { id: "3-months", label: "3 Months", multiplier: 1.05 },
  { id: "6-months", label: "6 Months", multiplier: 1.08 },
  { id: "12-months", label: "12 Months", multiplier: 1.12 },
];

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const orderData = location.state as any;

  const [paymentMethod, setPaymentMethod] = useState<"one-time" | "installment">("one-time");
  const [installmentPlan, setInstallmentPlan] = useState("3-months");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const { package: pkg, selectedClass, quantity, notes, totalPrice } = orderData;
  
  const selectedPlan = installmentPlans.find((p) => p.id === installmentPlan);
  const finalPrice = paymentMethod === "installment" && selectedPlan
    ? totalPrice * selectedPlan.multiplier
    : totalPrice;
  
  const monthlyPayment = paymentMethod === "installment" && selectedPlan
    ? finalPrice / parseInt(selectedPlan.id)
    : 0;

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/order-confirmation", {
        state: {
          ...orderData,
          paymentMethod,
          installmentPlan: paymentMethod === "installment" ? installmentPlan : null,
          deliveryDate,
          deliveryTime,
          finalPrice,
        },
      });
    }, 1500);
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

        <h1 className="text-3xl font-bold font-display mb-8">Checkout</h1>

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
                        Class: {selectedClass.name}
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
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "one-time" | "installment")}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <Label
                    htmlFor="one-time"
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                      paymentMethod === "one-time"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <span className="font-semibold">One-Time Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      Pay the full amount now
                    </p>
                  </Label>
                  <Label
                    htmlFor="installment"
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all",
                      paymentMethod === "installment"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="installment" id="installment" />
                      <span className="font-semibold">Installment Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      Split into monthly payments
                    </p>
                  </Label>
                </RadioGroup>

                {paymentMethod === "installment" && (
                  <div className="space-y-3 animate-fade-in">
                    <Label className="text-base font-semibold">Select Plan</Label>
                    <RadioGroup
                      value={installmentPlan}
                      onValueChange={setInstallmentPlan}
                      className="grid gap-3 sm:grid-cols-3"
                    >
                      {installmentPlans.map((plan) => {
                        const planTotal = totalPrice * plan.multiplier;
                        const monthly = planTotal / parseInt(plan.id);
                        return (
                          <Label
                            key={plan.id}
                            htmlFor={plan.id}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border-2 p-4 cursor-pointer transition-all text-center",
                              installmentPlan === plan.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                            <span className="font-semibold">{plan.label}</span>
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(monthly)}/mo
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total: {formatPrice(planTotal)}
                            </span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  </div>
                )}
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
                <CardTitle>Order Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {paymentMethod === "installment" && selectedPlan && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Interest</span>
                    <span>{formatPrice(finalPrice - totalPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(finalPrice)}
                    </span>
                  </div>
                  {paymentMethod === "installment" && (
                    <p className="text-sm text-muted-foreground mt-1 text-right">
                      {formatPrice(monthlyPayment)}/month for {installmentPlan.replace("-", " ")}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Order"}
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
