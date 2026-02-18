import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/data/categories";
import { ChevronRight, CreditCard, Calendar, Truck, CheckCircle2, User, Mail, Phone, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCart, CartItem } from "@/contexts/CartContext";
import { customerInfoSchema, orderNotesSchema, customRequestSchema, deliveryTimeSchema, validateInput } from "@/lib/validations";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const orderData = location.state as { cartItems?: CartItem[]; totalAmount?: number } | null;

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

  // Check if any items are custom orders
  const hasCustomOrders = cartItems.some(
    (item) => item.selectedClass?.id === "custom" || !!item.customRequest
  );

  // Class orders can pay immediately via Paystack
  const canPayImmediately = !hasCustomOrders;

  // Generate a branded order ID via DB function
  const generateOrderId = async (): Promise<string> => {
    const { data, error } = await supabase.rpc("generate_custom_order_id");
    if (error || !data) {
      console.error("Failed to generate branded order ID:", error);
      // Fallback to timestamp-based ID if RPC fails
      return `MAG/KN/${new Date().getFullYear() % 100}/${Date.now().toString().slice(-5)}`;
    }
    return data as string;
  };

  const handlePaystackPayment = async () => {
    // Validate all inputs first
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Please login to pay",
        description: "You need to be logged in to place an order.",
        variant: "destructive",
      });
      navigate("/login", { state: { from: location } });
      return;
    }

    setIsSubmitting(true);
    try {
      // Sanitize inputs
      const sanitizedCustomerName = customerInfo.fullName.trim().slice(0, 100);
      const sanitizedEmail = customerInfo.email.trim().toLowerCase().slice(0, 255);
      const sanitizedWhatsapp = customerInfo.whatsappNumber.trim().slice(0, 20);
      const sanitizedDeliveryTime = deliveryTime?.trim().slice(0, 100) || null;

      // Generate branded order IDs and create orders
      const orderInserts = await Promise.all(
        cartItems.map(async (item) => {
          const brandedId = await generateOrderId();
          const sanitizedNotes = item.notes?.trim().slice(0, 1000) || null;
          const sanitizedCustomRequest = item.customRequest?.trim().slice(0, 2000) || null;
          const itemTotal = item.unitPrice * item.quantity;

          return {
            custom_order_id: brandedId,
            user_id: user.id,
            package_name: item.package.name.slice(0, 255),
            package_class: item.selectedClass?.name?.slice(0, 100) || null,
            quantity: item.quantity,
            notes: sanitizedNotes,
            custom_request: sanitizedCustomRequest,
            total_price: itemTotal,
            final_price: itemTotal,
            discount_amount: 0,
            payment_method: "paystack",
            payment_status: "pending",
            installment_plan: null,
            delivery_date: deliveryDate || null,
            delivery_time: sanitizedDeliveryTime,
            customer_name: sanitizedCustomerName,
            customer_email: sanitizedEmail,
            customer_whatsapp: sanitizedWhatsapp,
            status: "pending_payment",
          };
        })
      );

      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .insert(orderInserts)
        .select("id, final_price, custom_order_id");

      if (orderError || !orders?.length) throw new Error(orderError?.message || "Failed to create order");

      // Use the primary (first) order for Paystack
      const primaryOrder = orders[0];
      const totalAmount = orders.reduce((sum, o) => sum + Number(o.final_price), 0);

      // Call edge function to initialize Paystack payment
      const { data: paystackData, error: paystackError } = await supabase.functions.invoke("paystack", {
        body: {
          action: "initialize",
          email: sanitizedEmail,
          amount: totalAmount,
          orderId: primaryOrder.id,
          callback_url: `${window.location.origin}/order-confirmation`,
          metadata: {
            customer_name: sanitizedCustomerName,
            custom_order_id: primaryOrder.custom_order_id,
            items: cartItems.map(i => i.package.name).join(", "),
          },
        },
      });

      if (paystackError || !paystackData?.authorization_url) {
        console.error("Paystack initialization failed:", paystackError || paystackData);
        // Extract more detailed error if available
        const errorMessage = paystackData?.message || paystackError?.message || "Failed to initialize payment. Please try again.";
        throw new Error(errorMessage);
      }

      // Redirect to Paystack
      window.location.href = paystackData.authorization_url;
      clearCart();

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Something went wrong. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCustomOrder = async () => {
    // Validate all inputs
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check your input and try again.",
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
      // Sanitize inputs
      const sanitizedCustomerName = customerInfo.fullName.trim().slice(0, 100);
      const sanitizedEmail = customerInfo.email.trim().toLowerCase().slice(0, 255);
      const sanitizedWhatsapp = customerInfo.whatsappNumber.trim().slice(0, 20);
      const sanitizedDeliveryTime = deliveryTime?.trim().slice(0, 100) || null;

      // Create orders — custom orders go to waiting_for_price
      const orderPromises = cartItems.map(async (item) => {
        const brandedId = await generateOrderId();
        const sanitizedNotes = item.notes?.trim().slice(0, 1000) || null;
        const sanitizedCustomRequest = item.customRequest?.trim().slice(0, 2000) || null;
        const isCustomOrder = item.selectedClass?.id === "custom" || !!item.customRequest;

        const orderStatus = isCustomOrder ? "waiting_for_price" : "pending_payment";
        const paymentStatus = isCustomOrder ? "waiting_for_price" : "pending";
        const itemTotal = item.unitPrice * item.quantity;

        return supabase.from("orders").insert({
          custom_order_id: brandedId,
          user_id: user.id,
          package_name: item.package.name.slice(0, 255),
          package_class: item.selectedClass?.name?.slice(0, 100) || null,
          quantity: item.quantity,
          notes: sanitizedNotes,
          custom_request: sanitizedCustomRequest,
          total_price: itemTotal,
          final_price: isCustomOrder ? 0 : itemTotal,
          discount_amount: 0,
          payment_method: isCustomOrder ? "pending" : "paystack",
          payment_status: paymentStatus,
          installment_plan: null,
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

      // Clear cart
      clearCart();

      navigate("/order-confirmation", {
        state: {
          cartItems,
          totalAmount: totalPrice,
          finalPrice: totalPrice,
          deliveryDate,
          deliveryTime,
          customerInfo,
          hasCustomOrders: true,
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
                      {item.customRequest && (
                        <p className="text-sm text-amber-600 mt-1">
                          Custom Request: {item.customRequest}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Notes: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {item.selectedClass?.id === "custom" ? "TBD" : formatPrice(item.unitPrice * item.quantity)}
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
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span>{hasCustomOrders ? "—" : formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {hasCustomOrders ? "TBD" : formatPrice(totalPrice)}
                    </span>
                  </div>
                  {hasCustomOrders && (
                    <p className="text-sm text-amber-600 mt-1 text-right">
                      Custom items require admin pricing
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={canPayImmediately ? handlePaystackPayment : handleSubmitCustomOrder}
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting
                    ? "Processing..."
                    : canPayImmediately
                      ? `Pay Now ${formatPrice(totalPrice)}`
                      : "Submit Order Request"
                  }
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {canPayImmediately
                    ? "Secure payment via Paystack"
                    : "Admin will review your custom request and set a price."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
