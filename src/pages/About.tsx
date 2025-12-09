import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, Truck, Shield, Heart, Users, Star, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <h1 className="text-4xl font-bold font-display md:text-5xl mb-6">
              Shopping Made <span className="text-primary">Easy</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              At M. Abba Gallery, we believe everyone deserves access to quality celebration packages 
              without the hassle. Our mission is to make your special moments truly memorable with 
              curated packages delivered right to your doorstep.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold font-display text-center mb-12">Why Choose Us</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Package,
                title: "Quality Products",
                description: "Every item in our packages is carefully selected for quality and value.",
              },
              {
                icon: Truck,
                title: "Fast Delivery",
                description: "We deliver to your doorstep on your preferred date and time.",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                description: "Your payments are protected with industry-standard security.",
              },
              {
                icon: Heart,
                title: "Customer Care",
                description: "Our dedicated team is always ready to help with your needs.",
              },
            ].map((value, i) => (
              <Card
                key={i}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CardContent className="pt-8 pb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
            {[
              { value: "10,000+", label: "Happy Customers" },
              { value: "500+", label: "Packages Delivered" },
              { value: "50+", label: "Package Options" },
              { value: "4.9", label: "Customer Rating" },
            ].map((stat, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <p className="text-4xl font-bold font-display">{stat.value}</p>
                <p className="text-primary-foreground/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold font-display mb-4">Ready to Experience the Difference?</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Browse our collection of premium packages and discover why thousands of customers trust M. Abba Gallery.
              </p>
              <Link to="/categories">
                <Button size="xl">
                  Start Shopping
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
