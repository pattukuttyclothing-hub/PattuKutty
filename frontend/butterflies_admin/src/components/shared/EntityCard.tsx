import type { ReactNode } from "react";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import type { Tone } from "@/components/shared/Badge";

const ribbonTones: Record<Tone, string> = {
  review: "bg-amber-500 text-white",
  ok: "bg-emerald-600 text-white",
  bad: "bg-rose-600 text-white",
  info: "bg-blue-600 text-white",
  gold: "bg-amber-500 text-white",
  purple: "bg-purple-600 text-white",
  pink: "bg-pink-600 text-white",
};

/**
 * Editorial admin card: photo-led, with a distinct ribbon for status and all the
 * key details laid over a soft scrim — the same card language the customer
 * sees on the storefront, reused across products, requests and orders.
 */
export function EntityCard({
  images,
  alt,
  ribbon,
  ribbonTone = "gold",
  corner,
  eyebrow,
  title,
  metaLines,
  cta,
  footer,
  aspect = "aspect-[4/5]",
  index = 0,
}: {
  images: string[];
  alt: string;
  ribbon?: ReactNode;
  ribbonTone?: Tone;
  corner?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
  metaLines?: ReactNode[];
  cta: string;
  footer?: ReactNode;
  aspect?: string;
  index?: number;
}) {
  return (
    <div className="card-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
      <div className={`relative ${aspect} overflow-hidden`}>
        <AutoImageFade
          images={images}
          alt={alt}
          className="absolute inset-0 h-full w-full"
          interval={7500}
          offset={index * 700}
          showDots={false}
        />

        <div className="overlay-scrim pointer-events-none absolute inset-x-0 bottom-0 h-3/5" />

        {ribbon ? (
          <span className={`absolute top-4 -right-1 z-10 rounded-l-full px-4 py-1.5 text-[0.62rem] font-bold tracking-[0.14em] uppercase shadow-soft ${ribbonTones[ribbonTone]}`}>
            {ribbon}
          </span>
        ) : null}
        {corner ? <span className="absolute top-4 left-4 z-10">{corner}</span> : null}

        <div className="absolute inset-x-0 bottom-0 z-10 p-5">
          {eyebrow ? (
            <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-primary-foreground/80 uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="font-display mt-1.5 text-lg leading-snug font-semibold text-primary-foreground">
            {title}
          </h3>
          {metaLines?.length ? (
            <div className="mt-2 space-y-1">
              {metaLines.map((m, k) => (
                <p key={k} className="text-xs text-primary-foreground/80">
                  {m}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 py-4">
        <span className="inline-flex flex-1 items-center justify-center rounded-full border border-primary/30 bg-secondary px-4 py-2.5 text-[0.7rem] font-semibold tracking-[0.1em] text-primary uppercase transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {cta}
        </span>
        {footer}
      </div>
    </div>
  );
}
