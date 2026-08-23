import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { inr } from "@/lib/cart";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import type { Product } from "@/data/boutique";

export function ProductCard({ product: p, index = 0 }: { product: Product; index?: number }) {
  const priceVal = p.price ?? (p as any).basePrice ?? (p as any).base_price ?? 0;
  const mrpVal = p.mrp ?? priceVal;
  const rawImgs = Array.isArray(p.images)
    ? p.images.map((img: any) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
    : [];
  const imgs = rawImgs.length ? rawImgs : p.image ? [p.image] : [];
  const isSoldOut = Boolean((p as any).sold_out || p.soldOut);

  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className={`card-lift group flex flex-col overflow-hidden rounded-2xl border shadow-soft transition-all ${
        isSoldOut
          ? "border-pink-300/60 bg-pink-50/15 ring-2 ring-pink-400/30 opacity-80"
          : "border-border/70 bg-card"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <AutoImageFade
          images={imgs}
          alt={p.name}
          className={`absolute inset-0 h-full w-full ${isSoldOut ? "opacity-75 blur-[0.5px]" : ""}`}
          interval={7500}
          offset={index * 700}
        />
        {isSoldOut ? (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-primary px-3 py-1 text-[0.65rem] font-bold tracking-wider text-primary-foreground shadow-soft uppercase">
            PRODUCT SOLD OUT
          </span>
        ) : (p.badge || (p as any).badge) ? (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-[0.65rem] font-bold tracking-wider text-primary-foreground shadow-soft uppercase backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-accent" /> {p.badge || (p as any).badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base leading-snug font-semibold text-foreground">
          {p.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-primary">{inr(priceVal)}</span>
          {mrpVal > priceVal ? (
            <span className="text-xs text-muted-foreground line-through">{inr(mrpVal)}</span>
          ) : null}
        </div>
        <span
          className={`mt-4 inline-flex items-center justify-center rounded-full border py-2.5 text-xs font-medium transition-colors ${
            isSoldOut
              ? "border-pink-300/60 bg-pink-100/50 text-pink-700 font-semibold"
              : "border-primary/30 bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          }`}
        >
          {isSoldOut ? "PRODUCT SOLD OUT" : "View & Order"}
        </span>
      </div>
    </Link>
  );
}
