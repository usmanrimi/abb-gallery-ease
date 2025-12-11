import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getPackageById, getCategoryBySlug, categories, formatPrice } from "@/data/categories";
import { Package, ChevronRight, Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pkg = getPackageById(id || "");
  const category = pkg ? categories.find((c) => c.id === pkg.categoryId) : null;

  const [selectedClass, setSelectedClass] = useState(
    pkg?.hasClasses && pkg.classes ? pkg.classes[0].id : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

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

  const selectedClassData = pkg.classes?.find((c) => c.id === selectedClass);
  // Use basePrice or estimate from priceRange for calculation purposes
  const unitPrice = pkg.basePrice || 50000; // Base estimate, actual price will be calculated by admin
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    // In a real app, this would add to cart state/context
    navigate("/checkout", {
      state: {
        package: pkg,
        selectedClass: selectedClassData,
        quantity,
        notes,
        totalPrice,
      },
    });
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
          <Link to={`/categories/${category.slug}`} className="hover:text-primary">
            {category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{pkg.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="animate-fade-in">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
              {pkg.image && pkg.image !== "/placeholder.svg" ? (
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-32 w-32 text-primary/30" />
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
            
            <p className="text-muted-foreground text-lg mb-6">
              {pkg.description}
            </p>

            <Card className="mb-6">
              <CardContent className="p-6 space-y-6">
                {/* Class Selection */}
                {pkg.hasClasses && pkg.classes && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Class</Label>
                    <RadioGroup
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                      className="grid gap-3 sm:grid-cols-2"
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
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{cls.name}</span>
                              <span className="font-bold text-primary text-sm">
                                Starting from {formatPrice(cls.startingPrice)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {cls.description}
                            </p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
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
                    <span className="text-muted-foreground">
                      × {formatPrice(unitPrice)}
                    </span>
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

            {/* Price & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(totalPrice)}</p>
              </div>
              <Button
                size="xl"
                className="w-full sm:w-auto"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Proceed Order
              </Button>
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
    </Layout>
  );
}
