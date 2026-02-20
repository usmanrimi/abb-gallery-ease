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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb ... (rest of the component) */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Categories</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display md:text-4xl">Shop by Category</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our curated collection of packages for every occasion
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => {
            const comingSoon = category.is_coming_soon;

            if (comingSoon) {
              return (
                <div
                  key={category.id}
                  className="group cursor-not-allowed"
                  onClick={() => alert("Coming Soon")}
                >
                  <Card
                    className="overflow-hidden h-full animate-slide-up opacity-60"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="aspect-[16/10] bg-gradient-to-br from-muted/30 to-muted/10 relative overflow-hidden flex items-center justify-center p-4">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Package className="h-20 w-20 text-muted-foreground/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="font-display font-semibold text-xl text-muted-foreground">{category.name}</h2>
                      </div>
                      <span className="absolute top-3 right-3 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                        Coming Soon
                      </span>
                    </div>
                    <CardContent className="p-5">
                      <p className="text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-muted-foreground font-medium">
                        Coming Soon
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            }

            return (
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
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden flex items-center justify-center p-4">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                    ) : (
                      <Package className="h-20 w-20 text-primary/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
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
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
