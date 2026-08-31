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

const CDN = "https://res.cloudinary.com/vy7aodsr/image/upload";

/** IMAGE POOLS — controlled by System Admin */
const pools = {
  saree: [
    `${CDN}/v1786514182/Saree_2.jpg`,
    `${CDN}/v1786514182/Saree_1.jpg`,
    `${CDN}/v1786514181/Saree_Carousel_Banner.jpg`,
    `${CDN}/v1786514176/Saree_3_1.jpg`,
    `${CDN}/v1786514179/Hero_1.jpg`,
  ],
  halfSaree: [
    `${CDN}/v1786514177/Half_Saree_Carousel_Banner.jpg`,
    `${CDN}/v1786514188/Half_Saree_3.jpg`,
    `${CDN}/v1786514187/Half_Saree_4.jpg`,
    `${CDN}/v1786514187/Half_Saree_5.jpg`,
    `${CDN}/v1786514186/ClipDown.com_653704456_18349411366235782_5258352626430629678_n.jpg`,
    `${CDN}/v1786514185/ClipDown.com_655209410_18349411375235782_4734640962354729668_n.jpg`,
  ],
  blouse: [
    `${CDN}/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg`,
    `${CDN}/v1786515413/ClipDown.com_637145115_1234791462100053_6149715155187710123_n.jpg`,
    `${CDN}/v1786515415/ClipDown.com_635728507_1234791218766744_5137578646251161937_n.jpg`,
    `${CDN}/v1786515413/ClipDown.com_637799249_1234791785433354_6533404444269247280_n.jpg`,
  ],
  frock: [
    `${CDN}/v1786514177/Kurti_7.jpg`,
    `${CDN}/v1786514176/Kurti_Carousel_Banner.jpg`,
    `${CDN}/v1786514175/Kurti_6_1.jpg`,
    `${CDN}/v1786514178/Kurti_5.jpg`,
    `${CDN}/v1786514182/Kurti_1.jpg`,
    `${CDN}/v1786514183/Kurti_4.jpg`,
    `${CDN}/v1786514184/Kurti_2.jpg`,
  ],
};

export const imagePools = pools;

const rotate = <T,>(arr: T[], by: number) => arr.map((_, i) => arr[(i + by) % arr.length]!);

export type CategoryId = "half-saree" | "frocks" | "sarees" | "blouses";

export type SubCategory = {
  id: string;
  name: string;
  blurb: string;
  images: string[];
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
    image: `${CDN}/v1786514176/Saree_3_1.jpg`,
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
        name: "Pattu Pudavai",
        blurb: "Traditional temple-border silk",
        images: rotate(pools.saree, 3),
      },
    ],
  },
  {
    id: "frocks",
    name: "Frocks",
    blurb: "Everyday to wedding wear",
    image: `${CDN}/v1786514176/Kurti_Carousel_Banner.jpg`,
    subs: [
      {
        id: "normal-frocks",
        name: "Normal Frocks",
        blurb: "Soft cottons for daily comfort",
        images: rotate(pools.frock, 0),
      },
      {
        id: "wedding-frocks",
        name: "Wedding Frocks",
        blurb: "Layered gowns for the big day",
        images: rotate(pools.frock, 3),
      },
      {
        id: "designer-frocks",
        name: "Designer Frocks",
        blurb: "Statement cuts & hand work",
        images: rotate(pools.frock, 5),
      },
    ],
  },
  {
    id: "sarees",
    name: "Sarees",
    blurb: "Silk, fancy & designer drapes",
    image: `${CDN}/v1786514181/Saree_Carousel_Banner.jpg`,
    subs: [
      {
        id: "silk-sarees",
        name: "Silk Sarees",
        blurb: "Kanchi silk with gold zari",
        images: rotate(pools.saree, 0),
      },
      {
        id: "fancy-sarees",
        name: "Fancy Sarees",
        blurb: "Light drapes for functions",
        images: rotate(pools.saree, 2),
      },
      {
        id: "designer-sarees",
        name: "Designer Sarees",
        blurb: "Custom pallu & blouse pairing",
        images: rotate(pools.saree, 4),
      },
    ],
  },
  {
    id: "blouses",
    name: "Blouses",
    blurb: "Aari, maggam & designer work",
    image: `${CDN}/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg`,
    subs: [
      {
        id: "bridal-blouses",
        name: "Bridal Blouses",
        blurb: "Heavy zari & sleeve work",
        images: rotate(pools.blouse, 0),
      },
      {
        id: "pattern-blouses",
        name: "Pattern Blouses",
        blurb: "Princess cut, boat & sweetheart",
        images: rotate(pools.blouse, 1),
      },
      {
        id: "designer-blouses",
        name: "Designer Blouses",
        blurb: "Aari and maggam couture",
        images: rotate(pools.blouse, 2),
      },
    ],
  },
];

// Apply real brand marketing copy over the structural seed data.
for (const cat of categories) {
  const cc = categoryCopy[cat.id];
  if (cc) cat.blurb = cc.blurb;
  for (const sub of cat.subs) {
    const sc = subCopy[sub.id];
    if (sc) sub.blurb = sc.blurb;
  }
}

export const findCategory = (id?: string) => {
  if (!id) return categories[0]!;
  const cat = categories.find((c) => c.id === id);
  if (cat) return cat;

  const clean = id.toLowerCase().trim();
  if (clean === "blouse" || clean === "blouses") return categories.find((c) => c.id === "blouses")!;
  if (clean === "frock" || clean === "frocks") return categories.find((c) => c.id === "frocks")!;
  if (clean === "saree" || clean === "sarees") return categories.find((c) => c.id === "sarees")!;
  if (clean === "half-saree" || clean === "halfsaree" || clean === "half_saree" || clean === "half saree" || clean === "lehenga") return categories.find((c) => c.id === "half-saree")!;

  return categories[0]!;
};
export const findSub = (categoryId: string, subId: string) =>
  findCategory(categoryId)?.subs.find((s) => s.id === subId);

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
  description: string;
};

export const sareeSizes = ["Free Size (5.5m + Blouse)", "With Running Blouse", "Without Blouse", "6.3m Grand Pallu"];
export const stitchedSizes = ["XS", "S", "M", "L", "XL", "XXL"];

export function isSareeCategory(categoryId: string, subId?: string): boolean {
  if (categoryId === "sarees") return true;
  if (categoryId === "half-saree" && subId === "pattu-pudavai") return true;
  return false;
}

export function getSizesForCategory(categoryId: string, subId?: string): string[] {
  if (isSareeCategory(categoryId, subId)) {
    return sareeSizes;
  }
  return stitchedSizes;
}

const defaultSizes = ["XS", "S", "M", "L", "XL"];

const nameBits = ["Signature", "Heritage", "Studio", "Festive", "Couture", "Classic"];

/** PRODUCTS — boutique model (one-of-a-kind design) */
export const products: Product[] = categories.flatMap((cat) =>
  cat.subs.flatMap((sub, sIdx) =>
    Array.from({ length: 4 }, (_, i) => {
      const imgs = rotate(sub.images, i);
      const base = 1499 + sIdx * 1800 + i * 950 + (cat.id === "half-saree" ? 5200 : 0);
      const price = base;
      const isUnstitched = isSareeCategory(cat.id, sub.id);
      const categorySizes = isUnstitched ? ["Free Size (5.5m + Blouse)"] : defaultSizes;
      const variants: SizeVariant[] = categorySizes.map((s, si) => ({
        size: s,
        available: isUnstitched ? true : (sIdx + i + si) % 5 !== 0,
      }));
      const availableCount = variants.filter((v) => v.available).length;
      return {
        id: `${sub.id}-${i + 1}`,
        name: `${nameBits[(sIdx + i) % nameBits.length]} ${sub.name}`,
        price,
        mrp: Math.round((price * 1.38) / 10) * 10,
        image: imgs[0]!,
        images: imgs.slice(0, 4),
        category: cat.id,
        sub: sub.id,
        sizes: categorySizes,
        variants,
        deliveryCharge: 0,
        soldOut: availableCount === 0,
        description: productCopy(sub.id, `${nameBits[(sIdx + i) % nameBits.length]} ${sub.name}`),
      } satisfies Product;
    }),
  ),
);

export const productsBySub = (categoryId: string, subId: string) =>
  products.filter((p) => p.category === categoryId && p.sub === subId);
export const productsByCategory = (categoryId: string) =>
  products.filter((p) => p.category === categoryId);
export const findProduct = (id: string) => products.find((p) => p.id === id);
export const subCount = (categoryId: string, subId: string) =>
  productsBySub(categoryId, subId).length;

/** FEATURED PRODUCTS */
export const featuredProducts = [
  "lehenga-1",
  "half-saree-classic-1",
  "bridal-blouses-1",
  "normal-frocks-1",
  "silk-sarees-2",
  "wedding-frocks-2",
  "designer-blouses-3",
  "pattu-pudavai-1",
]
  .map((id) => findProduct(id))
  .filter((p): p is Product => !!p);

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

export const reels = [
  {
    id: "reel-1",
    title: "Bridal Lehenga Reveal",
    videoUrl:
      "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    posterUrl: `${CDN}/v1786514177/Half_Saree_Carousel_Banner.jpg`,
    productId: "lehenga-1",
  },
  {
    id: "reel-2",
    title: "Aari Sleeve Embroidery",
    videoUrl:
      "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    posterUrl: `${CDN}/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg`,
    productId: "bridal-blouses-1",
  },
  {
    id: "reel-3",
    title: "Half Saree Drape Styling",
    videoUrl:
      "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    posterUrl: `${CDN}/v1786514188/Half_Saree_3.jpg`,
    productId: "half-saree-classic-1",
  },
  {
    id: "reel-4",
    title: "Kanchi Silk Blouse Stitch",
    videoUrl:
      "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    posterUrl: `${CDN}/v1786514181/Saree_Carousel_Banner.jpg`,
    productId: "silk-sarees-1",
  },
  {
    id: "reel-5",
    title: "1-Hour Express Fitting",
    videoUrl:
      "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    posterUrl: `${CDN}/v1786514176/Kurti_Carousel_Banner.jpg`,
    productId: "wedding-frocks-1",
  },
];

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
