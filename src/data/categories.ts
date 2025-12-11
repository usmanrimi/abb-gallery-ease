import alhajiBabbaImg from "@/assets/packages/alhaji-babba.png";
import hajiyaBabbaImg from "@/assets/packages/hajiya-babba.jpg";
import manyanYaraImg from "@/assets/packages/manyan-yara.jpg";
import babbanYayaImg from "@/assets/packages/babban-yaya.png";
import grandmaImg from "@/assets/packages/grandma.png";

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
  startingPrice: number;
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

// Updated Kayan Sallah classes with single starting prices
const kayanSallahClasses: PackageClass[] = [
  { id: "vip", name: "VIP", startingPrice: 350000, description: "Premium quality with luxury items" },
  { id: "special", name: "Special", startingPrice: 200000, description: "High quality with selected items" },
  { id: "standard", name: "Standard", startingPrice: 50000, description: "Quality items for the family" },
  { id: "regular", name: "Regular", startingPrice: 10000, description: "Essential items package" },
];

export const packages: Package[] = [
  // Kayan Sallah Packages
  { id: "ks-1", categoryId: "1", name: "Alhaji Babba Package", description: "Premium package for the head of the family", image: alhajiBabbaImg, hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-2", categoryId: "1", name: "Hajiya Babba Package", description: "Premium package for the matriarch", image: hajiyaBabbaImg, hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-3", categoryId: "1", name: "Manyan Yara Package", description: "Package for older children", image: manyanYaraImg, hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-4", categoryId: "1", name: "Babban Yaya Package", description: "Package for the eldest sibling", image: babbanYayaImg, hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-5", categoryId: "1", name: "Grandma Package", description: "Special package for grandmother", image: grandmaImg, hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-6", categoryId: "1", name: "Marayu Package (Male)", description: "Package for orphan boys", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-7", categoryId: "1", name: "Babbar Yaya Package", description: "Package for the eldest sister", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-8", categoryId: "1", name: "Grandpa Package", description: "Special package for grandfather", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-9", categoryId: "1", name: "Marayu Package (Female)", description: "Package for orphan girls", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-10", categoryId: "1", name: "Dan Lele Package", description: "Package for young boys", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-11", categoryId: "1", name: "Hadimai Package (Male)", description: "Package for male helpers", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-12", categoryId: "1", name: "Masses (Male)", description: "Affordable package for men", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-13", categoryId: "1", name: "Distribution Package (Male)", description: "Bulk distribution package for men", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-14", categoryId: "1", name: "Hadimai Package (Female)", description: "Package for female helpers", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-15", categoryId: "1", name: "Masses (Female)", description: "Affordable package for women", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-16", categoryId: "1", name: "Distribution Package (Female)", description: "Bulk distribution package for women", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-17", categoryId: "1", name: "Ya Imam Package", description: "Special package for religious leaders", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-18", categoryId: "1", name: "Family Combo Package", description: "Complete package for the entire family", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-19", categoryId: "1", name: "Iyayen Na Package", description: "Package for parents", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  { id: "ks-20", categoryId: "1", name: "Yar Lele Package", description: "Package for young girls", image: "/placeholder.svg", hasClasses: true, classes: kayanSallahClasses },
  
  // Kayan Lefe Packages
  { id: "kl-1", categoryId: "2", name: "Amarya mai capacity", description: "Complete bridal package with everything needed", image: "/placeholder.svg", hasClasses: true, classes: [
    { id: "vip", name: "VIP", startingPrice: 500000, description: "Ultimate luxury bridal package" },
    { id: "special", name: "Special", startingPrice: 300000, description: "Premium bridal collection" },
    { id: "standard", name: "Standard", startingPrice: 150000, description: "Beautiful bridal essentials" },
  ]},
  { id: "kl-2", categoryId: "2", name: "Daga ke ba kari", description: "Essential bridal starter package", image: "/placeholder.svg", hasClasses: true, classes: [
    { id: "vip", name: "VIP", startingPrice: 400000, description: "Luxury starter package" },
    { id: "special", name: "Special", startingPrice: 200000, description: "Premium starter collection" },
    { id: "standard", name: "Standard", startingPrice: 100000, description: "Essential starter items" },
  ]},
  
  // Haihuwa Packages
  { id: "hh-1", categoryId: "3", name: "Baby Welcome", description: "Complete naming ceremony package with all essentials", image: "/placeholder.svg", hasClasses: true, classes: [
    { id: "vip", name: "VIP", startingPrice: 120000, description: "Premium baby welcome set" },
    { id: "special", name: "Special", startingPrice: 60000, description: "Special baby collection" },
    { id: "regular", name: "Regular", startingPrice: 30000, description: "Essential baby items" },
  ]},
  { id: "hh-2", categoryId: "3", name: "Mother & Baby Care", description: "Care package for new mother and baby", image: "/placeholder.svg", hasClasses: false, basePrice: 95000 },
  
  // Seasonal Packages
  { id: "sp-1", categoryId: "4", name: "Ramadan", description: "Special Ramadan package with prayer essentials and more", image: "/placeholder.svg", hasClasses: true, classes: [
    { id: "vip", name: "VIP", startingPrice: 200000, description: "Complete Ramadan luxury set" },
    { id: "standard", name: "Standard", startingPrice: 50000, description: "Essential Ramadan package" },
  ]},
  { id: "sp-2", categoryId: "4", name: "Harmattan", description: "Special harmattan season package", image: "/placeholder.svg", hasClasses: true, classes: [
    { id: "vip", name: "VIP", startingPrice: 150000, description: "Complete harmattan luxury set" },
    { id: "standard", name: "Standard", startingPrice: 50000, description: "Essential harmattan package" },
  ]},
  { id: "sp-3", categoryId: "4", name: "Raining", description: "Rainy season essentials package", image: "/placeholder.svg", hasClasses: true, classes: [
    { id: "vip", name: "VIP", startingPrice: 150000, description: "Complete rainy season set" },
    { id: "standard", name: "Standard", startingPrice: 50000, description: "Essential rainy season package" },
  ]},
  { id: "sp-4", categoryId: "4", name: "Back to School", description: "Back to school essentials for students", image: "/placeholder.svg", hasClasses: true, classes: [
    { id: "vip", name: "VIP", startingPrice: 100000, description: "Complete school luxury set" },
    { id: "standard", name: "Standard", startingPrice: 30000, description: "Essential school package" },
  ]},
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
