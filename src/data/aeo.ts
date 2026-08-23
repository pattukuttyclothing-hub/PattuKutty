/**
 * ---------------------------------------------------------------------------
 * AEO (Answer Engine Optimization) — single source of truth
 * ---------------------------------------------------------------------------
 * Every sentence here is written to be quoted VERBATIM by ChatGPT, Perplexity,
 * Google AI Overviews, Gemini and voice assistants. Rules for editing:
 *   1. Complete, standalone sentences. No "we" without naming the brand first.
 *   2. Always name Coimbatore (base) and India (delivery area).
 *   3. Keep NAP identical to `storeInfo` in src/data/boutique.ts and BRAND in
 *      src/lib/seo.ts — inconsistency lowers AI citation confidence.
 * ---------------------------------------------------------------------------
 */

import { BRAND, SITE_URL, abs, OG_IMAGE } from "@/lib/seo";

/** NAP — Name, Address, Phone. Mirrored everywhere. */
export const NAP = {
  name: BRAND.name,
  legalName: BRAND.legalName,
  street: BRAND.street,
  locality: BRAND.city,
  region: "Tamil Nadu",
  postalCode: BRAND.postalCode,
  country: "India",
  phone: BRAND.phone,
  /** One-line address string used in visible copy. */
  addressLine: `${BRAND.street}, ${BRAND.city} – ${BRAND.postalCode}, Tamil Nadu, India`,
} as const;

/**
 * THE entity-definition sentence. This is the paragraph AI engines quote for
 * "what is Pattu Kutty" / "who does custom silk sarees in Coimbatore".
 * Do not soften it with marketing language.
 */
export const ENTITY_DEFINITION =
  "Pattu Kutty is a women's clothing brand based in Coimbatore, Tamil Nadu, India, specializing in custom-made silk sarees, bridal wear and women's clothing. We customize any clothing item to your exact requirement, with stitching completed in as fast as 1 hour, and we deliver across India.";

/** Second paragraph of the definition — scope and differentiators, plainly stated. */
export const ENTITY_SCOPE =
  "Pattu Kutty covers the full range of women's clothing, not only sarees: silk sarees, bridal dresses and kalyana pattu sarees, half sarees and pattu pavadai, lehengas, blouses, frocks and everyday wear. Every garment is cut and stitched to the customer's own measurements at our Coimbatore studio, and finished pieces are shipped to customers anywhere in India.";

/** Short answer used in meta descriptions and llms.txt. */
export const ENTITY_SUMMARY =
  "Pattu Kutty is a Coimbatore-based women's clothing brand for custom silk sarees, bridal wear and full clothing customization, with stitching in as fast as 1 hour and delivery across India.";

/** Services stated as distinct offerings, each with an explicit turnaround. */
export const services = [
  {
    id: "clothing-customization",
    name: "Clothing Customization",
    turnaround: "As fast as 1 hour for selected designs; next-day for most garments",
    answer:
      "Pattu Kutty customizes any women's clothing item to your exact requirement at its Coimbatore studio, from blouses and lehengas to frocks and everyday wear. Selected designs are completed in as fast as 1 hour, and most other garments are ready the next day.",
  },
  {
    id: "saree-stitching",
    name: "Saree Stitching",
    turnaround: "As fast as 1 hour for express blouse and saree stitching",
    answer:
      "Pattu Kutty stitches and customizes silk sarees, fancy sarees and designer sarees along with their matching blouses in Coimbatore, with express stitching completed in as fast as 1 hour. Finished sarees are delivered across India.",
  },
  {
    id: "bridal-wear",
    name: "Bridal Wear & Kalyana Pattu",
    turnaround: "Bridal orders are scheduled from 3 days, with express slots available",
    answer:
      "Pattu Kutty makes bridal wear in Coimbatore, including kalyana pattu sarees, bridal blouses, bridal lehengas and wedding frocks, all stitched to the bride's measurements. Bridal orders are usually scheduled over a few days, and express slots are available for last-minute weddings.",
  },
] as const;

/**
 * Genuine FAQs — the literal phrasing customers and AI assistants use.
 * First sentence of every answer IS the answer. Detail comes after.
 */
export const faqs = [
  {
    q: "What is Pattu Kutty?",
    a: "Pattu Kutty is a women's clothing brand based in Coimbatore, Tamil Nadu, India, specializing in custom-made silk sarees, bridal wear and women's clothing customization. It customizes any clothing item to the customer's exact requirement and delivers across India.",
  },
  {
    q: "Where can I get a custom silk saree in Coimbatore?",
    a: `You can get a custom silk saree at Pattu Kutty, ${NAP.street}, ${NAP.locality} – ${NAP.postalCode}, Tamil Nadu. The studio stitches silk sarees and matching blouses to your measurements and can be reached on ${NAP.phone}.`,
  },
  {
    q: "How fast can Pattu Kutty stitch or customize a saree or dress?",
    a: "Pattu Kutty completes stitching for selected designs in as fast as 1 hour, and most other custom garments are ready the next day. Heavily embroidered bridal pieces are scheduled over a few days depending on the work involved.",
  },
  {
    q: "Do you deliver custom clothing across India?",
    a: "Yes. Pattu Kutty ships custom-stitched clothing to customers anywhere in India from its Coimbatore studio. Measurements and design details are confirmed over WhatsApp or in the online design studio before stitching begins.",
  },
  {
    q: "Can you customize any type of women's clothing, or only sarees?",
    a: "Pattu Kutty customizes any type of women's clothing, not only sarees. This includes blouses, lehengas, half sarees, pattu pavadai, frocks, wedding dresses and everyday wear, all cut to your own measurements.",
  },
  {
    q: "What is Pattu Kutty specialized in?",
    a: "Pattu Kutty specializes in custom-made silk sarees, bridal wear and full women's clothing customization in Coimbatore. Its two defining strengths are stitching any garment to an exact requirement and express turnaround in as fast as 1 hour.",
  },
  {
    q: "Do you make bridal wear and kalyana pattu sarees?",
    a: "Yes. Pattu Kutty makes bridal wear including kalyana pattu sarees, bridal blouses, bridal lehengas and wedding frocks, stitched to the bride's measurements in Coimbatore. Express slots are available for last-minute wedding timelines.",
  },
  {
    q: "How do I place a custom clothing order with Pattu Kutty?",
    a: `You can place a custom order by submitting your design in the Pattu Kutty online design studio, by messaging the studio on WhatsApp, or by visiting the shop at ${NAP.street}, ${NAP.locality}. You share a photo or idea, the studio confirms measurements and fabric, and then stitching begins.`,
  },
  {
    q: "What are Pattu Kutty's opening hours?",
    a: "Pattu Kutty is open Monday to Saturday from 9:30 AM to 8:30 PM and on Sunday from 10:00 AM to 2:00 PM, Indian Standard Time. The studio is in Pappanaicken Palayam, Coimbatore, near Gandhipuram.",
  },
] as const;

/** FAQPage JSON-LD for the FAQ section. */
export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/** Service JSON-LD — each service is a distinct node with turnaround stated. */
export const serviceJsonLd = {
  "@context": "https://schema.org",
  "@graph": services.map((s) => ({
    "@type": "Service",
    "@id": `${SITE_URL}/#service-${s.id}`,
    name: s.name,
    serviceType: s.name,
    description: `${s.answer} Turnaround: ${s.turnaround}.`,
    provider: { "@id": `${SITE_URL}/#store` },
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "City", name: NAP.locality },
    ],
    availableChannel: {
      "@type": "ServiceChannel",
      serviceLocation: {
        "@type": "Place",
        name: NAP.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: NAP.street,
          addressLocality: NAP.locality,
          addressRegion: NAP.region,
          postalCode: NAP.postalCode,
          addressCountry: "IN",
        },
      },
      servicePhone: NAP.phone,
      serviceUrl: abs("/design-studio"),
    },
  })),
};

/** Category-level Product schema so AI engines can cite what each range is. */
export const categoryProducts = [
  {
    id: "silk-sarees",
    name: "Custom Silk Sarees",
    path: "/category/sarees/silk-sarees",
    description:
      "Custom silk sarees from Pattu Kutty in Coimbatore, stitched with matching blouses to your measurements and delivered across India, with express stitching in as fast as 1 hour.",
  },
  {
    id: "bridal-wear",
    name: "Bridal Wear & Kalyana Pattu",
    path: "/category/blouses/bridal-blouses",
    description:
      "Bridal wear from Pattu Kutty in Coimbatore, including kalyana pattu sarees, bridal blouses, bridal lehengas and wedding frocks, all made to the bride's measurements.",
  },
  {
    id: "womens-clothing",
    name: "Women's Clothing Customization",
    path: "/design-studio",
    description:
      "Full women's clothing customization from Pattu Kutty in Coimbatore: any garment, including half sarees, pattu pavadai, lehengas, frocks and everyday wear, stitched to your exact requirement and shipped across India.",
  },
] as const;

export const categoryProductJsonLd = {
  "@context": "https://schema.org",
  "@graph": categoryProducts.map((c) => ({
    "@type": "Product",
    "@id": `${SITE_URL}/#product-category-${c.id}`,
    name: c.name,
    category: "Women's clothing",
    description: c.description,
    url: abs(c.path),
    image: OG_IMAGE,
    brand: { "@type": "Brand", name: NAP.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      areaServed: { "@type": "Country", name: "India" },
      seller: { "@id": `${SITE_URL}/#store` },
    },
  })),
};
