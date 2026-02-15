import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categories } from "@/data/categories";
import { ArrowRight, Package as PackageIcon, Truck, CreditCard, Star, ChevronRight, Home, Store } from "lucide-react";
import logo from "@/assets/logo.png";
import { useCategorySettings } from "@/hooks/useCategorySettings";

const Index = () => {
  const { isComingSoon } = useCategorySettings();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container py-16 md:py-24 lg:py-32">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Star className="h-4 w-4 fill-current" />
                Trusted by 10,000+ customers
              </div>
              <div className="flex items-center gap-4 mb-4">
                <img src={logo} alt="M. Abba Gallery" className="h-20 w-auto" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl font-display text-balance">
                Shopping Made{" "}
                <span className="text-primary">Easy</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Discover premium celebration packages for every occasion. From Sallah to weddings, 
                we've got everything you need delivered right to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/categories">
                  <Button variant="hero" className="w-full sm:w-auto">
                    Shop Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="hero-outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.2),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--accent)/0.2),transparent_50%)]" />
                <div className="relative h-full w-full flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    {categories.slice(0, 4).map((cat, i) => {
                      const comingSoon = isComingSoon(cat.slug);
                      const hasImage = cat.image && cat.image !== "/placeholder.svg";
                      
                      if (comingSoon) {
                        return (
                          <div
                            key={cat.id}
                            className="aspect-square rounded-2xl bg-card shadow-elevated overflow-hidden flex flex-col items-center justify-center text-center animate-float opacity-60 relative cursor-not-allowed"
                            style={{ animationDelay: `${i * 0.2}s` }}
                            onClick={() => alert("Coming Soon")}
                          >
                            {hasImage ? (
                              <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-contain p-2" />
                            ) : (
                              <PackageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            )}
                            <span className="absolute bottom-2 left-2 right-2 text-sm font-medium line-clamp-2 text-muted-foreground bg-background/80 rounded px-1">{cat.name}</span>
                            <span className="absolute top-2 right-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
                          </div>
                        );
                      }
                      
                      return (
                        <Link
                          key={cat.id}
                          to={`/categories/${cat.slug}`}
                          className="aspect-square rounded-2xl bg-card shadow-elevated overflow-hidden flex flex-col items-center justify-center text-center animate-float hover:scale-105 transition-transform cursor-pointer relative"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        >
                          {hasImage ? (
                            <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-contain p-2" />
                          ) : (
                            <PackageIcon className="h-8 w-8 text-primary mb-2" />
                          )}
                          <span className="absolute bottom-2 left-2 right-2 text-sm font-medium line-clamp-2 bg-background/80 rounded px-1">{cat.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Updated with Home Services and Store Shopping */}
      <section className="border-y bg-muted/30">
        <div className="container py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: PackageIcon, title: "Quality Packages", desc: "Curated premium items" },
              { icon: Truck, title: "Fast Delivery", desc: "To your doorstep" },
              { icon: CreditCard, title: "Easy Payments", desc: "Flexible installments" },
              { icon: Home, title: "Home Services", desc: "Free and Past" },
              { icon: Store, title: "Store Shopping", desc: "Visit our gallery" },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-4 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold font-display md:text-4xl">Shop by Category</h2>
              <p className="mt-2 text-muted-foreground">
                Find the perfect package for your celebration
              </p>
            </div>
            <Link to="/categories" className="group inline-flex items-center gap-1 text-primary font-medium">
              View all categories
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, i) => {
              const comingSoon = isComingSoon(category.slug);
              
              if (comingSoon) {
                return (
                  <div
                    key={category.id}
                    className="group cursor-not-allowed"
                    onClick={() => alert("Coming Soon")}
                  >
                    <Card
                      className="overflow-hidden animate-slide-up opacity-60"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-muted/30 to-muted/10 relative overflow-hidden flex items-center justify-center">
                        {category.image && category.image !== "/placeholder.svg" ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="max-w-full max-h-full object-contain p-2"
                          />
                        ) : (
                          <PackageIcon className="h-16 w-16 text-muted-foreground/40" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="font-display font-semibold text-lg text-muted-foreground">{category.name}</h3>
                        </div>
                        <span className="absolute top-3 right-3 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                          Coming Soon
                        </span>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                        <div className="mt-3 flex items-center gap-1 text-muted-foreground text-sm font-medium">
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
                    className="overflow-hidden animate-slide-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden flex items-center justify-center">
                      {category.image && category.image !== "/placeholder.svg" ? (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <PackageIcon className="h-16 w-16 text-primary/40" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-display font-semibold text-lg">{category.name}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-primary text-sm font-medium">
                        Explore
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold font-display md:text-4xl">
              Ready to Start Shopping?
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              Create an account today and enjoy exclusive benefits, easy order tracking, 
              and flexible payment options.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
