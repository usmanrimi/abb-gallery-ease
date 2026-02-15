import { useParams, Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoryBySlug, categories, formatPrice } from "@/data/categories";
import { Package as PackageIcon, ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import { useCategorySettings } from "@/hooks/useCategorySettings";
import { usePackages } from "@/hooks/usePackages";

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isComingSoon } = useCategorySettings();
  const category = getCategoryBySlug(slug || "");
  
  // Use database packages instead of static
  const { packages: categoryPackages, loading } = usePackages(category?.id);

  if (!category) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Link to="/categories">
            <Button>Back to Categories</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Redirect if category is Coming Soon
  if (isComingSoon(category.slug)) {
    return <Navigate to="/categories" replace />;
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-display md:text-4xl">{category.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : categoryPackages.length === 0 ? (
          <div className="text-center py-16">
            <PackageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No packages available</h3>
            <p className="text-muted-foreground">
              Check back soon for new packages in this category.
            </p>
          </div>
        ) : (
          /* Packages Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoryPackages.map((pkg, i) => (
              <Link
                key={pkg.id}
                to={`/package/${pkg.id}`}
                className="group"
              >
                <Card
                  variant="interactive"
                  className="overflow-hidden h-full animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden flex items-center justify-center p-2">
                    {pkg.image_url && pkg.image_url !== "/placeholder.svg" ? (
                      <img
                        src={pkg.image_url}
                        alt={pkg.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <PackageIcon className="h-16 w-16 text-primary/30" />
                    )}
                    {pkg.has_classes && pkg.classes && pkg.classes.length > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-medium">
                          {pkg.classes.length} classes
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-display font-semibold text-lg mb-2">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {pkg.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        {pkg.starting_price ? (
                          <span className="text-sm text-muted-foreground">
                            Starting from{" "}
                            <span className="text-lg font-semibold text-foreground">
                              {formatPrice(pkg.starting_price)}
                            </span>
                          </span>
                        ) : pkg.base_price ? (
                          <span className="text-lg font-semibold">
                            {formatPrice(pkg.base_price)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 text-primary text-sm font-medium">
                        View
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Other Categories */}
        <div className="mt-16 pt-10 border-t">
          <h2 className="text-xl font-display font-semibold mb-6">Other Categories</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories
              .filter((c) => c.id !== category.id && !isComingSoon(c.slug))
              .map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary overflow-hidden">
                    {cat.image && cat.image !== "/placeholder.svg" ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                    ) : (
                      <PackageIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">Browse packages</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
