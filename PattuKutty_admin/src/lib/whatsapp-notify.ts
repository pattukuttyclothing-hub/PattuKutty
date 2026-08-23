/**
 * WhatsApp Studio — campaign data layer.
 *
 * One record per broadcast ever sent. Campaigns reference the catalogue by id
 * (never a price snapshot), so an old campaign always renders the live price.
 * State lives in a module-scoped pub/sub store read through
 * `useSyncExternalStore`; swapping this for a Cloud table later only changes
 * the read/write helpers, not the record shape.
 */

import { useSyncExternalStore } from "react";
import { categories, imagePools, seedProducts, storeSettings, subName } from "@/data/boutique";
import type { CategoryId } from "@/data/boutique";
import type { AdminProduct } from "@/lib/admin-store";

/* ------------------------------------------------------------------- types */

/** Audience labels are derived from the promoted design, so this is open-ended. */
export type Audience = string;

export type AudienceOption = { id: Audience; label: string; hint: string; size: number };

export const ALL_CUSTOMERS: AudienceOption = {
  id: "All Customers",
  label: "All Customers",
  hint: "Everyone who has ever ordered or enquired.",
  size: 1420,
};

/** Stable pseudo contact count so a segment always shows the same size. */
const segmentSize = (key: string, min: number, max: number) => {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return min + (h % (max - min));
};

export type DistrictStat = { district: string; visitors: number };

export type Campaign = {
  id: string;
  /** catalogue id of the promoted product/offer — "" for a freeform broadcast */
  itemId: string;
  custom?: { name: string; image: string; message: string };
  audience: Audience;
  audienceSize: number;
  note: string;
  sentOn: string;
  hoursAgo: number;
  /** message funnel */
  sent: number;
  opened: number;
  clicked: number;
  /** business funnel */
  reached: number;
  visited: number;
  bought: number;
  districts: DistrictStat[];
};

/** Anything the admin can promote — products and studio offers share one shape. */
export type PublishedItem = {
  id: string;
  kind: "Product";
  name: string;
  image: string;
  price: number;
  mrp: number;
  blurb: string;
  category?: CategoryId;
  sub?: string;
};

/* --------------------------------------------------------------- geography */

/** Delivery districts, Coimbatore first — the boutique's real catchment. */
export const districts = [
  "Coimbatore",
  "Tiruppur",
  "Erode",
  "Salem",
  "Namakkal",
  "Karur",
  "Nilgiris",
  "Dindigul",
  "Madurai",
  "Trichy",
  "Chennai",
  "Palakkad",
  "Thrissur",
  "Bengaluru",
];

const productToItem = (p: {
  id: string;
  name: string;
  images: string[];
  description: string;
  basePrice?: number;
  price?: number;
  mrp: number;
  category: CategoryId;
  sub: string;
}): PublishedItem => ({
  id: p.id,
  kind: "Product",
  name: p.name,
  image: p.images[0]!,
  price: p.basePrice ?? p.price ?? 0,
  mrp: p.mrp,
  blurb: p.description,
  category: p.category,
  sub: p.sub,
});

/** Catalogue snapshot used by the store's synthetic seed data. */
const SEED_ITEMS: PublishedItem[] = seedProducts.map(productToItem);

export const publishedItemsFrom = (products: AdminProduct[]): PublishedItem[] =>
  products.filter((p) => p.isActive).map(productToItem);

export const itemById = (items: PublishedItem[], id: string) => items.find((i) => i.id === id);

export const campaignItem = (items: PublishedItem[], c: Campaign): PublishedItem | undefined =>
  c.custom
    ? {
        id: c.id,
        kind: "Product",
        name: c.custom.name,
        image: c.custom.image,
        price: 0,
        mrp: 0,
        blurb: c.custom.message,
      }
    : itemById(items, c.itemId) ?? itemById(SEED_ITEMS, c.itemId);

export const discountPct = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const itemLink = (item: PublishedItem) =>
  `https://pattukutty.in/designs/${item.id}`;

/* ----------------------------------------------------------------- audiences */

const categoryName = (id?: CategoryId) => categories.find((c) => c.id === id)?.name;

/**
 * Audience options for a promoted design: everyone, plus buyers of the exact
 * sub-category and buyers of the whole category it belongs to.
 */
export const audiencesFor = (item?: PublishedItem): AudienceOption[] => {
  const list: AudienceOption[] = [ALL_CUSTOMERS];
  if (!item) return list;

  if (item.sub) {
    const label = `Bought ${subName(item.sub)} before`;
    list.push({
      id: label,
      label,
      hint: `Customers who already ordered a ${subName(item.sub).toLowerCase()} from you.`,
      size: segmentSize(item.sub, 90, 380),
    });
  }
  const cat = categoryName(item.category);
  if (cat) {
    const label = `Bought any ${cat}`;
    list.push({
      id: label,
      label,
      hint: `Everyone who has ordered anything in the ${cat} line.`,
      size: segmentSize(String(item.category), 320, 820),
    });
  }
  return list;
};

/* ------------------------------------------------------------ synth helpers */

const decay = (base: number, count: number) =>
  districts.slice(0, count).map((district, i) => ({
    district,
    visitors: Math.max(1, Math.round(base * Math.pow(0.78, i))),
  }));

const isoAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

const funnel = (audienceSize: number, clickRate: number, buyRate: number) => {
  const reached = audienceSize;
  const opened = Math.round(reached * 0.82);
  const visited = Math.round(reached * clickRate);
  const bought = Math.round(visited * buyRate);
  return {
    sent: reached,
    opened,
    clicked: visited,
    reached,
    visited,
    bought,
    districts: decay(Math.round(visited / 3.2), reached < 500 ? 8 : 14),
  };
};

/* -------------------------------------------------------------- seed history */

let seq = 3090;
const nextId = () => `WN-${++seq}`;

const seedCampaign = (
  id: string,
  itemId: string,
  audience: Audience,
  audienceSize: number,
  hoursAgo: number,
  note: string,
): Campaign => ({
  id,
  itemId,
  audience,
  audienceSize,
  note,
  sentOn: isoAgo(hoursAgo),
  hoursAgo,
  ...funnel(audienceSize, 0.29, 0.12),
});

const SEED: Campaign[] = [
  seedCampaign("WN-3090", seedProducts[3]!.id, "Bought Lehenga before", 264, 6, "Booking closes this Sunday."),
  seedCampaign("WN-3089", seedProducts[8]!.id, "All Customers", ALL_CUSTOMERS.size, 20, "1-day express slot open."),
  seedCampaign("WN-3088", seedProducts[15]!.id, "All Customers", ALL_CUSTOMERS.size, 41, "Aari work included, no extra."),
  seedCampaign("WN-3087", seedProducts[21]!.id, "Bought any Frocks", 512, 73, "Reserved for repeat customers."),
  seedCampaign("WN-3086", seedProducts[33]!.id, "Bought any Blouses", 604, 120, "Reception season favourite."),
];

/* -------------------------------------------------------------------- store */

let records: Campaign[] = SEED;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => records;

export function useCampaigns() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function sendCampaign(input: {
  itemId: string;
  audience: Audience;
  audienceSize: number;
  note: string;
}): Campaign {
  const rec: Campaign = {
    id: nextId(),
    itemId: input.itemId,
    audience: input.audience,
    audienceSize: input.audienceSize,
    note: input.note,
    sentOn: new Date().toISOString(),
    hoursAgo: 0,
    ...funnel(input.audienceSize, 0.29, 0.12),
  };
  records = [rec, ...records];
  emit();

  import("./api/marketing").then(({ sendBroadcast }) => {
    sendBroadcast({
      name: `Campaign ${rec.id}`,
      message: input.note,
      audienceKind: "segment",
      audienceLabel: input.audience,
      audienceSize: input.audienceSize,
    }).catch(() => {});
  });

  return rec;
}

export function sendCustomCampaign(input: {
  name: string;
  message: string;
  image: string;
  audience: Audience;
  audienceSize: number;
  note: string;
}): Campaign {
  const rec: Campaign = {
    id: nextId(),
    itemId: "",
    custom: { name: input.name, image: input.image, message: input.message },
    audience: input.audience,
    audienceSize: input.audienceSize,
    note: input.note,
    sentOn: new Date().toISOString(),
    hoursAgo: 0,
    ...funnel(input.audienceSize, 0.24, 0.09),
  };
  records = [rec, ...records];
  emit();

  import("./api/marketing").then(({ sendBroadcast }) => {
    sendBroadcast({
      name: input.name,
      imageUrl: input.image,
      message: input.message,
      audienceKind: "custom",
      audienceLabel: input.audience,
      audienceSize: input.audienceSize,
    }).catch(() => {});
  });

  return rec;
}

export const campaignById = (list: Campaign[], id: string) => list.find((c) => c.id === id);

/* ------------------------------------------------------------------ selectors */

export const recentlyNotified = (list: Campaign[]) => list.filter((c) => c.hoursAgo <= 48);

export const activeDistricts = (c: Campaign) =>
  c.districts.filter((d) => d.visitors > 0).sort((a, b) => b.visitors - a.visitors);

export const clickRate = (list: Campaign[]) => {
  const sent = list.reduce((s, c) => s + c.sent, 0);
  const clicked = list.reduce((s, c) => s + c.clicked, 0);
  return sent ? Math.round((clicked / sent) * 100) : 0;
};

export const gstNote = `Prices include ${storeSettings.gstPercent}% GST`;
