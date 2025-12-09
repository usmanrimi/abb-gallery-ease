import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function Cart() {
  // For now, cart is empty - in a real app, this would come from context/state
  const cartItems: any[] = [];

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <h1 className="text-3xl font-bold font-display mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
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
          <div>
            {/* Cart items would go here */}
          </div>
        )}
      </div>
    </Layout>
  );
}
