import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { Package, ArrowRight, Loader2 } from "lucide-react";

export default function Categories() {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 md:py-20 animate-fade-in">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Shop by Category</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our curated collections of premium celebration packages for every occasion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, i) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="group"
            >
              <Card
                variant="interactive"
                className="overflow-hidden h-full animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-primary/30 via-primary/10 to-accent/25 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
                    />
                  ) : (
                    <Package className="h-20 w-20 text-primary/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="font-display font-semibold text-xl">{category.name}</h2>
                  </div>
                </div>
                <CardContent className="p-5">
                  <p className="text-muted-foreground">
                    {category.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-primary font-medium">
                    View Packages
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
