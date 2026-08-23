import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, MousePointerClick, Pause, Play, Video, Volume2, VolumeX } from "lucide-react";
import { inr } from "@/lib/cart";
import { useReels } from "@/lib/useStorefront";
import { findProduct } from "@/data/boutique";
import { Carousel3D } from "./Carousel3D";
import { SectionHeading } from "./Motifs";
import { EmptyState } from "@/components/shared/Page";

export function ReelsCarousel() {
  const reels = useReels();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const [inView, setInView] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

  // The coach-mark is always available so shoppers never miss the shop-the-look link.
  const showGuide = inView;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(!!entry?.isIntersecting),
      { threshold: 0.4 },
    );
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

  return (
    <section ref={sectionRef} id="reels" className="bg-background py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="From the Studio"
          title="What We Stitch"
          subtitle="Instagram reels from our Coimbatore studio. Tap a reel to bring it forward, then order the exact style."
        />

        {reels.length === 0 ? (
          <div className="mt-12 flex justify-center">
            <EmptyState
              icon={<Video className="h-6 w-6" />}
              title="No reels yet"
              message="Studio reels will appear here once they're added. Browse our collections in the meantime."
              actionLabel="Browse collections"
              actionTo="/#collections"
            />
          </div>
        ) : (
          <div className="mt-12 w-full max-w-5xl mx-auto flex flex-col items-center">
            {/* Screen-reader equivalent of the visual coach-mark */}
            <p aria-live="polite" className="sr-only">
              {showGuide
                ? `Reel ${active + 1} of ${reels.length} is playing. Use the left and right arrow keys to change reels. The product link below opens the exact outfit shown.`
                : ""}
            </p>

            <Carousel3D
              items={reels}
              height={640}
              interval={7000}
              label="Studio reels"
              className="w-full"
              onActiveChange={onActiveChange}
              renderItem={(r, isActive, i, settled) => {
                const rawProd =
                  r.products?.[0] ||
                  (Array.isArray((r as any).reel_products) ? (r as any).reel_products[0]?.products : undefined) ||
                  findProduct((r as any).productId || (r as any).product_id);

                const product = rawProd
                  ? {
                      id: rawProd.id,
                      name: rawProd.name,
                      price: rawProd.price ?? rawProd.base_price ?? 2999,
                      image:
                        rawProd.image ||
                        (Array.isArray(rawProd.images)
                          ? typeof rawProd.images[0] === "string"
                            ? rawProd.images[0]
                            : rawProd.images[0]?.url
                          : "") ||
                        "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg",
                    }
                  : null;

                const videoSrc = (r as any).videoUrl || r.video_url;
                const posterSrc = (r as any).posterUrl || r.poster_url;

                return (
                  <div key={r.id} className="flex h-full w-full flex-col">
                    <div
                      className={`relative h-[540px] w-full overflow-hidden rounded-3xl bg-maroon [contain:paint] ${
                        isActive ? "shadow-lift" : "shadow-soft"
                      }`}
                    >
                      {posterSrc && (
                        <img
                          loading="lazy"
                          src={posterSrc}
                          alt=""
                          aria-hidden="true"
                          width={360}
                          height={540}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}

                      <video
                        ref={(el) => {
                          videoRefs.current[i] = el;
                        }}
                        src={videoSrc}
                        poster={posterSrc}
                        loop
                        playsInline
                        preload="metadata"
                        muted={muted}
                        aria-label={`Studio reel: ${r.title}`}
                        onError={(e) => {
                          // Hide video element gracefully if CDN video connection drops/fails
                          (e.currentTarget as HTMLVideoElement).style.display = "none";
                        }}
                        className="relative z-10 h-full w-full object-cover"
                      />

                      <p className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-maroon/80 via-maroon/40 to-transparent p-4 text-xs font-medium text-primary-foreground z-20">
                        {r.title}
                      </p>

                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 z-20 flex justify-between p-3 pointer-events-auto">
                          <button
                            type="button"
                            aria-label={paused ? "Play reel" : "Pause reel"}
                            aria-pressed={paused}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaused((p) => !p);
                            }}
                            className="grid h-11 w-11 place-items-center rounded-full bg-maroon/70 text-primary-foreground backdrop-blur shadow-soft transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-maroon"
                          >
                            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </button>

                          <button
                            type="button"
                            aria-label={muted ? "Unmute reel" : "Mute reel"}
                            aria-pressed={muted}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMuted((m) => !m);
                            }}
                            className="grid h-11 w-11 place-items-center rounded-full bg-maroon/70 text-primary-foreground backdrop-blur shadow-soft transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-maroon"
                          >
                            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Fixed-height slot: reserved whether or not a product card
                        renders, so switching reels never shifts the layout. */}
                    <div className="relative mt-10 h-[76px]">
                      {product && isActive ? (
                        <>
                          {/* The coach-mark only paints once the slide transition has
                              settled, so the halo can never drift off the card. */}
                          <div
                            data-testid="reel-guide"
                            aria-hidden="true"
                            className={`pointer-events-none absolute -top-9 left-0 right-0 z-30 flex justify-center px-3 transition-opacity duration-300 ${
                              showGuide && settled ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <div
                              className={`flex max-w-full flex-col items-center ${
                                showGuide && settled ? "animate-guide-float" : ""
                              }`}
                            >
                              <span className="flex max-w-full items-center gap-1.5 rounded-full border border-gold/70 bg-card/95 px-3 py-1.5 text-center text-[0.68rem] font-semibold leading-tight text-primary shadow-lift backdrop-blur sm:whitespace-nowrap sm:text-xs">

                                <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-gold animate-guide-tap" />
                                Tap below to shop this exact look
                              </span>
                              <ChevronDown className="-mt-0.5 h-4 w-4 text-gold animate-guide-bob" />
                            </div>
                          </div>


                          <span id={`reel-tip-${r.id}`} className="sr-only">
                            Opens the product page for the outfit shown in this reel.
                          </span>

                          <Link
                            to="/product/$id"
                            params={{ id: product.id }}
                            data-testid="reel-shop-link"
                            aria-label={`Shop this look: ${product.name}, ${inr(product.price)}`}
                            aria-describedby={`reel-tip-${r.id}`}
                            className={`flex items-center gap-3 rounded-2xl border bg-card p-2.5 shadow-soft transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                              showGuide && settled
                                ? "border-gold/70 animate-guide-halo"
                                : "border-border/70"
                            }`}
                          >
                            <img
                              src={product.image}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              width={40}
                              height={48}
                              className="h-12 w-10 shrink-0 rounded-lg object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-foreground">
                                {product.name}
                              </span>
                              <span className="mt-0.5 flex items-center gap-2">
                                <span className="text-xs font-semibold text-primary tabular-nums">
                                  {inr(product.price)}
                                </span>
                              </span>
                            </span>
                            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[0.65rem] font-semibold text-primary-foreground sm:inline-flex">
                              View &amp; Order
                            </span>
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </div>
                );

              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
