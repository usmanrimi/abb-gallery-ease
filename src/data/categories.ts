export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  slug: string;
}

export interface Package {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  hasClasses: boolean;
  classes?: PackageClass[];
  basePrice?: number;
}

export interface PackageClass {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Kayan Sallah",
    description: "Premium Eid celebration packages with everything you need for a memorable Sallah",
    image: "/placeholder.svg",
    slug: "kayan-sallah",
  },
  {
    id: "2",
    name: "Kayan Lefe",
    description: "Complete wedding packages for the perfect celebration of love",
    image: "/placeholder.svg",
    slug: "kayan-lefe",
  },
  {
    id: "3",
    name: "Haihuwa",
    description: "Beautiful baby shower and naming ceremony packages",
    image: "/placeholder.svg",
    slug: "haihuwa",
  },
  {
    id: "4",
    name: "Seasonal Packages",
    description: "Special limited-time packages for various occasions throughout the year",
    image: "/placeholder.svg",
    slug: "seasonal",
  },
];

export const packages: Package[] = [
  // Kayan Sallah Packages
  {
    id: "ks-1",
    categoryId: "1",
    name: "Sallah Essentials",
    description: "Basic package with essential items for Eid celebration including clothing and accessories",
    image: "/placeholder.svg",
    hasClasses: true,
    classes: [
      { id: "vip", name: "VIP", price: 150000, description: "Premium quality with luxury items" },
      { id: "special", name: "Special", price: 100000, description: "High quality with selected items" },
      { id: "standard", name: "Standard", price: 75000, description: "Quality items for the family" },
      { id: "regular", name: "Regular", price: 50000, description: "Essential items package" },
    ],
  },
  {
    id: "ks-2",
    categoryId: "1",
    name: "Family Sallah Bundle",
    description: "Complete family package with items for the whole household",
    image: "/placeholder.svg",
    hasClasses: true,
    classes: [
      { id: "vip", name: "VIP", price: 300000, description: "Luxury family package" },
      { id: "special", name: "Special", price: 200000, description: "Premium family selection" },
      { id: "standard", name: "Standard", price: 150000, description: "Quality family bundle" },
    ],
  },
  // Kayan Lefe Packages
  {
    id: "kl-1",
    categoryId: "2",
    name: "Bridal Complete",
    description: "Everything the bride needs for her special day",
    image: "/placeholder.svg",
    hasClasses: true,
    classes: [
      { id: "vip", name: "VIP", price: 500000, description: "Ultimate luxury bridal package" },
      { id: "special", name: "Special", price: 350000, description: "Premium bridal collection" },
      { id: "standard", name: "Standard", price: 250000, description: "Beautiful bridal essentials" },
    ],
  },
  {
    id: "kl-2",
    categoryId: "2",
    name: "Wedding Celebration",
    description: "Party supplies and decoration package for the ceremony",
    image: "/placeholder.svg",
    hasClasses: false,
    basePrice: 180000,
  },
  // Haihuwa Packages
  {
    id: "hh-1",
    categoryId: "3",
    name: "Baby Welcome",
    description: "Complete naming ceremony package with all essentials",
    image: "/placeholder.svg",
    hasClasses: true,
    classes: [
      { id: "vip", name: "VIP", price: 120000, description: "Premium baby welcome set" },
      { id: "special", name: "Special", price: 80000, description: "Special baby collection" },
      { id: "regular", name: "Regular", price: 50000, description: "Essential baby items" },
    ],
  },
  {
    id: "hh-2",
    categoryId: "3",
    name: "Mother & Baby Care",
    description: "Care package for new mother and baby",
    image: "/placeholder.svg",
    hasClasses: false,
    basePrice: 95000,
  },
  // Seasonal Packages
  {
    id: "sp-1",
    categoryId: "4",
    name: "Ramadan Special",
    description: "Special Ramadan package with prayer essentials and more",
    image: "/placeholder.svg",
    hasClasses: true,
    classes: [
      { id: "vip", name: "VIP", price: 200000, description: "Complete Ramadan luxury set" },
      { id: "standard", name: "Standard", price: 100000, description: "Essential Ramadan package" },
    ],
  },
  {
    id: "sp-2",
    categoryId: "4",
    name: "Year-End Bundle",
    description: "Special end of year celebration package",
    image: "/placeholder.svg",
    hasClasses: false,
    basePrice: 75000,
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((cat) => cat.slug === slug);
}

export function getPackagesByCategory(categoryId: string): Package[] {
  return packages.filter((pkg) => pkg.categoryId === categoryId);
}

export function getPackageById(id: string): Package | undefined {
  return packages.find((pkg) => pkg.id === id);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price);
}
