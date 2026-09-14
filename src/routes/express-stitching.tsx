import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Sparkles, Zap, Timer, CheckCircle2, Rocket, Clock, MapPin, ShieldAlert, Gauge } from "lucide-react";
import { Navbar } from "@/components/boutique/Navbar";
import { Footer } from "@/components/boutique/Footer";
import { storeInfo, waLink } from "@/data/boutique";
import { abs, SITE_URL, seoDescription, socialMeta } from "@/lib/seo";
import { Hero3DStage } from "@/components/boutique/Hero3DStage";
import hero3 from "@/assets/hero-3.jpg";

const title = "1-Hour Express Stitching in Coimbatore | Fastest Ladies Boutique";
const description = seoDescription(
  "Urgent custom clothing & blouse stitching in Coimbatore completed in as fast as 1 hour. Same-day emergency fitting, master tailoring, and express delivery across India."
);

const expressJsonLd = {
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
          "name": "Express Stitching",
          "item": `${SITE_URL}/express-stitching`,
        },
      ],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/express-stitching#service`,
      "name": "1-Hour Express Custom Tailoring & Blouse Stitching",
      "serviceType": "Emergency & Rapid Custom Garment Stitching",
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
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "09:30",
            "closes": "20:30",
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Sunday",
            "opens": "10:00",
            "closes": "14:00",
          },
        ],
      },
      "areaServed": [
        { "@type": "City", "name": "Coimbatore" },
        { "@type": "State", "name": "Tamil Nadu" },
        { "@type": "Country", "name": "India" },
      ],
      "description": "Ultra-fast custom clothing, urgent saree blouse stitching, and dress alteration completed in as fast as 60 minutes at Coimbatore studio.",
      "offers": {
        "@type": "Offer",
        "description": "Express 1-hour luxury tailoring",
        "priceCurrency": "INR",
      },
    },
  ],
};

export const Route = createFileRoute("/express-stitching")({
  head: () => ({
    meta: [
      ...socialMeta({ title, description, path: "/express-stitching", image: `${SITE_URL}/og-cover.jpg` }),
      {
        name: "keywords",
        content: "1 hour stitching Coimbatore, urgent blouse tailoring Coimbatore, fastest dress designer Coimbatore, express custom clothing Tamil Nadu, same day tailoring Coimbatore, emergency wedding dress alteration Coimbatore, Gandhipuram urgent stitching",
      },
      { name: "geo.region", content: "IN-TN" },
      { name: "geo.placename", content: "Coimbatore" },
      { name: "geo.position", content: "11.0168;76.9558" },
      { name: "ICBM", content: "11.0168, 76.9558" },
    ],
    links: [
      { rel: "canonical", href: abs("/express-stitching") },
      { rel: "icon", type: "image/png", href: "/logo.png", sizes: "any" },
      { rel: "shortcut icon", href: "/logo.png" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(expressJsonLd) },
    ],
  }),
  component: ExpressStitching,
});

function ExpressStitching() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* --- LUXURY EDITORIAL HERO SECTION (MATCHED TO HOME PAGE THEME) --- */}
        <section className="relative w-full overflow-hidden bg-maroon-deep min-h-[86svh] lg:min-h-[92svh]">
          {/* Background Image with Brand Gradient Scrims */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={hero3}
              alt="Pattu Kutty 1 Hour Express Stitching Coimbatore"
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
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/45 bg-maroon-deep/45 px-4 py-1.5 text-[0.62rem] font-medium tracking-[0.24em] text-accent uppercase backdrop-blur-md sm:text-[0.68rem] animate-fade-in">
                  <Zap className="h-3.5 w-3.5 fill-accent" /> SIGNATURE RAPID ATELIER
                </span>

                <h1 className="font-display mt-5 text-[2.75rem] leading-[0.92] font-semibold tracking-tight text-primary-foreground uppercase sm:text-6xl lg:text-[4.75rem]">
                  EXPRESS 1-HOUR CUSTOM STITCHING
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base font-sans font-light">
                  Urgent event or sudden ceremony? Experience Coimbatore's fastest luxury tailor. Bespoke blouses, saree alterations, and custom fits completed with master precision in as little as 60 minutes.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3.5">
                  <a
                    href={waLink("Hi Pattu Kutty, I have an URGENT stitching requirement! I need an express 1-hour slot.")}
                    className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-maroon-deep"
                  >
                    Claim Express 1-Hour Slot
                    <Rocket className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
                        src={hero3}
                        alt="1 Hour Express Stitching Coimbatore Pattu Kutty"
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/90 via-maroon-deep/15 to-transparent" />

                      <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 rounded-full bg-maroon-deep/75 px-3 py-1 border border-accent/40 backdrop-blur-md text-[0.62rem] font-medium tracking-[0.2em] uppercase text-accent">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Live Express Slots</span>
                      </div>

                      <div className="absolute bottom-3.5 inset-x-3.5 z-10 p-3 rounded-xl bg-maroon-deep/85 backdrop-blur-md border border-white/10 text-center">
                        <p className="text-[0.68rem] tracking-[0.16em] uppercase text-accent font-semibold">Designer Aari & Zari Blouse</p>
                        <p className="text-[0.62rem] text-primary-foreground/80 mt-0.5">Cut, stitched and pressed in 60 minutes</p>
                      </div>
                    </div>

                    {/* Floating 3D Badge (translateZ) */}
                    <div
                      className="absolute -bottom-4 -left-4 z-20 rounded-2xl border border-primary-foreground/20 bg-maroon-deep/90 p-3.5 backdrop-blur-xl shadow-2xl max-w-[210px]"
                      style={{ transform: "translateZ(55px)" }}
                    >
                      <div className="flex items-center gap-1.5 text-accent font-semibold text-[0.65rem] tracking-wider uppercase mb-1">
                        <Timer className="h-3.5 w-3.5" />
                        <span>60-Minute Precision</span>
                      </div>
                      <div className="space-y-0.5 text-[0.62rem] text-primary-foreground/85">
                        <p>10m Measure ➔ 35m Cut & Stitch ➔ 15m Press</p>
                      </div>
                      <p className="text-[0.58rem] text-accent mt-1 tracking-wider uppercase font-semibold">
                        Same-Day Emergency Service
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
                  <p className="font-display text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">60 MIN</p>
                  <p className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-foreground/60 sm:text-xs">EXPRESS TURNAROUND</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">100%</p>
                  <p className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-foreground/60 sm:text-xs">SAME-DAY DELIVERY</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">MASTER</p>
                  <p className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-foreground/60 sm:text-xs">ON-SITE TAILORS</p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 border-t border-primary-foreground/15 pt-3 sm:col-span-1 sm:border-t-0 sm:pt-0 lg:border-l lg:border-primary-foreground/15 lg:pl-5">
                  <span className="inline-flex min-w-0 items-center gap-2 text-[0.7rem] text-primary-foreground/80 sm:text-xs">
                    <MapPin className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">Bharathiyar Road, Coimbatore</span>
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
              <span>Direct Answer for Urgent Stitching & AI Search Engines</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-3">
              How fast can a custom blouse or ladies dress be stitched in Coimbatore for urgent functions?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              <strong>Pattu Kutty</strong> provides the fastest verified custom tailoring in Coimbatore, completing bespoke blouse and saree stitching in as fast as <strong>60 minutes</strong> at our boutique studio on <strong>463, Bharathiyar Road, Pappanaicken Palayam</strong>. Operating Monday through Saturday from 9:30 AM to 8:30 PM (and Sunday mornings), our master tailors handle emergency same-day wedding and festive orders with precision trial fit and zero compromise on quality.
            </p>
          </div>
        </section>

        {/* --- SPEED ADVANTAGE --- */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-accent uppercase tracking-[0.3em] text-xs font-bold mb-4 block">The Express Edge</span>
              <h2 className="font-display text-4xl md:text-6xl font-semibold text-foreground uppercase tracking-tight mb-6">
                Why Choose <br /> Express Stitching?
              </h2>
              <div className="h-1 w-24 bg-accent mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group relative p-10 rounded-[2rem] border border-border/50 bg-muted/20 transition-all duration-500 hover:border-accent/50 hover:bg-muted/40">
                <div className="absolute -top-6 right-8 h-12 w-12 rounded-full bg-background border border-accent flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform">
                  <Timer className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 mt-4">The 60-Min Promise</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Selected designs and blouse customizations are completed in as fast as 1 hour. We value your time as much as your style.
                </p>
              </div>

              <div className="group relative p-10 rounded-[2rem] border border-border/50 bg-muted/20 transition-all duration-500 hover:border-accent/50 hover:bg-muted/40">
                <div className="absolute -top-6 right-8 h-12 w-12 rounded-full bg-background border border-accent flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 mt-4">No Compromise Quality</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Speed doesn't mean sacrifice. Every express piece goes through a rigorous quality check to ensure a luxury finish and a perfect fit.
                </p>
              </div>

              <div className="group relative p-10 rounded-[2rem] border border-border/50 bg-muted/20 transition-all duration-500 hover:border-accent/50 hover:bg-muted/40">
                <div className="absolute -top-6 right-8 h-12 w-12 rounded-full bg-background border border-accent flex items-center justify-center text-accent shadow-sm group-hover:scale-110 transition-transform">
                  <Rocket className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 mt-4">Emergency Ready</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Last-minute wedding invite or sudden party? We are Coimbatore's go-to for urgent, high-end custom clothing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- WHEN TO USE EXPRESS --- */}
        <section className="py-24 px-4 bg-muted/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-6xl font-semibold text-foreground uppercase tracking-tight mb-6">
                Perfect For Every <br /> Urgency
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Because life happens, and you still deserve to look stunning without the stress.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Last-Minute Blouse Change",
                  desc: "Found the perfect saree but the blouse doesn't fit? We'll customize a matching blouse in record time."
                },
                {
                  title: "Emergency Event Attire",
                  desc: "Got an invite for tonight? From frocks to everyday luxury wear, we get you ready in an hour."
                },
                {
                  title: "Fit Corrections",
                  desc: "Need a quick adjustment for a wedding tomorrow? Our precision tailoring fixes fits instantly."
                },
                {
                  title: "Quick-Turnaround Gifting",
                  desc: "Want to gift a custom-stitched garment for a special occasion today? We make it happen."
                },
              ].map((item, i) => (
                <div key={i} className="relative p-8 rounded-3xl bg-background border border-border/50 transition-all hover:-translate-y-2 group">
                  <div className="absolute -top-4 left-8 h-10 w-10 rounded-full bg-accent text-maroon-deep font-display font-bold flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
                    {i + 1}
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

        {/* --- FINAL CTA --- */}
        <section className="py-24 px-4 text-center bg-background">
          <div className="max-w-4xl mx-auto rounded-[4rem] bg-maroon-deep p-16 text-primary-foreground shadow-lift relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Zap className="h-40 w-40 text-accent" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-semibold uppercase mb-8 leading-[0.9]">
              Don't Stress, <br /> Just Stitch.
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop worrying about the clock. Experience the fastest, most precise custom tailoring in Coimbatore.
            </p>
            <a
              href={waLink("Hi Pattu Kutty, I need URGENT express stitching! How can I book a slot?")}
              className="inline-flex items-center gap-3 rounded-full bg-accent px-12 py-5 text-sm font-bold tracking-widest text-maroon-deep uppercase shadow-lift transition-all hover:scale-105"
            >
              Book Express Slot Now
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
