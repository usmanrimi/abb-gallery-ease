import { useParams, Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/categories";
import { Package as PackageIcon, ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { usePackages } from "@/hooks/usePackages";

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading: categoriesLoading } = useCategories();
  const category = categories.find((cat) => cat.slug === slug);

  // Use database packages instead of static
  const { packages: categoryPackages, loading: packagesLoading } = usePackages(category?.id);

  const loading = categoriesLoading || (category && packagesLoading);

  if (!loading && !category) {
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

  // Loading State
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Redirect if category is Coming Soon
  if (category?.is_coming_soon) {
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
          <span className="text-foreground">{category?.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-display md:text-4xl">{category?.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            {category?.description}
          </p>
        </div>

        {categoryPackages.length === 0 ? (
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
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/35 via-primary/10 to-accent/20 relative overflow-hidden flex items-center justify-center p-6 rounded-t-lg border-b border-primary/20">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
                    {pkg.image_cover_url && pkg.image_cover_url !== "/placeholder.svg" ? (
                      <img
                        src={pkg.image_cover_url}
                        alt={pkg.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
                      />
                    ) : (
                      <PackageIcon className="h-16 w-16 text-primary/30" />
                    )}
                  </div>
                  <CardContent className="p-5 flex flex-col h-full">
                    <h3 className="font-display font-semibold text-lg mb-2">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                      {pkg.description}
                    </p>
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Starting From</span>
                        <span className="text-xl font-black text-primary">
                          {formatPrice(pkg.starting_from || pkg.price_standard || 0)}
                        </span>
                      </div>
                      <Button size="sm" className="font-bold uppercase tracking-tighter h-9 px-4">
                        View Package
                      </Button>
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
              .filter((c) => c.id !== category?.id && !c.is_coming_soon)
              .map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary overflow-hidden">
                    {cat.image_url && cat.image_url !== "/placeholder.svg" ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-contain" />
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
