import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Navbar } from "@/components/boutique/Navbar";
import { Hero } from "@/components/boutique/Hero";
import { Collections } from "@/components/boutique/Collections";
import { Customisation } from "@/components/boutique/Customisation";
import { ReelsCarousel } from "@/components/boutique/ReelsCarousel";
import { FeaturedProducts } from "@/components/boutique/FeaturedProducts";
import { About } from "@/components/boutique/About";
import { Reviews } from "@/components/boutique/Reviews";
import { Footer } from "@/components/boutique/Footer";
import { storeInfo, waLink } from "@/data/boutique";
import { abs, SITE_URL, socialMeta } from "@/lib/seo";

const title = "Pattu Kutty — Custom Women's Clothing & Boutique in Coimbatore";
const description =
  "Coimbatore women's boutique for custom stitched blouses, bridal lehengas, half sarees and silk sarees. 1-hour express stitching, any design customised, delivered across India.";

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
          "women's boutique Coimbatore, custom stitching Coimbatore, 1 hour blouse stitching, bridal lehenga Coimbatore, silk saree boutique, aari work blouse, ladies dress designer, customised women's clothing India",
      },
      { name: "geo.region", content: "IN-TN" },
      { name: "geo.placename", content: "Coimbatore" },
    ],
    links: [{ rel: "canonical", href: abs("/") }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(websiteJsonLd) },
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
        <Collections />
        <Customisation />
        <ReelsCarousel />
        <FeaturedProducts />
        <About />
        <Reviews />
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
