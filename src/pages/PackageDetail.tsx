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
        const { data: dbPackage, error } = await (supabase
          .from("packages") as any)
          .select("*")
          .eq("id", id)
          .single();

        if (error || !dbPackage) {
          console.error("Error fetching package:", error);
          setPkg(null);
          setLoading(false);
          return;
        }

        // Create classes from tier columns
        const dynamicClasses: PackageClass[] = [];
        if (dbPackage.price_vip) {
          dynamicClasses.push({
            id: "vip",
            name: "VIP",
            price: Number(dbPackage.price_vip),
            description: "Premium quality with luxury items and exclusive service.",
            sort_order: 1
          });
        }
        if (dbPackage.price_special) {
          dynamicClasses.push({
            id: "special",
            name: "Special",
            price: Number(dbPackage.price_special),
            description: "High quality selection with carefully curated items.",
            sort_order: 2
          });
        }
        if (dbPackage.price_standard) {
          dynamicClasses.push({
            id: "standard",
            name: "Standard",
            price: Number(dbPackage.price_standard),
            description: "Quality items suitable for everyday celebrations.",
            sort_order: 3
          });
        }

        const packageWithClasses: Package = {
          ...dbPackage,
          classes: dynamicClasses,
        };

        setPkg(packageWithClasses);

        // Set default selected class
        if (dynamicClasses.length > 0) {
          setSelectedClass(dynamicClasses[0].id);
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

  // For custom, use starting price as base; otherwise use class price
  const unitPrice = isCustomSelected
    ? (pkg.starting_from || 0)
    : (selectedClassData?.price || pkg.starting_from || 0);

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
      image: pkg.image_cover_url || "/placeholder.svg",
      classImage: pkg.image_detail_url || undefined,
      startingPrice: pkg.starting_from || undefined,
      price_vip: pkg.price_vip,
      price_special: pkg.price_special,
      price_standard: pkg.price_standard,
      classes: pkg.classes?.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        description: c.description,
      })),
    };

    addToCart({
      package: cartPackage as any,
      selectedClass: isCustomSelected
        ? { id: "custom", name: "Custom", price: unitPrice, description: "Custom request" }
        : selectedClassData,
      quantity,
      notes,
      unitPrice,
      customRequest: isCustomSelected ? customRequest : undefined,
    });
    toast.success(`${pkg.name} added to cart!`);
  };

  // Determine which image to show in the class section
  const classDisplayImage = pkg.image_detail_url || pkg.image_cover_url;

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
          {/* Class Section Image */}
          <div className="animate-fade-in">
            <div className="w-full rounded-2xl bg-muted/30 relative overflow-hidden flex items-center justify-center p-4 min-h-[400px]">
              {classDisplayImage && classDisplayImage !== "/placeholder.svg" ? (
                <img
                  src={classDisplayImage}
                  alt={pkg.name}
                  className="max-w-full h-auto object-contain rounded-lg shadow-sm"
                  style={{ maxHeight: "70vh" }}
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
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary mb-4 uppercase tracking-tighter">
              {category.name}
            </div>

            <h1 className="text-3xl font-black font-display md:text-5xl mb-4 tracking-tight">
              {pkg.name}
            </h1>

            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              {pkg.description}
            </p>

            {/* Starting price display if applicable */}
            {pkg.starting_from && (
              <div className="mb-6 inline-block bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Starting from</p>
                <p className="text-3xl font-black text-primary">{formatPrice(pkg.starting_from)}</p>
              </div>
            )}

            <Card className="mb-6 border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Class Selection */}
                {pkg.classes && pkg.classes.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-lg font-black uppercase tracking-tighter">Choose a Pricing Tier</Label>
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
                            "flex items-start gap-3 rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200",
                            selectedClass === cls.id
                              ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                              : "border-border/50 hover:border-primary/30 bg-muted/20"
                          )}
                        >
                          <RadioGroupItem
                            value={cls.id}
                            id={cls.id}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-lg font-black tracking-tight">{cls.name}</span>
                              <span className="text-xl font-black text-primary">
                                {formatPrice(cls.price)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 font-medium italic">
                              {cls.description}
                            </p>
                          </div>
                        </Label>
                      ))}

                      {/* Custom Option */}
                      <Label
                        htmlFor="custom"
                        className={cn(
                          "flex items-start gap-3 rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200",
                          selectedClass === "custom"
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                            : "border-border/50 hover:border-primary/30 border-dashed bg-muted/10"
                        )}
                      >
                        <RadioGroupItem
                          value="custom"
                          id="custom"
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-lg font-black tracking-tight">Custom Order</span>
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-tighter">
                              Quotation
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 font-medium italic">
                            Describe your specific needs and we'll provide a tailor-made quotation.
                          </p>
                        </div>
                      </Label>
                    </RadioGroup>

                    {/* Custom Request Text Area */}
                    {isCustomSelected && (
                      <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="customRequest" className="text-sm font-bold text-primary uppercase tracking-widest">
                          Describe your requirements
                        </Label>
                        <Textarea
                          id="customRequest"
                          placeholder="Please list your preferred items, budget, and any special requests..."
                          value={customRequest}
                          onChange={(e) => setCustomRequest(e.target.value)}
                          rows={4}
                          className="border-primary/20 focus-visible:ring-primary shadow-sm"
                          required
                        />
                        <p className="text-xs text-muted-foreground font-medium">
                          Our team will review your request and contact you with a final price.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fixed Price Display if no classes */}
                {(!pkg.classes || pkg.classes.length === 0) && pkg.price_standard && (
                  <div className="text-center p-6 rounded-2xl bg-primary/5 border-2 border-primary/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Standard Price</p>
                    <p className="text-4xl font-black text-primary">{formatPrice(pkg.price_standard)}</p>
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-4 pt-2">
                  <Label className="text-lg font-black uppercase tracking-tighter">Set Quantity</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-xl border-2 border-border/50 p-1 bg-background">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-lg hover:bg-muted"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-lg font-black">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-lg hover:bg-muted"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4 pt-2">
                  <Label htmlFor="notes" className="text-lg font-black uppercase tracking-tighter">
                    Special Instructions
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="E.g. Gift wrapping, specific delivery timing, or preferences..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="border-border/50 focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 rounded-2xl bg-muted/30 border border-border/50">
              {isCustomSelected ? (
                <Button
                  size="xl"
                  className="w-full sm:w-auto h-14 px-10 text-lg font-black uppercase tracking-tight shadow-lg shadow-primary/20"
                  onClick={handleCalculateCost}
                  disabled={!customRequest.trim() || isSubmittingCustom}
                >
                  {isSubmittingCustom ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-6 w-6 mr-3" />
                      Get My Quotation
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full sm:w-auto h-14 px-8 text-lg font-black uppercase tracking-tight border-2 border-primary/20 hover:bg-primary/5"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="h-6 w-6 mr-3" />
                    Add to Cart
                  </Button>
                  <Button
                    size="xl"
                    className="w-full sm:w-auto h-14 px-10 text-lg font-black uppercase tracking-tight shadow-lg shadow-primary/20"
                    onClick={handleCheckout}
                  >
                    <CreditCard className="h-6 w-6 mr-3" />
                    Checkout - {formatPrice(unitPrice * quantity)}
                  </Button>
                </>
              )}
            </div>

            {/* Features */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "100% Quality Guaranteed",
                "Secure Payment with Paystack",
                "Same Day Delivery Available",
                "Pristine Packaging Included",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedClassData && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          packageData={{
            id: pkg.id,
            categoryId: pkg.category_id,
            name: pkg.name,
            description: pkg.description || "",
            image: pkg.image_cover_url || "/placeholder.svg",
            price_vip: pkg.price_vip,
            price_special: pkg.price_special,
            price_standard: pkg.price_standard,
            starting_from: pkg.starting_from,
          }}
          selectedClass={selectedClassData}
          quantity={quantity}
          notes={notes}
        />
      )}
    </Layout>
  );
}