import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, Minus, Plus, Trash2, Calculator, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/categories";

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  // Check if any items have custom requests (need admin pricing)
  const hasCustomRequests = items.some(item => item.customRequest);
  
  // For class-based orders (VIP/SPECIAL/STANDARD), go directly to checkout/payment
  // For custom requests, show "Calculate My Cost" and wait for admin
  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    
    // Navigate to checkout with all cart items
    navigate("/checkout", {
      state: {
        cartItems: items,
        totalAmount: getCartTotal(),
      },
    });
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <h1 className="text-3xl font-bold font-display mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added any packages yet
              </p>
              <Link to="/categories">
                <Button>
                  Browse Packages
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-muted/30 overflow-hidden flex items-center justify-center">
                        {item.package.image && item.package.image !== "/placeholder.svg" ? (
                          <img
                            src={item.package.image}
                            alt={item.package.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.package.name}</h3>
                        {item.selectedClass && (
                          <p className="text-sm text-muted-foreground">
                            Class: {item.selectedClass.name}
                          </p>
                        )}
                        {item.customRequest && (
                          <p className="text-sm text-amber-600">
                            Custom Request
                          </p>
                        )}
                        <p className="text-primary font-semibold mt-1">
                          {item.customRequest ? "Price TBD" : formatPrice(item.unitPrice)}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Quantity & Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1 rounded-lg border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <p className="text-sm font-semibold">
                          {item.customRequest ? "Pending" : formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={clearCart}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Order Summary</h2>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items ({items.length})</span>
                      <span>{hasCustomRequests ? "Price pending" : formatPrice(getCartTotal())}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">
                        {hasCustomRequests ? "To be calculated" : formatPrice(getCartTotal())}
                      </span>
                    </div>
                  </div>

                  {/* Different buttons based on order type */}
                  {hasCustomRequests ? (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleProceedToCheckout}
                    >
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate My Cost
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleProceedToCheckout}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                    </Button>
                  )}

                  <Link to="/categories" className="block">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}