/**
 * ---------------------------------------------------------------------------
 * MOCK DATA — CONTROLLED BY SYSTEM ADMIN
 * ---------------------------------------------------------------------------
 * Every array in this file is the exact shape the separate System Admin
 * dashboard app edits.
 * ---------------------------------------------------------------------------
 */

import { categoryCopy, subCopy, productCopy } from "@/data/copy";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import aboutStore from "@/assets/about-store.jpg";

export function formatWhatsappNumber(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export const storeInfo = {
  name: "Pattu Kutty",
  tagline: "Coimbatore's fastest ladies dress designer",
  phone: "+91 97917 12622",
  whatsapp: "919791712622",
  instagram: "@pattu.kutty",
  address: "463, Bharathiyar Road, Pappanaicken Palayam, Coimbatore – 641037",
  area: "Gandhipuram, Coimbatore",
  hours: [
    { day: "Monday – Saturday", time: "9:30 AM – 8:30 PM" },
    { day: "Sunday", time: "10:00 AM – 2:00 PM" },
  ],
};

export const waLink = (message: string) =>
  `https://wa.me/${storeInfo?.whatsapp || "919791712622"}?text=${encodeURIComponent(message)}`;


/** DELIVERY RULES — controlled by System Admin */
export const deliveryRules = { freeAbove: 499, fee: 49 };

/** HERO BANNERS — controlled by System Admin */
export const heroBanners = [
  {
    id: "hb-1",
    image: hero1,
    eyebrow: "Bridal Couture 2026",
    headline: "LEHANGA",
    subtext:
      "Hand-embroidered rani pink bridal lehengas, cut and finished to your exact measurements.",
    cta: "Book a Fitting",
  },
  {
    id: "hb-2",
    image: hero2,
    eyebrow: "Readymade & Custom",
    headline: "HALF SAREE",
    subtext: "Soft silks, gold zari borders and drape work styled for your ceremony.",
    cta: "Explore Half Sarees",
  },
  {
    id: "hb-3",
    image: hero3,
    eyebrow: "Signature Craft",
    headline: "BLOUSES",
    subtext: "Designer aari and zari blouses stitched in as little as one hour.",
    cta: "Enquire Now",
  },
  {
    id: "hb-4",
    image: hero4,
    eyebrow: "Festive Favourites",
    headline: "PATTU PAVADAI",
    subtext: "Traditional silk pavadai sets for every family celebration.",
    cta: "See Festive Picks",
  },
];

/** HERO STATS strip — controlled by System Admin */
export const heroStats = [
  { value: "10k+", label: "Outfits Stitched" },
  { value: "500+", label: "Bridal Lehengas" },
  { value: "1 Hr", label: "Express Stitching" },
];

/** IMAGE POOLS — controlled by System Admin */
const pools = {
  saree: [
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514182/Saree_2.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514182/Saree_1.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514181/Saree_Carousel_Banner.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Saree_3_1.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514179/Hero_1.jpg",
  ],
  halfSaree: [
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514188/Half_Saree_3.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514187/Half_Saree_4.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514187/Half_Saree_5.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514186/ClipDown.com_653704456_18349411366235782_5258352626430629678_n.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514185/ClipDown.com_655209410_18349411375235782_4734640962354729668_n.jpg",
  ],
  blouse: [
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515413/ClipDown.com_637145115_1234791462100053_6149715155187710123_n.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515415/ClipDown.com_635728507_1234791218766744_5137578646251161937_n.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515413/ClipDown.com_637799249_1234791785433354_6533404444269247280_n.jpg",
  ],
  frock: [
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Kurti_7.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Kurti_Carousel_Banner.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514175/Kurti_6_1.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514178/Kurti_5.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514182/Kurti_1.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514183/Kurti_4.jpg",
    "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514184/Kurti_2.jpg",
  ],
};

export const imagePools = pools;

const rotate = <T,>(arr: T[], by: number) => arr.map((_, i) => arr[(i + by) % arr.length]!);

export type CategoryId = "half-saree" | "frocks" | "sarees" | "blouses" | "salwar";

export type SubCategory = {
  id: string;
  name: string;
  blurb: string;
  images: string[];
  subs?: SubCategory[];
  designCount?: number;
  design_count?: number;
};

export type Category = {
  id: CategoryId;
  name: string;
  blurb: string;
  image: string;
  subs: SubCategory[];
  designCount?: number;
  design_count?: number;
};

export const categories: Category[] = [
  {
    id: "half-saree",
    name: "Half Saree",
    blurb: "Ceremony sets & bridal drapes",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Saree_3_1.jpg",
    subs: [
      {
        id: "half-saree-classic",
        name: "Half Saree",
        blurb: "Silk sets with zari drape work",
        images: rotate(pools.halfSaree, 0),
      },
      {
        id: "lehenga",
        name: "Lehenga",
        blurb: "Bridal flare & can-can layers",
        images: rotate(pools.halfSaree, 2),
      },
      {
        id: "pattu-pudavai",
        name: "Pattu Paavadai",
        blurb: "Traditional temple-border silk",
        images: rotate(pools.saree, 3),
      },
    ],
  },
  {
    id: "frocks",
    name: "Frocks",
    blurb: "Everyday to wedding wear",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Kurti_Carousel_Banner.jpg",
    subs: [],
  },
  {
    id: "sarees",
    name: "Sarees",
    blurb: "Silk, fancy & designer drapes",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514181/Saree_Carousel_Banner.jpg",
    subs: [],
  },
  {
    id: "blouses",
    name: "Blouses",
    blurb: "Aari, maggam & designer work",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg",
    subs: [],
  },
  {
    id: "salwar",
    name: "Salwar",
    blurb: "Stitched tops, kurtis & unstitched dress materials",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Kurti_7.jpg",
    subs: [
      {
        id: "salwar-readymade",
        name: "Readymade",
        blurb: "Stitched tops & kurtis ready to wear",
        images: rotate(pools.frock, 1),
      },
      {
        id: "salwar-materials",
        name: "Materials",
        blurb: "Unstitched dress materials & fabric sets",
        images: rotate(pools.frock, 0),
      },
    ],
  },
];

// Helper function to flatten all subcategories including nested ones
export const getAllSubCategories = (cat: Category): SubCategory[] => {
  const list: SubCategory[] = [];
  for (const s of cat.subs) {
    list.push(s);
    if (s.subs && s.subs.length > 0) {
      list.push(...s.subs);
    }
  }
  return list;
};

// Apply real brand marketing copy over the structural seed data.
for (const cat of categories) {
  const cc = categoryCopy[cat.id];
  if (cc) cat.blurb = cc.blurb;
  for (const sub of cat.subs) {
    const sc = subCopy[sub.id];
    if (sc) sub.blurb = sc.blurb;
    if (sub.subs) {
      for (const nestedSub of sub.subs) {
        const nsc = subCopy[nestedSub.id];
        if (nsc) nestedSub.blurb = nsc.blurb;
      }
    }
  }
}

export const findCategory = (id?: string) => {
  if (!id) return categories[0]!;
  const cat = categories.find((c) => c.id === id);
  if (cat) return cat;

  const clean = id.toLowerCase().trim();
  if (clean === "salwar" || clean === "salwars" || clean === "churidhar" || clean === "kurti" || clean === "kurthi")
    return categories.find((c) => c.id === "salwar")!;
  if (clean === "blouse" || clean === "blouses") return categories.find((c) => c.id === "blouses")!;
  if (clean === "frock" || clean === "frocks") return categories.find((c) => c.id === "frocks")!;
  if (clean === "saree" || clean === "sarees") return categories.find((c) => c.id === "sarees")!;
  if (clean === "half-saree" || clean === "halfsaree" || clean === "half_saree" || clean === "half saree" || clean === "lehenga") return categories.find((c) => c.id === "half-saree")!;

  return categories[0]!;
};

export const findSub = (categoryId: string, subId: string): SubCategory | undefined => {
  const cat = findCategory(categoryId);
  if (!cat) return undefined;
  for (const s of cat.subs) {
    if (s.id === subId) return s;
    if (s.subs) {
      const child = s.subs.find((n) => n.id === subId);
      if (child) return child;
    }
  }
  return undefined;
};

export type SizeVariant = {
  size: string;
  available: boolean;
  stockQty?: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  basePrice?: number;
  base_price?: number;
  mrp: number;
  badge?: string;
  expressFromPrice?: number;
  express_from_price?: number;
  rating?: number;
  image: string;
  images: string[];
  category: CategoryId;
  sub: string;
  sizes: string[];
  variants: SizeVariant[];
  deliveryCharge: number;
  delivery_charge?: number;
  soldOut: boolean;
  sold_out?: boolean;
  blurb?: string;
  description: string;
};

export const sareeSizes = ["Standard"];
export const blouseSizes = ["32", "34", "36", "38", "40", "42"];
export const stitchedSizes = ["XS", "S", "M", "L", "XL", "XXL"];
export const halfSareeSizes = ["S", "M", "L", "XL", "XXL"];
export const lehengaSizes = ["S", "M", "L", "XL", "XXL"];
export const frocksSizes = ["S", "M", "L", "XL", "XXL"];
export const salwarReadymadeSizes = ["S", "M", "L", "XL", "XXL"];
export const pattuPaavadaiAgeSizes = [
  "1 Year", "2 Year", "3 Year", "4 Year", "5 Year", "6 Year", "7 Year", "8 Year",
  "9 Year", "10 Year", "11 Year", "12 Year", "13 Year", "14 Year", "15 Year", "16 Year",
];

export function isSareeCategory(categoryId?: string, subId?: string): boolean {
  if (categoryId === "sarees") return true;
  return false;
}

export function isPattuPaavadaiCategory(categoryId?: string, subId?: string): boolean {
  return subId === "pattu-pudavai" || subId === "pattu-paavadai";
}

export function isHalfSareeCategory(categoryId?: string, subId?: string): boolean {
  return categoryId === "half-saree" && !isPattuPaavadaiCategory(categoryId, subId);
}

export function isBlouseCategory(categoryId?: string): boolean {
  return categoryId === "blouses" || categoryId === "blouse";
}

export function isFrocksCategory(categoryId?: string): boolean {
  return categoryId === "frocks";
}

export function isSalwarReadymadeCategory(categoryId?: string, subId?: string): boolean {
  const cleanCat = (categoryId || "").toLowerCase().trim();
  const cleanSub = (subId || "").toLowerCase().trim();
  return (
    (cleanCat === "salwar" || cleanCat === "salwars") &&
    (cleanSub === "salwar-readymade" || cleanSub === "readymade" || cleanSub === "salwar-readymade-top" || cleanSub === "salwar-readymade-kurthi")
  );
}

export function getSizesForCategory(categoryId?: string, subId?: string): string[] {
  if (isSareeCategory(categoryId, subId)) {
    return sareeSizes;
  }
  if (categoryId && isBlouseCategory(categoryId)) {
    return blouseSizes;
  }
  if (isPattuPaavadaiCategory(categoryId, subId)) {
    return pattuPaavadaiAgeSizes;
  }
  if (isHalfSareeCategory(categoryId, subId)) {
    return halfSareeSizes;
  }
  if (isFrocksCategory(categoryId)) {
    return frocksSizes;
  }
  if (isSalwarReadymadeCategory(categoryId, subId)) {
    return salwarReadymadeSizes;
  }
  return stitchedSizes;
}

const defaultSizes = ["S", "M", "L", "XL", "XXL"];

const nameBits = ["Signature", "Heritage", "Studio", "Festive", "Couture", "Classic"];

/** PRODUCTS — boutique model (populated dynamically from live backend) */
export const products: Product[] = [];

export const productsBySub = (categoryId: string, subId: string) => {
  if (!subId || categoryId === "sarees" || categoryId === "blouses") {
    return productsByCategory(categoryId);
  }
  const sub = findSub(categoryId, subId);
  const targetSubIds = new Set<string>([subId]);
  if (sub?.subs) {
    for (const child of sub.subs) {
      targetSubIds.add(child.id);
    }
  }
  return products.filter((p) => p.category === categoryId && targetSubIds.has(p.sub));
};
export const productsByCategory = (categoryId: string) =>
  products.filter((p) => p.category === categoryId);
export const findProduct = (id?: string | null): Product | undefined => {
  if (!id || typeof id !== "string") return undefined;
  return products.find((p) => p.id === id);
};
export const subCount = (categoryId: string, subId: string) =>
  productsBySub(categoryId, subId).length;

/** FEATURED PRODUCTS */
export const featuredProducts: Product[] = [];

/** BASIC COLOUR SWATCHES for customisation design studio */
export const colourSwatches = [
  { name: "Rani Pink", hex: "#D6336C" },
  { name: "Maroon", hex: "#7B1E3A" },
  { name: "Deep Red", hex: "#B3121F" },
  { name: "Gold", hex: "#C9A227" },
  { name: "Ivory", hex: "#F3EADF" },
  { name: "Blush", hex: "#F2C1CE" },
  { name: "Emerald", hex: "#1F7A5A" },
  { name: "Teal", hex: "#17696E" },
  { name: "Navy", hex: "#1F2E5A" },
  { name: "Mustard", hex: "#D8A21B" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "Lilac", hex: "#B49AD1" },
];

export type TimelineId = "1-hour" | "1-day" | "2-day" | "3-day";

/** STITCHING TIMELINES */
export const timelines: {
  id: TimelineId;
  label: string;
  badge?: string;
  from: number;
  note: string;
}[] = [
  {
    id: "1-hour",
    label: "1 Hour",
    badge: "Specialised",
    from: 899,
    note: "Express counter stitching for urgent functions. Extra charges apply.",
  },
  {
    id: "1-day",
    label: "1 Day",
    badge: "Most Loved",
    from: 599,
    note: "Stitched and ready by tomorrow evening.",
  },
  {
    id: "2-day",
    label: "2 Days",
    from: 449,
    note: "Comfortable stitching window for medium hand work.",
  },
  {
    id: "3-day",
    label: "3 Days",
    from: 399,
    note: "Best for heavy aari, maggam and bridal blouse work.",
  },
];

export const timelineById = (id: TimelineId) =>
  timelines.find((t) => t.id === id) ?? timelines[3]!;

export const aboutBadges = [
  { icon: "⏱", label: "1-Hour Express", desc: "Fastest ladies dress designer in Coimbatore." },
  { icon: "📦", label: "Doorstep & Pickup", desc: "Convenient delivery or store pickup options." },
  { icon: "✂️", label: "Custom Stitching", desc: "Stitched to your exact body measurements." },
  { icon: "🌍", label: "Worldwide Shipping", desc: "Serving clients in India and overseas." },
];

export const aboutImage = aboutStore;

export const customHighlights = [
  { icon: "⏱", title: "1-Hour Stitching", desc: "Express delivery for last-minute events." },
  { icon: "🎨", title: "Your Choice", desc: "Choose your own fabric, colour and embroidery." },
  { icon: "📐", title: "Exact Fit", desc: "Tailored to your specific measurements." },
];

export const customServices = categories.map((c) => ({
  id: c.id,
  title: c.name,
  blurb: c.blurb,
  image: c.image,
}));

export const reels: any[] = [];

export const reviews = [
  {
    id: "rev-1",
    name: "Divya Ramesh",
    initials: "DR",
    rating: 5,
    quote: "Stitched my bridal lehenga in 2 days. Perfect fitting without any alteration required!",
  },
  {
    id: "rev-2",
    name: "Anitha Suresh",
    initials: "AS",
    rating: 5,
    quote: "Very impressed with the express 1-hour blouse stitching. Saved my reception!",
  },
];
