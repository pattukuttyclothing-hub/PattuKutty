import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useHeroBanners } from "@/lib/useStorefront";

// Authentic boutique stats data
const statsData = [
  { value: "250+", label: "PREMIUM STYLES" },
  { value: "10K+", label: "HAPPY CUSTOMERS" },
  { value: "500+", label: "BRIDAL OUTFITS" },
  { value: "99%", label: "SATISFACTION RATE" },
];

/** Editorial copy that rotates with the banner artwork. */
const slideCopy = [
  {
    eyebrow: "READYMADE & CUSTOM",
    title: "Bridal Lehenga",
    subtitle: "Hand-worked zari, sculpted fits and finishing you can feel.",
    cta: "Book a fitting",
    ctaLink: "#customise",
  },
  {
    eyebrow: "CEREMONY EDIT",
    title: "Half Saree",
    subtitle: "Soft silks, gold zari borders and drape work styled for your ceremony.",
    cta: "Shop Now",
    ctaLink: "#collections",
  },
  {
    eyebrow: "SIGNATURE AARI WORK",
    title: "Designer Blouse",
    subtitle: "Maggam, aari and stone work stitched to your exact measurements.",
    cta: "Stitch Now",
    ctaLink: "#customise",
  },
  {
    eyebrow: "LITTLE ONES",
    title: "Pattu Pavadai",
    subtitle: "Traditional silks for the smallest guest of honour.",
    cta: "Shop Now",
    ctaLink: "#collections",
  },
];

/** Smooth count-up counter component triggered on scroll */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const [displayValue, setDisplayValue] = useState("0");
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const numericMatch = value.match(/\d+/);
  const targetNumber = numericMatch ? parseInt(numericMatch[0], 10) : null;
  const suffix = value.replace(/\d+/, "");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Re-runs every time the stat scrolls back into view.
    const observer = new IntersectionObserver(
      (entries) => setIsVisible(!!entries[0]?.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (targetNumber === null) {
      setDisplayValue(value);
      return;
    }
    if (!isVisible) {
      setDisplayValue(`0${suffix}`);
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    let frame = 0;
    const duration = 1800;

    const step = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutQuint — quick lift, long silky settle with no visible stalling
      const eased = 1 - Math.pow(1 - progress, 5);
      const current = Math.round(eased * targetNumber);
      setDisplayValue(`${current.toLocaleString("en-IN")}${suffix}`);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isVisible, value, targetNumber, suffix]);

  return (
    <div
      ref={containerRef}
      data-revealed={isVisible ? "true" : "false"}
      className="group min-w-0 px-1 text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] data-[revealed=false]:translate-y-2 data-[revealed=false]:opacity-0 data-[revealed=true]:translate-y-0 data-[revealed=true]:opacity-100 sm:text-left"
    >
      <div className="font-display bg-gradient-to-b from-accent to-accent/70 bg-clip-text text-2xl leading-none font-semibold tabular-nums text-transparent drop-shadow-[0_1px_10px_color-mix(in_oklab,var(--accent)_35%,transparent)] sm:text-3xl lg:text-[2rem]">
        {displayValue}
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
        <span className="h-px w-4 bg-accent/50 transition-all duration-500 group-hover:w-6" />
        <span className="text-[0.55rem] font-medium tracking-[0.18em] text-primary-foreground/75 uppercase sm:text-[0.65rem]">
          {label}
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  const rawBanners = useHeroBanners();
  const banners = Array.isArray(rawBanners) ? rawBanners : [];
  const [index, setIndex] = useState(0);
  const count = banners.length;

  const fallback = {
    id: "default",
    image_url:
      "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg",
    cta_label: "SHOP NEW ARRIVALS",
    cta_link: "#collections",
  } as any;

  const slides = count ? banners : [fallback];
  const active = slides[index] ?? slides[0];
  const copy = slideCopy[index % slideCopy.length]!;

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section id="home" className="w-full bg-background">
      <div className="relative w-full overflow-hidden bg-maroon-deep min-h-[86svh] lg:min-h-[92svh]">
        {/* ─── ARTWORK LAYERS ─────────────────────────────────────────── */}
        {slides.map((slide: any, i: number) => (
          <div
            key={slide.id ?? i}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              i === index ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
          >
            <picture className="block h-full w-full">
              <source
                media="(min-width: 1024px)"
                srcSet={slide.desktop_image_url || slide.image_url || slide.image || ""}
              />
              <source
                media="(min-width: 640px)"
                srcSet={
                  slide.tablet_image_url || slide.desktop_image_url || slide.image_url || slide.image || ""
                }
              />
              <img
                src={slide.mobile_image_url || slide.image_url || slide.image || ""}
                alt="Pattu Kutty designer boutique — bridal and ceremony wear"
                width={1920}
                height={1080}
                loading={i === 0 ? "eager" : "lazy"}
                className={`h-full w-full object-cover object-[center_22%] transition-transform duration-[9000ms] ease-out ${
                  i === index ? "scale-105" : "scale-100"
                }`}
              />
            </picture>
          </div>
        ))}

        {/* Brand-tinted scrims: keep type readable, keep the silk warm */}
        <div className="absolute inset-y-0 left-0 z-10 w-full max-w-2xl bg-gradient-to-r from-maroon-deep/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-maroon-deep/88 to-transparent" />
        <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-maroon-deep/30 to-transparent" />

        {/* ─── EDITORIAL CONTENT ──────────────────────────────────────── */}
        <div className="relative z-20 mx-auto flex min-h-[86svh] max-w-7xl flex-col justify-end px-4 pt-28 pb-6 sm:px-6 lg:min-h-[92svh] lg:pb-10">
          <div key={index} className="max-w-2xl">
            <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-accent/45 bg-maroon-deep/45 px-4 py-1.5 text-[0.6rem] font-medium tracking-[0.24em] text-accent uppercase backdrop-blur-md sm:text-[0.68rem]">
              <Sparkles className="h-3.5 w-3.5" /> {copy.eyebrow}
            </span>

            <h1
              className="font-display mt-5 text-[2.75rem] leading-[0.92] font-semibold tracking-tight text-primary-foreground uppercase sm:text-6xl lg:text-[5.25rem]"
              style={{ animation: "hero-rise 0.9s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "80ms" }}
            >
              {copy.title}
            </h1>

            <p
              className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base"
              style={{ animation: "hero-rise 0.9s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "200ms" }}
            >
              {copy.subtitle}
            </p>

            <div
              className="mt-7 flex flex-wrap items-center gap-3"
              style={{ animation: "hero-rise 0.9s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "320ms" }}
            >
              <a
                href={copy.ctaLink || active?.cta_link || "#collections"}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-maroon-deep"
              >
                {copy.cta || active?.cta_label || "Shop New Arrivals"}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#collections"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/45 px-6 py-3.5 text-xs font-semibold tracking-[0.14em] text-primary-foreground uppercase backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                View Collections
              </a>
            </div>
          </div>

          {/* ─── GLASS STAT BAR ───────────────────────────────────────── */}
          <div className="mt-8 rounded-3xl border border-primary-foreground/15 bg-maroon-deep/35 p-4 backdrop-blur-xl sm:p-5 lg:mt-10">
            <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
              {statsData.slice(0, 3).map((st) => (
                <AnimatedStat key={st.label} value={st.value} label={st.label} />
              ))}
              <div className="col-span-2 flex items-center justify-between gap-3 border-t border-primary-foreground/15 pt-3 sm:col-span-1 sm:border-t-0 sm:pt-0 lg:border-l lg:border-primary-foreground/15 lg:pl-5">
                <span className="inline-flex min-w-0 items-center gap-2 text-[0.7rem] text-primary-foreground/80 sm:text-xs">
                  <MapPin className="h-4 w-4 shrink-0 text-accent" />
                  <span className="truncate">Gandhipuram, Coimbatore</span>
                </span>
                {slides.length > 1 ? (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Previous slide"
                      className="grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/30 text-primary-foreground transition-colors hover:border-accent hover:text-accent"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Next slide"
                      className="grid h-9 w-9 place-items-center rounded-full bg-accent text-maroon-deep transition-transform hover:scale-105"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Progress dots */}
          {slides.length > 1 ? (
            <div className="mt-5 flex items-center gap-2">
              {slides.map((s: any, i: number) => (
                <button
                  key={s.id ?? i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === index ? "w-10 bg-accent" : "w-5 bg-primary-foreground/35 hover:bg-primary-foreground/60"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── ASSURANCE STRIP ─────────────────────────────────────────── */}
      <div className="w-full border-b border-border/80 bg-blush">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3.5 text-[0.62rem] font-medium tracking-[0.16em] text-muted-foreground uppercase sm:flex sm:items-center sm:justify-between sm:px-6 sm:text-[0.7rem]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> 1-Hour Express Stitching
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> 100% Perfect Fit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> Custom Designer Boutique
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> Coimbatore Studio
          </span>
        </div>
      </div>
    </section>
  );
}
