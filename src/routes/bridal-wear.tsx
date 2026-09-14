import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Sparkles, CheckCircle2, Heart, Clock, Ruler, MapPin, Star, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/boutique/Navbar";
import { Footer } from "@/components/boutique/Footer";
import { storeInfo, waLink } from "@/data/boutique";
import { abs, SITE_URL, seoDescription, socialMeta } from "@/lib/seo";
import { Hero3DStage } from "@/components/boutique/Hero3DStage";
import {
  HeroBreadcrumb,
  MobileFloatingDock,
  BoutiqueDiscoverySection,
} from "@/components/boutique/LandingNavigationBridge";
import hero1 from "@/assets/hero-1.jpg";

const title = "Best Bridal Lehenga & Saree Designer in Coimbatore | Pattu Kutty";
const description = seoDescription(
  "Custom bridal lehengas, kalyana pattu sarees, and handcrafted aari blouses in Coimbatore. Luxury bespoke fit, artisan zari embroidery, and express delivery across India."
);

const bridalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": SITE_URL,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Bridal Wear",
          "item": `${SITE_URL}/bridal-wear`,
        },
      ],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/bridal-wear#service`,
      "name": "Custom Bridal Wear & Kalyana Pattu Design",
      "serviceType": "Bridal Couture & Wedding Tailoring",
      "provider": {
        "@type": ["LocalBusiness", "ClothingStore"],
        "@id": `${SITE_URL}/#store`,
        "name": "Pattu Kutty",
        "image": `${SITE_URL}/logo.png`,
        "telephone": "+91 97917 12622",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "463, Bharathiyar Road, Pappanaicken Palayam",
          "addressLocality": "Coimbatore",
          "addressRegion": "Tamil Nadu",
          "postalCode": "641037",
          "addressCountry": "IN",
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 11.0168,
          "longitude": 76.9558,
        },
      },
      "areaServed": [
        { "@type": "City", "name": "Coimbatore" },
        { "@type": "State", "name": "Tamil Nadu" },
        { "@type": "Country", "name": "India" },
      ],
      "description": "Bespoke bridal lehenga customization, wedding kalyana pattu saree designing, and handcrafted aari maggam blouse tailoring in Coimbatore with express fitting slots.",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "540",
        "bestRating": "5",
        "worstRating": "1",
      },
      "offers": {
        "@type": "Offer",
        "description": "Custom bridal tailoring and consultation",
        "priceCurrency": "INR",
      },
    },
  ],
};

export const Route = createFileRoute("/bridal-wear")({
  head: () => ({
    meta: [
      ...socialMeta({ title, description, path: "/bridal-wear", image: `${SITE_URL}/og-cover.jpg` }),
      {
        name: "keywords",
        content: "bridal lehenga Coimbatore, best bridal wear designer Coimbatore, kalyana pattu saree Coimbatore, custom wedding dress Coimbatore, bridal blouse stitching Coimbatore, aari work blouse Coimbatore, wedding couture Pappanaicken Palayam",
      },
      { name: "geo.region", content: "IN-TN" },
      { name: "geo.placename", content: "Coimbatore" },
      { name: "geo.position", content: "11.0168;76.9558" },
      { name: "ICBM", content: "11.0168, 76.9558" },
    ],
    links: [
      { rel: "canonical", href: abs("/bridal-wear") },
      { rel: "icon", type: "image/png", href: "/logo.png", sizes: "any" },
      { rel: "shortcut icon", href: "/logo.png" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(bridalJsonLd) },
    ],
  }),
  component: BridalWear,
});

function BridalWear() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* --- LUXURY EDITORIAL HERO SECTION (MATCHED TO HOME PAGE THEME) --- */}
        <section className="relative w-full overflow-hidden bg-maroon-deep min-h-[86svh] lg:min-h-[92svh]">
          {/* Background Image with Brand Gradient Scrims */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={hero1}
              alt="Pattu Kutty Luxury Bridal Wear Coimbatore"
              className="h-full w-full object-cover object-[center_25%] opacity-30 scale-105 transition-transform duration-[12000ms] ease-out"
              loading="eager"
            />
            <div className="absolute inset-y-0 left-0 z-10 w-full max-w-3xl bg-gradient-to-r from-maroon-deep/95 via-maroon-deep/85 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-maroon-deep/95 to-transparent" />
            <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-maroon-deep/40 to-transparent" />
          </div>

          {/* Editorial Content & 3D Showcase */}
          <div className="relative z-20 mx-auto flex min-h-[86svh] max-w-7xl flex-col justify-end px-4 pt-28 pb-8 sm:px-6 lg:min-h-[92svh] lg:pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Typography & CTAs */}
              <div className="lg:col-span-7 max-w-2xl">
                <HeroBreadcrumb currentPage="Bridal Couture" />

                <span className="inline-flex items-center gap-2 rounded-full border border-accent/45 bg-maroon-deep/45 px-4 py-1.5 text-[0.62rem] font-medium tracking-[0.24em] text-accent uppercase backdrop-blur-md sm:text-[0.68rem] animate-fade-in">
                  <Sparkles className="h-3.5 w-3.5" /> BRIDAL COUTURE 2026
                </span>

                <h1 className="font-display mt-5 text-[2.75rem] leading-[0.92] font-semibold tracking-tight text-primary-foreground uppercase sm:text-6xl lg:text-[4.75rem]">
                  BRIDAL LEHENGAS & KALYANA PATTU
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base font-sans font-light">
                  Hand-embroidered rani pink bridal lehengas, authentic wedding pattu sarees, and sculpted aari blouses cut and finished to your exact measurements at our Coimbatore studio.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3.5">
                  <a
                    href={waLink("Hi Pattu Kutty, I would like to book a Bridal Consultation for my wedding attire!")}
                    className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-maroon-deep"
                  >
                    Book Bridal Consultation
                    <MessageCircle className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                  <a
                    href="/design-studio"
                    className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/45 px-6 py-3.5 text-xs font-semibold tracking-[0.14em] text-primary-foreground uppercase backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                  >
                    Visit Design Studio
                  </a>
                </div>
              </div>

              {/* Right Column: Refined 3D Stage */}
              <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
                <Hero3DStage className="w-full max-w-[380px] aspect-[4/5]" maxTilt={10}>
                  <div className="relative w-full h-full rounded-[2rem] border border-primary-foreground/20 bg-gradient-to-b from-accent/20 via-white/5 to-transparent p-2.5 backdrop-blur-xl shadow-2xl">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner group">
                      <img
                        src={hero1}
                        alt="Pattu Kutty Luxury Bridal Lehenga"
                        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/90 via-maroon-deep/15 to-transparent" />

                      <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 rounded-full bg-maroon-deep/75 px-3 py-1 border border-accent/40 backdrop-blur-md text-[0.62rem] font-medium tracking-[0.2em] uppercase text-accent">
                        <Sparkles className="h-3 w-3" />
                        <span>Bespoke Bridal Edit</span>
                      </div>

                      <div className="absolute bottom-3.5 inset-x-3.5 z-10 p-3 rounded-xl bg-maroon-deep/85 backdrop-blur-md border border-white/10 text-center">
                        <p className="text-[0.68rem] tracking-[0.16em] uppercase text-accent font-semibold">Rani Pink Zari Lehenga</p>
                        <p className="text-[0.62rem] text-primary-foreground/80 mt-0.5">Sculpted to customer measurements in 3 days</p>
                      </div>
                    </div>

                    {/* Floating 3D Badge (translateZ) */}
                    <div
                      className="absolute -bottom-4 -left-4 z-20 rounded-2xl border border-primary-foreground/20 bg-maroon-deep/90 p-3.5 backdrop-blur-xl shadow-2xl max-w-[210px]"
                      style={{ transform: "translateZ(55px)" }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                        ))}
                      </div>
                      <p className="text-[0.68rem] leading-snug font-medium text-primary-foreground/90">
                        "Zero alteration needed on my wedding reception day!"
                      </p>
                      <p className="text-[0.58rem] text-accent mt-1 tracking-wider uppercase font-semibold">
                        540+ Verified Brides
                      </p>
                    </div>
                  </div>
                </Hero3DStage>
              </div>
            </div>

            {/* Signature Home Page Glass Stat Bar */}
            <div className="mt-10 rounded-3xl border border-primary-foreground/15 bg-maroon-deep/40 p-4 backdrop-blur-xl sm:p-5">
              <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
                <div>
                  <p className="font-display text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">500+</p>
                  <p className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-foreground/60 sm:text-xs">BRIDAL OUTFITS</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">100%</p>
                  <p className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-foreground/60 sm:text-xs">PERFECT TRIAL FIT</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">3 DAYS</p>
                  <p className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-foreground/60 sm:text-xs">EXPRESS BRIDAL TURNAROUND</p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 border-t border-primary-foreground/15 pt-3 sm:col-span-1 sm:border-t-0 sm:pt-0 lg:border-l lg:border-primary-foreground/15 lg:pl-5">
                  <span className="inline-flex min-w-0 items-center gap-2 text-[0.7rem] text-primary-foreground/80 sm:text-xs">
                    <MapPin className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">Pappanaicken Palayam, Coimbatore</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- AEO DIRECT ANSWER ENTITY SECTION --- */}
        <section className="py-12 px-4 bg-muted/40 border-b border-border/40">
          <div className="max-w-5xl mx-auto rounded-3xl bg-card p-6 sm:p-8 border border-border shadow-sm">
            <div className="flex items-center gap-2 text-accent font-semibold text-xs tracking-widest uppercase mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Direct Answer for Brides & AI Search Engines</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-3">
              Where can I get custom bridal lehengas and wedding silk sarees tailored in Coimbatore?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              <strong>Pattu Kutty</strong> is Coimbatore's specialist bridal studio located at <strong>463, Bharathiyar Road, Pappanaicken Palayam</strong>. We provide bespoke wedding lehengas, authentic kalyana pattu sarees, and handcrafted aari maggam blouses customized to each bride's exact measurements. With rapid trial turnaround times ranging from 3 to 7 days (and express emergency wedding slots), our master tailors guarantee a flawless first-fit trial and pan-India shipping.
            </p>
          </div>
        </section>

        {/* --- WHY PATTU KUTTY BRIDAL --- */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-accent uppercase tracking-[0.3em] text-xs font-bold mb-4 block">The Pattu Kutty Standard</span>
              <h2 className="font-display text-4xl md:text-6xl font-semibold text-foreground uppercase tracking-tight mb-6">
                Designed for the <br /> Modern Bride
              </h2>
              <div className="h-1 w-24 bg-accent mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group relative p-10 rounded-[2rem] border border-border/50 bg-muted/20 transition-all duration-500 hover:border-accent/50 hover:bg-muted/40">
                <div className="absolute -top-6 right-8 h-12 w-12 rounded-full bg-background border border-accent flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 mt-4">Express Luxury</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Wedding timelines can be stressful. We specialize in high-speed luxury, providing rapid turnarounds for custom bridal fits without compromising a single stitch.
                </p>
              </div>

              <div className="group relative p-10 rounded-[2rem] border border-border/50 bg-muted/20 transition-all duration-500 hover:border-accent/50 hover:bg-muted/40">
                <div className="absolute -top-6 right-8 h-12 w-12 rounded-full bg-background border border-accent flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform">
                  <Ruler className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 mt-4">Precision Fit</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No more endless alteration sessions. Our master tailors use precision sculpting to ensure your bridal wear fits perfectly from the very first trial.
                </p>
              </div>

              <div className="group relative p-10 rounded-[2rem] border border-border/50 bg-muted/20 transition-all duration-500 hover:border-accent/50 hover:bg-muted/40">
                <div className="absolute -top-6 right-8 h-12 w-12 rounded-full bg-background border border-accent flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 mt-4">Couture Artistry</h3>
                <p className="text-muted-foreground leading-relaxed">
                  From intricate Aari work to sculptural silhouettes, we translate your mood-boards into wearable art, combining traditional heritage with modern luxury.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- THE BRIDAL PROCESS --- */}
        <section className="py-24 px-4 bg-muted/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-6xl font-semibold text-foreground uppercase tracking-tight mb-6">
                The Path to Your <br /> Dream Attire
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">A seamless, high-touch experience from the first sketch to the final walk.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Consultation",
                  desc: "We analyze your vision, style and requirements to curate the perfect design."
                },
                {
                  step: "02",
                  title: "Measurement",
                  desc: "Precision sculpting to ensure a perfect, comfortable fit for your silhouette."
                },
                {
                  step: "03",
                  title: "Craftsmanship",
                  desc: "Our artisans execute the embroidery and cuts with obsessive detail."
                },
                {
                  step: "04",
                  title: "The Reveal",
                  desc: "The final fitting and reveal of your masterpiece, ready for the aisle."
                },
              ].map((item, i) => (
                <div key={i} className="relative p-8 rounded-3xl bg-background border border-border/50 transition-all hover:-translate-y-2 group">
                  <div className="absolute -top-4 left-8 h-10 w-10 rounded-full bg-accent text-maroon-deep font-display font-bold flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FULL BOUTIQUE DISCOVERY CROSS-NAV --- */}
        <BoutiqueDiscoverySection currentRoute="bridal" />

        {/* --- FINAL CTA --- */}
        <section className="py-24 px-4 text-center bg-background">
          <div className="max-w-4xl mx-auto rounded-[4rem] bg-maroon-deep p-16 text-primary-foreground shadow-lift relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Sparkles className="h-40 w-40 text-accent" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-semibold uppercase mb-8 leading-[0.9]">
              Your Glow <br /> Awaits
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Don't leave your wedding look to chance. Experience the intersection of luxury, speed, and precision in Coimbatore.
            </p>
            <a
              href={waLink("Hi Pattu Kutty, I want to book a luxury bridal consultation for my wedding!")}
              className="inline-flex items-center gap-3 rounded-full bg-accent px-12 py-5 text-sm font-bold tracking-widest text-maroon-deep uppercase shadow-lift transition-all hover:scale-105"
            >
              Secure Your Slot Now
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />

      {/* --- MOBILE PERSISTENT EXPLORE & BOOK DOCK --- */}
      <MobileFloatingDock
        currentRoute="bridal"
        whatsappMessage="Hi Pattu Kutty, I would like to book a Bridal Consultation for my wedding attire!"
        ctaText="Consult Bridal"
      />
    </div>
  );
}
