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

/**
 * Social/OG meta block shared by public pages.
 * `image` accepts a product/category image; falls back to the brand card.
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
}) => [
  { title },
  { name: "description", content: description },
  { property: "og:site_name", content: "Pattu Kutty" },
  { property: "og:locale", content: "en_IN" },
  { property: "og:title", content: title },
  { property: "og:description", content: description },
  { property: "og:type", content: type },
  { property: "og:url", content: abs(path) },
  { property: "og:image", content: absImage(image) },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: title },
  { name: "twitter:description", content: description },
  { name: "twitter:image", content: absImage(image) },
];

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
