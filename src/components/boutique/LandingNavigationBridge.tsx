import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home, Sparkles, MessageCircle, Scissors, ArrowRight, Store, Clock, Heart } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { waLink } from "@/data/boutique";

interface BreadcrumbProps {
  currentPage: string;
}

/**
 * Luxury Hero Breadcrumb Bridge
 * Positioned at the top of the hero content so search visitors immediately know
 * they are in a specialized department of the Pattu Kutty Boutique.
 */
export function HeroBreadcrumb({ currentPage }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs">
      <Link
        to="/"
        className="group inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-maroon-deep/60 px-3.5 py-1.5 font-medium text-accent backdrop-blur-md transition-all duration-300 hover:bg-accent hover:text-maroon-deep active:scale-95"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
        <span className="tracking-wide">Explore Full Boutique</span>
      </Link>
      <span className="text-primary-foreground/35 select-none font-light">/</span>
      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.68rem] tracking-wider text-primary-foreground/90 uppercase font-light">
        {currentPage}
      </span>
    </nav>
  );
}

interface MobileDockProps {
  currentRoute: "bridal" | "sarees" | "express";
  whatsappMessage: string;
  ctaText?: string;
}

/**
 * Mobile Sticky Conversion & Discovery Dock
 * Floats at the bottom of the mobile screen so visitors never feel stranded
 * at an "endpoint". Gives instant thumb-friendly 1-tap return to the full store
 * or direct WhatsApp consultation.
 */
export function MobileFloatingDock({
  whatsappMessage,
  ctaText = "Consult Now",
}: MobileDockProps) {
  return (
    <aside
      aria-label="Quick Actions"
      className="fixed bottom-3 inset-x-3 z-40 sm:hidden animate-fade-in"
    >
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-maroon-deep/95 border border-accent/35 shadow-2xl backdrop-blur-xl text-primary-foreground">
        <Link
          to="/"
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[0.72rem] font-semibold tracking-wider uppercase text-primary-foreground transition-all active:scale-95"
        >
          <Home className="h-4 w-4 text-accent" />
          <span>Full Store</span>
        </Link>
        <a
          href={waLink(whatsappMessage)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-maroon-deep text-[0.72rem] font-semibold tracking-wider uppercase text-primary-foreground shadow-lift transition-all active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{ctaText}</span>
        </a>
      </div>
    </aside>
  );
}

interface DiscoveryProps {
  currentRoute: "bridal" | "sarees" | "express";
}

/**
 * Full Boutique Discovery Section
 * Placed before the footer on landing pages so SEO visitors who reach the end
 * of the page can seamlessly discover other departments rather than bouncing back to Google.
 */
export function BoutiqueDiscoverySection({ currentRoute }: DiscoveryProps) {
  const departments = [
    {
      id: "home",
      title: "Main Boutique Catalog",
      tagline: "250+ READYMADE & CUSTOM STYLES",
      desc: "Explore designer lehengas, silk sarees, and little ones' pattu pavadai in our complete storefront.",
      image: hero1,
      link: "/",
      cta: "Enter Main Boutique",
      icon: Store,
      badge: "Full Collection",
    },
    {
      id: "sarees",
      title: "Heirloom Silk Sarees",
      tagline: "PURE MULBERRY SILKS & PRE-PLEATING",
      desc: "Traditional kalyana pattu drapes with contrast gold zari borders and matching stitched blouses.",
      image: hero2,
      link: "/custom-sarees",
      cta: "Explore Sarees",
      icon: Sparkles,
      badge: "Saree Atelier",
    },
    {
      id: "express",
      title: "60-Minute Express Atelier",
      tagline: "COIMBATORE'S FASTEST LUXURY TAILOR",
      desc: "Walk in with fabric or choose from our studio. Precision cut, stitched, and pressed in 1 hour.",
      image: hero3,
      link: "/express-stitching",
      cta: "View Express Slots",
      icon: Clock,
      badge: "1-Hour Service",
    },
    {
      id: "bridal",
      title: "Bridal Couture & Blouses",
      tagline: "HAND-EMBROIDERED ZARI & AARI WORK",
      desc: "Sculpted wedding lehengas and maggam designer blouses tailored to exact bridal measurements.",
      image: hero1,
      link: "/bridal-wear",
      cta: "Explore Bridal",
      icon: Heart,
      badge: "Bridal Suite",
    },
  ];

  // Filter out the current route from the secondary cards, keep Home always first
  const displayDepts = departments
    .filter((d) => d.id !== currentRoute)
    .slice(0, 3);

  return (
    <section className="relative py-20 px-4 sm:px-6 bg-gradient-to-b from-background via-secondary/30 to-background border-t border-border/60">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            <Sparkles className="h-3.5 w-3.5" /> BEYOND THIS COLLECTION
          </span>
          <h2 className="font-display mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-foreground uppercase">
            EXPLORE THE COMPLETE PATTU KUTTY ATELIER
          </h2>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground font-light leading-relaxed">
            Pattu Kutty is Coimbatore's premier women's luxury custom clothing house. Whether you need an entire bridal trousseau, a ready-to-wear festival saree, or same-day alteration, discover our full universe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayDepts.map((dept) => {
            const Icon = dept.icon;
            const isHome = dept.id === "home";
            return (
              <div
                key={dept.id}
                className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-1.5 ${
                  isHome
                    ? "border-accent/60 bg-gradient-to-b from-maroon-deep to-[#3a080d] text-primary-foreground shadow-lift"
                    : "border-border/60 bg-card hover:border-accent/40 hover:shadow-soft"
                }`}
              >
                {/* Visual Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={dept.image}
                    alt={dept.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    className={`absolute inset-0 ${
                      isHome
                        ? "bg-gradient-to-t from-maroon-deep via-maroon-deep/60 to-transparent"
                        : "bg-gradient-to-t from-card via-card/40 to-transparent"
                    }`}
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.62rem] font-semibold tracking-wider uppercase ${
                        isHome
                          ? "bg-accent text-maroon-deep"
                          : "bg-background/80 text-foreground backdrop-blur-md border border-border/50"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {dept.badge}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p
                    className={`text-[0.65rem] font-medium tracking-[0.2em] uppercase ${
                      isHome ? "text-accent" : "text-accent font-semibold"
                    }`}
                  >
                    {dept.tagline}
                  </p>
                  <h3
                    className={`font-display mt-2 text-xl font-semibold uppercase ${
                      isHome ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {dept.title}
                  </h3>
                  <p
                    className={`mt-2 text-xs leading-relaxed font-light ${
                      isHome ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {dept.desc}
                  </p>

                  <div className="mt-6">
                    <Link
                      to={dept.link}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                        isHome
                          ? "bg-accent text-maroon-deep hover:bg-white"
                          : "border border-border/80 text-foreground hover:border-primary hover:text-primary"
                      }`}
                    >
                      <span>{dept.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Home Gateway Banner */}
        <div className="mt-12 rounded-3xl border border-accent/30 bg-maroon-deep/90 p-8 text-center text-primary-foreground shadow-lift relative overflow-hidden backdrop-blur-md">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="font-display text-2xl sm:text-3xl font-semibold uppercase">
              Want To Browse The Entire Collection?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-primary-foreground/80 font-light">
              Visit our primary boutique storefront to explore customer reviews, client reels, ready designs, and direct store map in Coimbatore.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-xs font-semibold tracking-widest text-maroon-deep uppercase shadow-lift transition-all hover:scale-105 active:scale-95"
              >
                <Store className="h-4 w-4" />
                <span>Go to Pattu Kutty Home</span>
              </Link>
              <Link
                to="/design-studio"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 text-xs font-semibold tracking-widest text-primary-foreground uppercase backdrop-blur-md transition-all hover:border-accent hover:text-accent"
              >
                <Scissors className="h-4 w-4" />
                <span>Online Design Studio</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
