import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Navbar } from "@/components/boutique/Navbar";
import { Hero } from "@/components/boutique/Hero";
import { EntityAnswer } from "@/components/boutique/EntityAnswer";
import { Collections } from "@/components/boutique/Collections";
import { Customisation } from "@/components/boutique/Customisation";
import { ReelsCarousel } from "@/components/boutique/ReelsCarousel";
import { FeaturedProducts } from "@/components/boutique/FeaturedProducts";
import { About } from "@/components/boutique/About";
import { FAQ } from "@/components/boutique/FAQ";
import { Reviews } from "@/components/boutique/Reviews";
import { Footer } from "@/components/boutique/Footer";
import { storeInfo, waLink } from "@/data/boutique";
import { categoryProductJsonLd, faqJsonLd, serviceJsonLd } from "@/data/aeo";
import { abs, SITE_URL, seoDescription, socialMeta } from "@/lib/seo";

const title = "Custom Women's Clothing in Coimbatore | Pattu Kutty";
const description = seoDescription(
  "Pattu Kutty is a Coimbatore women's clothing brand for custom silk sarees, bridal wear and any garment stitched in as fast as 1 hour, delivered across India.",
);

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pattu Kutty",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/category/{search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      ...socialMeta({ title, description, path: "/" }),
      {
        name: "keywords",
        content:
          "custom silk saree Coimbatore, women's clothing customization Coimbatore, 1 hour stitching Coimbatore, bridal wear Coimbatore, kalyana pattu saree, custom blouse stitching, ladies dress designer Coimbatore, custom women's clothing delivered across India",
      },
      { name: "geo.region", content: "IN-TN" },
      { name: "geo.placename", content: "Coimbatore" },
    ],
    links: [{ rel: "canonical", href: abs("/") }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(websiteJsonLd) },
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd) },
      { type: "application/ld+json", children: JSON.stringify(serviceJsonLd) },
      { type: "application/ld+json", children: JSON.stringify(categoryProductJsonLd) },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <EntityAnswer />
        <Collections />
        <Customisation />
        <ReelsCarousel />
        <FeaturedProducts />
        <About />
        <Reviews />
        <FAQ />
      </main>
      <Footer />

      {/* Floating WhatsApp CTA — mobile first */}
      <a
        href={waLink(`Hi ${storeInfo.name}, I'd like to enquire about stitching.`)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-4 bottom-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105 sm:hidden"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
