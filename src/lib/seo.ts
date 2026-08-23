/**
 * Central SEO constants for Pattu Kutty.
 * Every canonical, og:url and JSON-LD URL is built from SITE_URL so the
 * domain lives in exactly one place.
 */

export const SITE_URL = "https://pattukuttyclothing.com";

/** Branded 1200x630 share card served from /public. */
export const OG_IMAGE = `${SITE_URL}/og-cover.jpg`;

export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Absolute-ise a remote/relative image for og:image (must be absolute). */
export const absImage = (url?: string | null) =>
  !url ? OG_IMAGE : url.startsWith("http") ? url : abs(url);

export const BRAND = {
  name: "Pattu Kutty",
  legalName: "Pattu Kutty Clothing",
  city: "Coimbatore",
  phone: "+91 93455 20768",
  street: "463, Bharathiyar Road, Pappanaicken Palayam",
  postalCode: "641037",
  instagram: "https://instagram.com/pattu.kutty",
};

/** Recommended limits so search results and share cards don't clip. */
export const TITLE_MAX = 60;
export const DESC_MAX = 155;

/** Trim on a word boundary, never mid-word, never with a dangling separator. */
const clamp = (text: string, max: number) => {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max).replace(/[\s\u2014\-–,;:|]+\S*$/, "");
  return (cut || t.slice(0, max)).replace(/[\s\u2014\-–,;:|]+$/, "");
};

/**
 * Build a title that fits TITLE_MAX: drops the optional middle qualifier and
 * then the brand suffix before ever truncating the page name.
 */
export const seoTitle = (name: string, qualifier?: string, brand = BRAND.name) => {
  const candidates = [
    qualifier ? `${name} — ${qualifier} | ${brand}` : `${name} | ${brand}`,
    `${name} | ${brand}`,
    name,
  ];
  return candidates.find((c) => c.length <= TITLE_MAX) ?? clamp(candidates[2], TITLE_MAX);
};

export const seoDescription = (text: string) => clamp(text, DESC_MAX);

/**
 * Social/OG meta block shared by public pages.
 * `image` accepts a product/category image; falls back to the brand card.
 * Width/height are only declared for the brand card, whose dimensions we know
 * to be exactly 1200x630 — asserting them for arbitrary catalogue photos would
 * make platforms render the wrong aspect ratio.
 */
export const socialMeta = ({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: string;
}) => {
  const finalTitle = clamp(title, TITLE_MAX);
  const finalDescription = seoDescription(description);
  const finalImage = absImage(image);
  const isBrandCard = finalImage === OG_IMAGE;
  return [
    { title: finalTitle },
    { name: "description", content: finalDescription },
    { property: "og:site_name", content: "Pattu Kutty" },
    { property: "og:locale", content: "en_IN" },
    { property: "og:title", content: finalTitle },
    { property: "og:description", content: finalDescription },
    { property: "og:type", content: type },
    { property: "og:url", content: abs(path) },
    { property: "og:image", content: finalImage },
    { property: "og:image:alt", content: finalTitle },
    ...(isBrandCard
      ? [
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
        ]
      : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: finalTitle },
    { name: "twitter:description", content: finalDescription },
    { name: "twitter:image", content: finalImage },
    { name: "twitter:image:alt", content: finalTitle },
  ];
};


export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: abs(it.path),
  })),
});
