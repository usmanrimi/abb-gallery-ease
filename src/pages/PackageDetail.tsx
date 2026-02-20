import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/data/categories";
import { useCategories } from "@/hooks/useCategories";
import { Package as PackageIcon, ChevronRight, Minus, Plus, Calculator, Check, ShoppingCart, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PaymentModal } from "@/components/checkout/PaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { Package, PackageClass } from "@/hooks/usePackages";

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [customRequest, setCustomRequest] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const category = pkg ? categories.find((c) => c.id === pkg.category_id) : null;

  // Fetch package from database
  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data: dbPackage, error } = await supabase
          .from("packages")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !dbPackage) {
          console.error("Error fetching package:", error);
          setPkg(null);
          setLoading(false);
          return;
        }

        // Fetch classes
        const { data: classesData } = await supabase
          .from("package_classes")
          .select("*")
          .eq("package_id", id)
          .order("sort_order", { ascending: true });

        const packageWithClasses: Package = {
          ...dbPackage,
          classes: classesData?.map(c => ({
            id: c.id,
            name: c.name,
            price: Number(c.price),
            description: c.description || "",
            sort_order: c.sort_order,
          })) || [],
        };

        setPkg(packageWithClasses);

        // Set default selected class
        if (packageWithClasses.has_classes && packageWithClasses.classes && packageWithClasses.classes.length > 0) {
          setSelectedClass(packageWithClasses.classes[0].id);
        }
      } catch (err) {
        console.error("Error:", err);
        setPkg(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id]);

  if (loading || categoriesLoading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!pkg || !category) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Package not found</h1>
          <Link to="/categories">
            <Button>Back to Categories</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isCustomSelected = selectedClass === "custom";
  const selectedClassData = pkg.classes?.find((c) => c.id === selectedClass);

  // For custom, use starting price as base; otherwise use class price or base price
  const unitPrice = isCustomSelected
    ? (pkg.starting_price || 0)
    : pkg.has_classes
      ? (selectedClassData?.price || pkg.starting_price || 0)
      : (pkg.base_price || 0);

  // Handle direct checkout for class orders
  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to checkout");
      navigate("/login", { state: { from: location } });
      return;
    }
    setIsPaymentModalOpen(true);
  };

  // Handle custom order - Calculate Cost flow
  const handleCalculateCost = async () => {
    if (!customRequest.trim()) {
      toast.error("Please describe what you want");
      return;
    }

    if (!user) {
      toast.error("Please login to submit your request");
      navigate("/login", { state: { from: location } });
      return;
    }

    setIsSubmittingCustom(true);

    try {
      // Create order with 'pending' status (waiting for admin price)
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        package_name: pkg.name,
        package_class: "Custom",
        quantity,
        notes: notes || null,
        custom_request: customRequest.trim(),
        total_price: 0, // Admin will set this
        final_price: 0,
        discount_amount: 0,
        payment_method: "pending",
        customer_name: user.email?.split("@")[0] || "Customer",
        customer_email: user.email || "",
        customer_whatsapp: "",
        status: "pending", // Waiting for admin
      });

      if (error) throw error;

      toast.success("Custom request submitted! Waiting for admin to set price.");

      navigate("/order-confirmation", {
        state: {
          cartItems: [{
            id: `${pkg.id}-custom-${Date.now()}`,
            package: pkg,
            selectedClass: { id: "custom", name: "Custom", price: 0, description: customRequest },
            quantity,
            notes,
            unitPrice: 0,
            customRequest,
          }],
          totalPrice: 0,
          finalPrice: 0,
          paymentMethod: "pending",
          hasCustomOrders: true,
        },
      });
    } catch (error: any) {
      console.error("Error submitting custom order:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const handleAddToCart = () => {
    // Convert database package to cart format
    const cartPackage = {
      id: pkg.id,
      categoryId: pkg.category_id,
      name: pkg.name,
      description: pkg.description || "",
      image: pkg.image_url || "/placeholder.svg",
      classImage: pkg.class_image_url || undefined,
      hasClasses: pkg.has_classes,
      basePrice: pkg.base_price || undefined,
      startingPrice: pkg.starting_price || undefined,
      classes: pkg.classes?.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        description: c.description,
      })),
    };

    addToCart({
      package: cartPackage,
      selectedClass: isCustomSelected
        ? { id: "custom", name: "Custom", price: unitPrice, description: "Custom request" }
        : pkg.has_classes ? selectedClassData : undefined,
      quantity,
      notes,
      unitPrice,
      customRequest: isCustomSelected ? customRequest : undefined,
    });
    toast.success(`${pkg.name} added to cart!`);
  };

  // Determine which image to show in the class section - use classImage if available
  const classDisplayImage = pkg.class_image_url || pkg.image_url;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/categories/${category.slug}`} className="hover:text-primary">
            {category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{pkg.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Class Section Image - This is the image shown on package detail page */}
          <div className="animate-fade-in">
            {/* Image container - flexible height, maintains aspect ratio, never crops */}
            <div className="w-full rounded-2xl bg-muted/30 relative overflow-hidden flex items-center justify-center p-4">
              {classDisplayImage && classDisplayImage !== "/placeholder.svg" ? (
                <img
                  src={classDisplayImage}
                  alt={pkg.name}
                  className="max-w-full h-auto object-contain rounded-lg"
                  style={{ maxHeight: "80vh" }}
                />
              ) : (
                <div className="aspect-square w-full flex items-center justify-center">
                  <PackageIcon className="h-32 w-32 text-primary/30" />
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
              {category.name}
            </div>

            <h1 className="text-3xl font-bold font-display md:text-4xl mb-4">
              {pkg.name}
            </h1>

            <p className="text-muted-foreground text-lg mb-2">
              {pkg.description}
            </p>

            {/* Show price based on package type */}
            {pkg.has_classes && pkg.starting_price ? (
              <p className="text-xl font-semibold text-primary mb-6">
                Starting from {formatPrice(pkg.starting_price)}
              </p>
            ) : pkg.base_price ? (
              <p className="text-xl font-semibold text-primary mb-6">
                {formatPrice(pkg.base_price)}
              </p>
            ) : null}

            <Card className="mb-6">
              <CardContent className="p-6 space-y-6">
                {/* Class Selection - Only for packages with classes */}
                {pkg.has_classes && pkg.classes && pkg.classes.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Class</Label>
                    <RadioGroup
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                      className="grid gap-3"
                    >
                      {pkg.classes.map((cls) => (
                        <Label
                          key={cls.id}
                          htmlFor={cls.id}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
                            selectedClass === cls.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem
                            value={cls.id}
                            id={cls.id}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-semibold">{cls.name}</span>
                              <span className="font-bold text-primary">
                                {formatPrice(cls.price)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {cls.description}
                            </p>
                          </div>
                        </Label>
                      ))}

                      {/* Custom Option */}
                      <Label
                        htmlFor="custom"
                        className={cn(
                          "flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
                          selectedClass === "custom"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 border-dashed"
                        )}
                      >
                        <RadioGroupItem
                          value="custom"
                          id="custom"
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-semibold">Custom</span>
                            <span className="text-sm text-muted-foreground">
                              Price based on request
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Describe exactly what you want - we'll create a custom package for you
                          </p>
                        </div>
                      </Label>
                    </RadioGroup>

                    {/* Custom Request Text Area */}
                    {isCustomSelected && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="customRequest" className="text-sm font-medium text-primary">
                          Describe what you want *
                        </Label>
                        <Textarea
                          id="customRequest"
                          placeholder="Write your preferred items, budget, and any special request…"
                          value={customRequest}
                          onChange={(e) => setCustomRequest(e.target.value)}
                          rows={4}
                          className="border-primary/30"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Admin will review and send you the final price
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fixed Price Display for non-class packages */}
                {!pkg.has_classes && pkg.base_price && (
                  <div className="text-center p-4 rounded-xl bg-primary/5 border-2 border-primary">
                    <p className="text-sm text-muted-foreground mb-1">Fixed Price</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(pkg.base_price)}</p>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Quantity</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-lg border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold">
                    Special Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requests or customizations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions - Different buttons based on selection */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 rounded-xl bg-muted/50">
              {isCustomSelected ? (
                // Custom flow: Show Calculate Cost button only
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleCalculateCost}
                  disabled={!customRequest.trim() || isSubmittingCustom}
                >
                  {isSubmittingCustom ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate My Cost
                    </>
                  )}
                </Button>
              ) : (
                // Class flow: Show Checkout and Add to Cart buttons
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={handleCheckout}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Checkout - {formatPrice(unitPrice * quantity)}
                  </Button>
                </>
              )}
            </div>

            {/* Features */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Quality guaranteed",
                "Flexible payment options",
                "Free delivery available",
                "Easy returns",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-success" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal for class orders */}
      {selectedClassData && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          packageData={{
            id: pkg.id,
            categoryId: pkg.category_id,
            name: pkg.name,
            description: pkg.description || "",
            image: pkg.image_url || "/placeholder.svg",
            hasClasses: pkg.has_classes,
            basePrice: pkg.base_price || undefined,
            startingPrice: pkg.starting_price || undefined,
          }}
          selectedClass={selectedClassData}
          quantity={quantity}
          notes={notes}
        />
      )}
    </Layout>
  );
}