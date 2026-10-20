/**
 * Catalogue source shared with the customer storefront.
 * Mirrors the customer app's `src/data/boutique.ts` so both apps render the
 * same categories, sub-categories, products, colours and timelines.
 */

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
  area: "Gandhipuram, Coimbatore",
  mapUrl: "https://maps.app.goo.gl/sMeKczDah8m2FeWs9",
};

export const waLink = (phone: string, message: string) =>
  `https://wa.me/${formatWhatsappNumber(phone || storeInfo?.whatsapp || "919791712622")}?text=${encodeURIComponent(message)}`;


/** DELIVERY + TAX RULES (store_settings) */
export const storeSettings = { gstPercent: 5, deliveryFee: 49, freeAbove: 499 };

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

export type SubCategory = { id: string; name: string; blurb: string; images: string[]; subs?: SubCategory[] };

export type Category = {
  id: CategoryId;
  name: string;
  blurb: string;
  image: string;
  subs: SubCategory[];
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

export const findCategory = (id: string) => categories.find((c) => c.id === id);
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
export const subName = (subId: string) => {
  for (const c of categories) {
    for (const s of getAllSubCategories(c)) {
      if (s.id === subId) return s.name;
    }
  }
  return subId;
};

/** product_variants.size options */
export const sareeSizeOptions = ["Standard"] as const;
export const blouseSizeOptions = ["32", "34", "36", "38", "40", "42"] as const;
export const stitchedSizeOptions = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const halfSareeSizes = ["S", "M", "L", "XL", "XXL"] as const;
export const lehengaSizes = ["S", "M", "L", "XL", "XXL"] as const;
export const frocksSizes = ["S", "M", "L", "XL", "XXL"] as const;
export const salwarReadymadeSizes = ["S", "M", "L", "XL", "XXL"] as const;
export const pattuPaavadaiAgeSizes = [
  "1 Year", "2 Year", "3 Year", "4 Year", "5 Year", "6 Year", "7 Year", "8 Year",
  "9 Year", "10 Year", "11 Year", "12 Year", "13 Year", "14 Year", "15 Year", "16 Year",
] as const;

export const sizeOptions = [
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "Standard",
  ...pattuPaavadaiAgeSizes,
] as const;
export type SizeOption = string;

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

export function getPermittedSizesForCategory(categoryId?: string, subId?: string): readonly string[] {
  if (isSareeCategory(categoryId, subId)) {
    return sareeSizeOptions;
  }
  if (isBlouseCategory(categoryId)) {
    return blouseSizeOptions;
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
  return stitchedSizeOptions;
}

/** colours table */
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
  { name: "Wine", hex: "#5E1B2E" },
  { name: "Mint", hex: "#9FD8C0" },
];

export const colourHex = (name: string) =>
  colourSwatches.find((c) => c.name === name)?.hex ?? "#C9A227";

export type TimelineId = "1-hour" | "1-day" | "2-day" | "3-day";

/** stitching_timelines */
export const timelines: { id: TimelineId; label: string; hours: number }[] = [
  { id: "1-hour", label: "1 Hour", hours: 1 },
  { id: "1-day", label: "1 Day", hours: 24 },
  { id: "2-day", label: "2 Days", hours: 48 },
  { id: "3-day", label: "3 Days", hours: 72 },
];

export const timelineById = (id: string | TimelineId) => {
  if (!id) return { id: "3-day", label: "3 Days", hours: 72 };
  const strId = String(id);
  const normHyphen = strId.replace(/_/g, "-");
  const normSingular = normHyphen.endsWith("s") ? normHyphen.slice(0, -1) : normHyphen;
  const normPlural = normHyphen.endsWith("s") ? normHyphen : `${normHyphen}s`;
  const found = timelines.find((t) => t.id === strId || t.id === normHyphen || t.id === normSingular || t.id === normPlural);
  if (found) return found;

  const words = strId.replace(/_/g, " ").split(" ");
  const cleanLabel = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { id: strId, label: cleanLabel, hours: 24 };
};

const defaultSizes: SizeOption[] = ["XS", "S", "M", "L", "XL"];
const nameBits = ["Signature", "Heritage", "Studio", "Festive", "Couture", "Classic"];

export type SeedProduct = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  images: string[];
  category: CategoryId;
  sub: string;
  sizes: SizeOption[];
  description: string;
};

/** The same catalogue products the storefront renders. */
export const seedProducts: SeedProduct[] = categories.flatMap((cat) => {
  const subs = getAllSubCategories(cat);
  if (subs.length === 0) {
    const isBlouse = cat.id === "blouses";
    const isFrock = cat.id === "frocks";
    return Array.from({ length: 6 }, (_, i) => {
      const imgs = rotate(isBlouse ? pools.blouse : isFrock ? pools.frock : pools.saree, i);
      const price = isBlouse ? 1899 + i * 800 : isFrock ? 1899 + i * 650 : 2499 + i * 1200;
      return {
        id: `${cat.id}-${i + 1}`,
        name: `${nameBits[i % nameBits.length]} ${cat.name}`,
        price,
        mrp: Math.round((price * 1.38) / 10) * 10,
        images: imgs.slice(0, 4),
        category: cat.id,
        sub: "",
        sizes: isBlouse ? [...blouseSizeOptions] : isFrock ? [...frocksSizes] : ["Standard"],
        description: isBlouse
          ? `Handcrafted ${cat.name.toLowerCase()} design from our Coimbatore studio — authentic aari, maggam, and custom embroidery with premium silk finishing.`
          : isFrock
          ? `${cat.name} from our studio line, stitched to your exact measurements with neat inside-out finishing.`
          : `Handcrafted ${cat.name.toLowerCase()} drape from our Coimbatore studio — authentic pure weave with artisan gold zari border and matched unstitched blouse piece.`,
      } satisfies SeedProduct;
    });
  }
  return subs.flatMap((sub, sIdx) =>
    Array.from({ length: 4 }, (_, i) => {
      const imgs = rotate(sub.images, i);
      const price = 1499 + sIdx * 1800 + i * 950 + (cat.id === "half-saree" ? 5200 : 0);
      return {
        id: `${sub.id}-${i + 1}`,
        name: `${nameBits[(sIdx + i) % nameBits.length]} ${sub.name}`,
        price,
        mrp: Math.round((price * 1.38) / 10) * 10,
        images: imgs.slice(0, 4),
        category: cat.id,
        sub: sub.id,
        sizes: defaultSizes,
        description: `${sub.name} from our ${cat.name} studio line — ${sub.blurb.toLowerCase()}, stitched to your exact measurements with neat inside-out finishing.`,
      } satisfies SeedProduct;
    }),
  );
});
