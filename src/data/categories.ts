import alhajiBabbaImg from "@/assets/packages/alhaji-babba.png";
import hajiyaBabbaImg from "@/assets/packages/hajiya-babba.jpg";
import manyanYaraImg from "@/assets/packages/manyan-yara.jpg";
import babbanYayaImg from "@/assets/packages/babban-yaya.png";
import grandmaImg from "@/assets/packages/grandma.png";
import babbarYarinyaImg from "@/assets/packages/babbar-yarinya.png";
import babbarYayaImg from "@/assets/packages/babbar-yaya.png";
import hadimaiImg from "@/assets/packages/hadimai.png";
import yaMalamImg from "@/assets/packages/ya-malam.png";
import yarLeleImg from "@/assets/packages/yar-lele.png";

// Class section images (displayed on package detail page)
import alhajiBabbaClassImg from "@/assets/packages/class/alhaji-babba-class.png";
import babbanYayaClassImg from "@/assets/packages/class/babban-yaya-class.png";
import hajiyaBabbaClassImg from "@/assets/packages/class/hajiya-babba-class.png";
import grandmaClassImg from "@/assets/packages/class/grandma-class.png";
import yarLeleClassImg from "@/assets/packages/class/yar-lele-class.png";
import yaMalamClassImg from "@/assets/packages/class/ya-malam-class.png";
import hadimaiClassImg from "@/assets/packages/class/hadimai-class.png";
import babbarYayaClassImg from "@/assets/packages/class/babbar-yaya-class.png";
import danLeleClassImg from "@/assets/packages/class/dan-lele-class.png";
import babbarYarinyaClassImg from "@/assets/packages/class/babbar-yarinya-class.png";

// Category images
import kayanLefeImg from "@/assets/categories/kayan-lefe.png";
import kayanSallahImg from "@/assets/categories/kayan-sallah.png";

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
  image: string; // Card image (shown on grid)
  classImage?: string; // Class section image (shown on detail page)
  hasClasses: boolean;
  classes?: PackageClass[];
  basePrice?: number;
  startingPrice?: number;
}

export interface PackageClass {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
}

export const categories: Category[] = [
  {
    id: "1",
    name: "Kayan Sallah",
    description: "Premium Eid celebration packages with everything you need for a memorable Sallah",
    image: kayanSallahImg,
    slug: "kayan-sallah",
  },
  {
    id: "2",
    name: "Kayan Lefe",
    description: "Complete wedding packages for the perfect celebration of love",
    image: kayanLefeImg,
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
  // Kayan Sallah Packages - Updated with new pricing structure (3 classes only: VIP, SPECIAL, STANDARD)
  {
    id: "ks-1",
    categoryId: "1",
    name: "Alhaji Babba Package",
    description: "Premium package for the head of the family",
    image: alhajiBabbaImg,
    classImage: alhajiBabbaClassImg,
    hasClasses: true,
    startingPrice: 500000,
    classes: [
      { id: "vip", name: "VIP", price: 1000000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 750000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 500000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-2",
    categoryId: "1",
    name: "Hajiya Babba Package",
    description: "Premium package for the matriarch",
    image: hajiyaBabbaImg,
    classImage: hajiyaBabbaClassImg,
    hasClasses: true,
    startingPrice: 500000,
    classes: [
      { id: "vip", name: "VIP", price: 1000000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 750000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 500000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-3",
    categoryId: "1",
    name: "Manyan Yara Package",
    description: "Package for older children",
    image: manyanYaraImg,
    hasClasses: true,
    startingPrice: 100000,
    classes: [
      { id: "vip", name: "VIP", price: 300000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 200000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 100000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-4",
    categoryId: "1",
    name: "Babban Yaya Package",
    description: "Package for the eldest sibling (male)",
    image: babbanYayaImg,
    classImage: babbanYayaClassImg,
    hasClasses: true,
    startingPrice: 200000,
    classes: [
      { id: "vip", name: "VIP", price: 500000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 350000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 200000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-5",
    categoryId: "1",
    name: "Grandma Package",
    description: "Special package for grandmother",
    image: grandmaImg,
    classImage: grandmaClassImg,
    hasClasses: true,
    startingPrice: 100000,
    classes: [
      { id: "vip", name: "VIP", price: 500000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 300000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 100000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-6",
    categoryId: "1",
    name: "Yar Lele Package",
    description: "Package for young girls",
    image: yarLeleImg,
    classImage: yarLeleClassImg,
    hasClasses: true,
    startingPrice: 200000,
    classes: [
      { id: "vip", name: "VIP", price: 500000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 300000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 200000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-7",
    categoryId: "1",
    name: "Ya Malam Package",
    description: "Special package for religious leaders",
    image: yaMalamImg,
    classImage: yaMalamClassImg,
    hasClasses: true,
    startingPrice: 100000,
    classes: [
      { id: "vip", name: "VIP", price: 300000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 200000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 100000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-8",
    categoryId: "1",
    name: "Hadimai Package",
    description: "Package for helpers",
    image: hadimaiImg,
    classImage: hadimaiClassImg,
    hasClasses: true,
    startingPrice: 50000,
    classes: [
      { id: "vip", name: "VIP", price: 100000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 70000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 50000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-9",
    categoryId: "1",
    name: "Babbar Yaya Package",
    description: "Package for the eldest sister",
    image: babbarYayaImg,
    classImage: babbarYayaClassImg,
    hasClasses: true,
    startingPrice: 200000,
    classes: [
      { id: "vip", name: "VIP", price: 500000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 350000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 200000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-10",
    categoryId: "1",
    name: "Dan Lele Package",
    description: "Package for young boys",
    image: "/placeholder.svg",
    classImage: danLeleClassImg,
    hasClasses: true,
    startingPrice: 150000,
    classes: [
      { id: "vip", name: "VIP", price: 500000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 300000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 150000, description: "Quality items for the family" },
    ],
  },
  {
    id: "ks-11",
    categoryId: "1",
    name: "Babbar Yarinya Package",
    description: "Package for the eldest daughter",
    image: babbarYarinyaImg,
    classImage: babbarYarinyaClassImg,
    hasClasses: true,
    startingPrice: 100000,
    classes: [
      { id: "vip", name: "VIP", price: 300000, description: "Premium quality with luxury items" },
      { id: "special", name: "SPECIAL", price: 200000, description: "High quality with selected items" },
      { id: "standard", name: "STANDARD", price: 100000, description: "Quality items for the family" },
    ],
  },

  // Kayan Lefe Packages - Fixed prices, NO classes
  {
    id: "kl-1",
    categoryId: "2",
    name: "Amarya Mai Capacity",
    description: "Complete bridal package with everything needed",
    image: "/placeholder.svg",
    hasClasses: false,
    basePrice: 1500000,
  },
  {
    id: "kl-2",
    categoryId: "2",
    name: "First Lady",
    description: "Premium luxury bridal package for the sophisticated bride",
    image: "/placeholder.svg",
    hasClasses: false,
    basePrice: 2500000,
  },
  {
    id: "kl-3",
    categoryId: "2",
    name: "Daga Ke Ba Kari",
    description: "The ultimate custom bridal experience",
    image: "/placeholder.svg",
    hasClasses: false,
    basePrice: 5000000,
  },

  // Haihuwa Packages
  {
    id: "hh-1",
    categoryId: "3",
    name: "Baby Welcome",
    description: "Complete naming ceremony package with all essentials",
    image: "/placeholder.svg",
    hasClasses: true,
    startingPrice: 30000,
    classes: [
      { id: "vip", name: "VIP", price: 120000, description: "Premium baby welcome set" },
      { id: "special", name: "SPECIAL", price: 60000, description: "Special baby collection" },
      { id: "standard", name: "STANDARD", price: 30000, description: "Essential baby items" },
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
    name: "Ramadan",
    description: "Special Ramadan package with prayer essentials and more",
    image: "/placeholder.svg",
    hasClasses: true,
    startingPrice: 50000,
    classes: [
      { id: "vip", name: "VIP", price: 200000, description: "Complete Ramadan luxury set" },
      { id: "special", name: "SPECIAL", price: 100000, description: "Special Ramadan collection" },
      { id: "standard", name: "STANDARD", price: 50000, description: "Essential Ramadan package" },
    ],
  },
  {
    id: "sp-2",
    categoryId: "4",
    name: "Harmattan",
    description: "Special harmattan season package",
    image: "/placeholder.svg",
    hasClasses: true,
    startingPrice: 50000,
    classes: [
      { id: "vip", name: "VIP", price: 150000, description: "Complete harmattan luxury set" },
      { id: "special", name: "SPECIAL", price: 80000, description: "Special harmattan collection" },
      { id: "standard", name: "STANDARD", price: 50000, description: "Essential harmattan package" },
    ],
  },
  {
    id: "sp-3",
    categoryId: "4",
    name: "Raining",
    description: "Rainy season essentials package",
    image: "/placeholder.svg",
    hasClasses: true,
    startingPrice: 50000,
    classes: [
      { id: "vip", name: "VIP", price: 150000, description: "Complete rainy season set" },
      { id: "special", name: "SPECIAL", price: 80000, description: "Special rainy season collection" },
      { id: "standard", name: "STANDARD", price: 50000, description: "Essential rainy season package" },
    ],
  },
  {
    id: "sp-4",
    categoryId: "4",
    name: "Back to School",
    description: "Back to school essentials for students",
    image: "/placeholder.svg",
    hasClasses: true,
    startingPrice: 30000,
    classes: [
      { id: "vip", name: "VIP", price: 100000, description: "Complete school luxury set" },
      { id: "special", name: "SPECIAL", price: 50000, description: "Special school collection" },
      { id: "standard", name: "STANDARD", price: 30000, description: "Essential school package" },
    ],
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
  return "₦" + new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
