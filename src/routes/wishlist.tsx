import { createFileRoute } from "@tanstack/react-router";
import { Heart, Trash2 } from "lucide-react";
import { PageHeader, PageShell, EmptyState } from "@/components/shared/Page";
import { ProductCard } from "@/components/boutique/ProductCard";
import { useWishlist } from "@/lib/wishlist";
import { useWishlistProducts } from "@/lib/useStorefront";

const title = "Loved Designs — Pattu Kutty";
const description =
  "The designs you've saved at Pattu Kutty, Coimbatore — revisit them any time and order or customise.";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids, remove } = useWishlist();
  const { products: items, loading } = useWishlistProducts(ids);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Saved For Later"
        title="Loved Designs"
        compact
        subtitle={
          loading
            ? "Loading your loved designs..."
            : items.length
              ? `${items.length} design${items.length > 1 ? "s" : ""} saved on this device.`
              : "Tap the heart on any design to keep it here."
        }
        crumbs={[{ label: "Loved Designs" }]}
      />

      <section className="bg-background py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: Math.max(1, ids.length) }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border/70 bg-card p-4">
                  <div className="aspect-[4/5] rounded-xl bg-muted/60" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-muted/60" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted/60" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No loved designs yet"
              message="Browse our collections and tap the heart on the designs you like — they'll wait for you here."
              actionLabel="Browse collections"
              actionTo="/"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {items.map((p) => (
                <div key={p.id} className="relative">
                  <ProductCard product={p} />
                  <button
                    type="button"
                    aria-label={`Remove ${p.name} from loved designs`}
                    onClick={() => remove(p.id)}
                    className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-card/95 text-primary shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
