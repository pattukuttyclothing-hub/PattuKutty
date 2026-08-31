import { Link } from "@tanstack/react-router";
import { Heart, Sparkles } from "lucide-react";
import { inr } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import type { Product } from "@/data/boutique";

export function ProductCard({ product: p, index = 0 }: { product: Product; index?: number }) {
  const { has, toggle } = useWishlist();
  const priceVal = p.price ?? (p as any).basePrice ?? (p as any).base_price ?? 0;
  const mrpVal = p.mrp ?? priceVal;
  const rawImgs = Array.isArray(p.images)
    ? p.images.map((img: any) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
    : [];
  const imgs = rawImgs.length ? rawImgs : p.image ? [p.image] : [];
  const isSoldOut = Boolean((p as any).sold_out || p.soldOut);
  const badgeText = p.badge || (p as any).badge;
  const isLiked = has(p.id);

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
          className={`absolute inset-0 h-full w-full ${isSoldOut ? "opacity-75 blur-[1.5px]" : ""}`}
          interval={7500}
          offset={index * 700}
        />

        {/* Top-Right Heart / Wishlist Toggle */}
        <button
          type="button"
          title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(p.id);
          }}
          className="absolute top-3 right-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-card/80 backdrop-blur-md shadow-soft border border-border/50 transition-all hover:scale-110 active:scale-95"
        >
          <Heart className={`h-4 w-4 transition-colors ${isLiked ? "fill-rose-500 text-rose-500" : "text-foreground/75 hover:text-rose-500"}`} />
        </button>

        {/* Sold Out Seal or Ribbon Badge */}
        {isSoldOut ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="rotate-[-12deg] rounded-2xl border-2 border-dashed border-rose-300/90 bg-rose-600/90 px-4 py-2 text-center text-xs font-black tracking-widest text-white uppercase shadow-xl backdrop-blur-md">
              Product Sold Out
            </div>
          </div>
        ) : badgeText ? (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-[0.65rem] font-bold tracking-wider text-primary-foreground shadow-soft uppercase backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-accent" /> {badgeText}
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
              ? "border-rose-300/60 bg-rose-100/50 text-rose-700 font-semibold"
              : "border-primary/30 bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          }`}
        >
          {isSoldOut ? "Product Sold Out" : "View & Order"}
        </span>
      </div>
    </Link>
  );
}
