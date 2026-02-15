import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-display font-semibold text-lg leading-tight">M. Abba</span>
                <span className="text-xs text-muted-foreground leading-tight">Gallery</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Shopping Made Easy. Your trusted destination for quality packages and exceptional service.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/categories" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Shop All
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Track Order
              </Link>
            </nav>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Categories</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/categories/kayan-sallah" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Kayan Sallah
              </Link>
              <Link to="/categories/kayan-lefe" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Kayan Lefe
              </Link>
              <Link to="/categories/haihuwa" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Haihuwa
              </Link>
              <Link to="/categories/seasonal" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Seasonal Packages
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold">Contact Us</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:09081818121" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                09081818121
              </a>
              <a href="mailto:abbatrading2017@gmail.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                abbatrading2017@gmail.com
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Kabuga, Kano State, Nigeria</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} M. Abba Gallery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
