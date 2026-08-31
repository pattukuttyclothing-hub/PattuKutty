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

const _env = (typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined") ? (import.meta.env as Record<string, string | undefined>) : {};
const rawWhatsapp = _env["VITE_WHATSAPP_NUMBER"] || "919791712622";
const rawPhone = _env["VITE_STORE_PHONE"] || "+91 97917 12622";

export const storeInfo = {
  name: "Pattu Kutty",
  tagline: "Coimbatore's fastest ladies dress designer",
  phone: rawPhone,
  whatsapp: formatWhatsappNumber(rawWhatsapp),
  area: "Gandhipuram, Coimbatore",
};

export const waLink = (phone: string, message: string) =>
  `https://wa.me/${formatWhatsappNumber(phone || storeInfo.whatsapp)}?text=${encodeURIComponent(message)}`;


/** DELIVERY + TAX RULES (store_settings) */
export const storeSettings = { gstPercent: 5, deliveryFee: 49, freeAbove: 499 };

const CDN = "https://res.cloudinary.com/vy7aodsr/image/upload";

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

export type SubCategory = { id: string; name: string; blurb: string; images: string[] };

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

export const findCategory = (id: string) => categories.find((c) => c.id === id);
export const findSub = (categoryId: string, subId: string) =>
  findCategory(categoryId)?.subs.find((s) => s.id === subId);
export const subName = (subId: string) =>
  categories.flatMap((c) => c.subs).find((s) => s.id === subId)?.name ?? subId;

/** product_variants.size options */
export const sareeSizeOptions = [
  "Free Size (5.5m + Blouse)",
  "With Running Blouse",
  "Without Blouse",
  "6.3m Grand Pallu",
] as const;

export const stitchedSizeOptions = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const sizeOptions = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "Free Size (5.5m + Blouse)",
  "With Running Blouse",
  "Without Blouse",
  "6.3m Grand Pallu",
] as const;
export type SizeOption = string;

export function isSareeCategory(categoryId?: string, subId?: string): boolean {
  if (categoryId === "sarees") return true;
  if (categoryId === "half-saree" && subId === "pattu-pudavai") return true;
  return false;
}

export function getPermittedSizesForCategory(categoryId?: string, subId?: string): readonly string[] {
  if (isSareeCategory(categoryId, subId)) {
    return sareeSizeOptions;
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

/** The same 48 catalogue products the storefront renders. */
export const seedProducts: SeedProduct[] = categories.flatMap((cat) =>
  cat.subs.flatMap((sub, sIdx) =>
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
  ),
);
