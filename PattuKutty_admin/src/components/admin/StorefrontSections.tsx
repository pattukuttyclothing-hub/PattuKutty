import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Carousel3D } from "@/components/shared/Carousel3D";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import type { AdminProduct, ReelItem } from "@/lib/admin-store";
import { inr } from "@/lib/format";

/* ------------------------------------------------------------- decoration */

export function FloralMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" aria-hidden="true" className={className} fill="none">
      <path d="M0 12h44M76 12h44" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <path
        d="M60 4c4 3 6 5 6 8s-2 5-6 8c-4-3-6-5-6-8s2-5 6-8Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M48 12c2-2 4-2 6 0-2 2-4 2-6 0Zm24 0c-2-2-4-2-6 0 2 2 4 2 6 0Z" fill="currentColor" />
    </svg>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="text-[0.65rem] font-semibold tracking-[0.28em] text-primary uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display mt-2 text-2xl leading-tight font-semibold text-foreground sm:text-3xl">
        {title}
      </h2>
      <FloralMotif className="mx-auto mt-3 h-4 w-24 text-accent" />
      {subtitle ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

/** Framed preview panel with an action slot pinned to the top-right. */
export function PreviewPanel({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-blush px-5 py-3">
        <span className="text-[0.62rem] font-semibold tracking-[0.22em] text-primary uppercase">
          {label}
        </span>
        {action}
      </div>
      <div className="flex-1 overflow-hidden px-4 py-8 sm:px-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ reels */

export function ReelsShowcase({
  reels,
  products,
  cardWidth = 240,
  height = 460,
}: {
  reels: ReelItem[];
  products: AdminProduct[];
  cardWidth?: number;
  height?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const [inView, setInView] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e) setInView(e.isIntersecting);
    }, {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, v]) => {
      if (!v) return;
      const isActive = Number(key) === active;
      if (isActive && inView && !paused) {
        v.muted = muted;
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            v.muted = true;
            setMuted(true);
            void v.play().catch(() => undefined);
          });
        }
      } else {
        v.pause();
        v.muted = true;
        if (!isActive) v.currentTime = 0;
      }
    });
  }, [active, inView, paused, muted, reels]);

  const onActiveChange = useCallback((i: number) => {
    setActive(i);
    setPaused(false);
  }, []);

  if (!reels.length) {
    return (
      <div ref={sectionRef} className="grid h-full place-items-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          No reels yet — add one and it appears on the storefront instantly.
        </p>
      </div>
    );
  }

  return (
    <div ref={sectionRef}>
      <SectionHeading
        eyebrow="From the Studio"
        title="What We Stitch"
        subtitle="Instagram reels from the Coimbatore studio, each tagged with the exact design to order."
      />

      <div className="mt-8">
        <Carousel3D
          items={reels}
          itemWidth={cardWidth}
          height={height}
          autoPlay={false}
          onActiveChange={onActiveChange}
          renderItem={(reel, isActive, i) => {
            const product = products.find((p) => p.id === reel.productId);
            return (
              <div className="flex h-full w-full flex-col">
                <div
                  className={`relative flex-1 overflow-hidden rounded-3xl bg-maroon ${
                    isActive ? "shadow-lift" : "shadow-soft"
                  }`}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={reel.videoUrl || (reel as any).video_url}
                    loop
                    playsInline
                    preload="metadata"
                    muted
                    className="h-full w-full object-cover"
                  />
                  {isActive ? (
                    <>
                      <button
                        type="button"
                        aria-label={paused ? "Play reel" : "Pause reel"}
                        onClick={() => setPaused((p) => !p)}
                        className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-maroon/60 text-primary-foreground backdrop-blur"
                      >
                        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        aria-label={muted ? "Unmute reel" : "Mute reel"}
                        onClick={() => setMuted((m) => !m)}
                        className="absolute right-3 bottom-3 grid h-9 w-9 place-items-center rounded-full bg-maroon/60 text-primary-foreground backdrop-blur"
                      >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </>
                  ) : null}
                  <p className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-maroon/70 to-transparent p-3 text-xs font-medium text-primary-foreground">
                    {reel.title}
                  </p>
                  <span className="absolute top-3 right-3 grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-[0.62rem] font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                </div>

                {product ? (
                  <Link
                    to="/products/$id"
                    params={{ id: product.id }}
                    className="mt-3 flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-2.5 shadow-soft transition-colors hover:bg-secondary"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-12 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">
                        {product.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-primary uppercase">
                          Custom Stitch
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {inr(product.basePrice)}
                        </span>
                      </span>
                    </span>
                  </Link>
                ) : (
                  <p className="mt-3 rounded-2xl border border-dashed border-border p-2.5 text-center text-xs text-muted-foreground">
                    No product tagged
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------- featured design */

export function StorefrontProductCard({
  product: p,
  index = 0,
}: {
  product: AdminProduct;
  index?: number;
}) {
  const off = p.mrp > p.basePrice ? Math.round(((p.mrp - p.basePrice) / p.mrp) * 100) : 0;
  return (
    <Link
      to="/products/$id"
      params={{ id: p.id }}
      className="card-lift group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <AutoImageFade
          images={
            Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : [(p as any).image || "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg"]
          }
          alt={p.name}
          className="absolute inset-0 h-full w-full"
          interval={3400}
          offset={index * 700}
          showDots={false}
        />
        {off > 0 ? (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold text-primary-foreground">
            {off}% OFF
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-display line-clamp-2 text-sm leading-snug font-semibold text-foreground">
          {p.name}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-primary">{inr(p.basePrice)}</span>
          <span className="text-[0.7rem] text-muted-foreground line-through">{inr(p.mrp)}</span>
        </div>
      </div>
    </Link>
  );
}

export function FeaturedShowcase({ products }: { products: AdminProduct[] }) {
  return (
    <div>
      <SectionHeading
        eyebrow="Made to Order"
        title="Featured Designs"
        subtitle="The designs pinned to the customer landing page, in the order they appear."
      />
      {products.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {products.map((p, i) => (
            <StorefrontProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No designs featured yet — pick a few so the landing page has something to show.
        </p>
      )}
    </div>
  );
}
