import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/data/categories";
import { ChevronRight, CreditCard, Calendar, Truck, CheckCircle2, User, Mail, Phone, Percent, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart, CartItem } from "@/contexts/CartContext";
import { customerInfoSchema, orderNotesSchema, customRequestSchema, deliveryTimeSchema, validateInput } from "@/lib/validations";

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
  const { clearCart } = useCart();
  const orderData = location.state as { cartItems?: CartItem[]; totalAmount?: number } | null;

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

  // Check if we have valid cart items
  const cartItems = orderData?.cartItems || [];
  const hasItems = cartItems.length > 0;

  if (!hasItems) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No items in checkout</h1>
          <p className="text-muted-foreground mb-6">Add some packages to your cart first</p>
          <Link to="/categories">
            <Button>Browse Packages</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const selectedPlan = discountPlans.find((p) => p.id === paymentPlan);
  const discountAmount = selectedPlan ? totalPrice * selectedPlan.discount : 0;
  const finalPrice = totalPrice - discountAmount;
  
  const monthlyPayment = paymentPlan !== "one-time" && selectedPlan
    ? finalPrice / parseInt(paymentPlan)
    : 0;

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate customer info
    const customerResult = customerInfoSchema.safeParse(customerInfo);
    if (!customerResult.success) {
      customerResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
    }

    // Validate delivery time if provided
    if (deliveryTime) {
      const deliveryTimeResult = validateInput(deliveryTimeSchema, deliveryTime);
      if (deliveryTimeResult.success === false) {
        errors.deliveryTime = deliveryTimeResult.error;
      }
    }

    // Validate cart items notes and custom requests
    cartItems.forEach((item, index) => {
      if (item.notes) {
        const notesResult = validateInput(orderNotesSchema, item.notes);
        if (notesResult.success === false) {
          errors[`notes_${index}`] = notesResult.error;
        }
      }
      if (item.customRequest) {
        const customResult = validateInput(customRequestSchema, item.customRequest);
        if (customResult.success === false) {
          errors[`customRequest_${index}`] = customResult.error;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = customerInfo.fullName.trim() && customerInfo.email.trim() && customerInfo.whatsappNumber.trim();

  const handleSubmit = async () => {
    // Validate all inputs
    if (!validateForm()) {
      const firstError = Object.values(validationErrors)[0];
      toast({
        title: "Validation Error",
        description: firstError || "Please check your input and try again.",
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
      // Sanitize inputs before submission
      const sanitizedCustomerName = customerInfo.fullName.trim().slice(0, 100);
      const sanitizedEmail = customerInfo.email.trim().toLowerCase().slice(0, 255);
      const sanitizedWhatsapp = customerInfo.whatsappNumber.trim().slice(0, 20);
      const sanitizedDeliveryTime = deliveryTime?.trim().slice(0, 100) || null;

      // Create an order for each cart item
      const orderPromises = cartItems.map((item) => {
        const sanitizedNotes = item.notes?.trim().slice(0, 1000) || null;
        const sanitizedCustomRequest = item.customRequest?.trim().slice(0, 2000) || null;
        const isCustomOrder = item.selectedClass?.id === "custom" || !!item.customRequest;
        
        // For custom orders, set status to 'pending' (awaiting admin price)
        // For class-based orders with fixed prices, set status to 'processing' (ready for payment)
        const orderStatus = isCustomOrder ? "pending" : "processing";
        const itemTotal = item.unitPrice * item.quantity;
        const itemDiscount = itemTotal * (selectedPlan?.discount || 0);
        const itemFinal = itemTotal - itemDiscount;

        return supabase.from("orders").insert({
          user_id: user.id,
          package_name: item.package.name.slice(0, 255),
          package_class: item.selectedClass?.name?.slice(0, 100) || null,
          quantity: item.quantity,
          notes: sanitizedNotes,
          custom_request: sanitizedCustomRequest,
          total_price: itemTotal,
          final_price: itemFinal,
          discount_amount: itemDiscount,
          payment_method: paymentPlan,
          installment_plan: paymentPlan !== "one-time" ? paymentPlan : null,
          delivery_date: deliveryDate || null,
          delivery_time: sanitizedDeliveryTime,
          customer_name: sanitizedCustomerName,
          customer_email: sanitizedEmail,
          customer_whatsapp: sanitizedWhatsapp,
          status: orderStatus,
        });
      });

      const results = await Promise.all(orderPromises);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        throw new Error("Failed to submit one or more orders");
      }

      // Clear cart after successful order
      clearCart();

      // Check if any items are custom orders
      const hasCustomOrders = cartItems.some(
        (item) => item.selectedClass?.id === "custom" || !!item.customRequest
      );

      navigate("/order-confirmation", {
        state: {
          cartItems,
          totalPrice,
          paymentMethod: paymentPlan,
          discountAmount,
          deliveryDate,
          deliveryTime,
          finalPrice,
          customerInfo,
          hasCustomOrders,
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
          <Link to="/cart" className="hover:text-primary">Cart</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Checkout</span>
        </nav>

        <h1 className="text-3xl font-bold font-display mb-8">Complete Your Order</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                    {/* Item Image */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-background overflow-hidden flex items-center justify-center">
                      {item.package.image && item.package.image !== "/placeholder.svg" ? (
                        <img
                          src={item.package.image}
                          alt={item.package.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.package.name}</h3>
                      {item.selectedClass && (
                        <p className="text-sm text-muted-foreground">
                          Class: {item.selectedClass.name} - {formatPrice(item.selectedClass.price)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Notes: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
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
                      className={cn("pl-10", validationErrors.fullName && "border-destructive")}
                      value={customerInfo.fullName}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, fullName: e.target.value });
                        if (validationErrors.fullName) {
                          setValidationErrors((prev) => ({ ...prev, fullName: "" }));
                        }
                      }}
                      maxLength={100}
                      required
                    />
                  </div>
                  {validationErrors.fullName && (
                    <p className="text-xs text-destructive">{validationErrors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className={cn("pl-10", validationErrors.email && "border-destructive")}
                      value={customerInfo.email}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, email: e.target.value });
                        if (validationErrors.email) {
                          setValidationErrors((prev) => ({ ...prev, email: "" }));
                        }
                      }}
                      maxLength={255}
                      required
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-xs text-destructive">{validationErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      placeholder="e.g., +234 801 234 5678"
                      className={cn("pl-10", validationErrors.whatsappNumber && "border-destructive")}
                      value={customerInfo.whatsappNumber}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, whatsappNumber: e.target.value });
                        if (validationErrors.whatsappNumber) {
                          setValidationErrors((prev) => ({ ...prev, whatsappNumber: "" }));
                        }
                      }}
                      maxLength={20}
                      required
                    />
                  </div>
                  {validationErrors.whatsappNumber && (
                    <p className="text-xs text-destructive">{validationErrors.whatsappNumber}</p>
                  )}
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
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
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
