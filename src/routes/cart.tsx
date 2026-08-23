import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { EmptyState, PageHeader, PageSection, PageShell } from "@/components/shared/Page";
import { Reveal, stagger } from "@/components/shared/Reveal";
import { deliveryRules } from "@/data/boutique";
import { inr, orderWaLink, useCart } from "@/lib/cart";


const title = "Your Bag — Pattu Kutty";
const description =
  "Review your selected designs, adjust quantities and send your order enquiry to Pattu Kutty on WhatsApp.";

export const Route = createFileRoute("/cart")({
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
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, delivery, total } = useCart();


  return (
    <PageShell>
      <PageHeader
        eyebrow="Your Selection"
        title="Your Bag"
        compact
        subtitle={
          items.length
            ? `${items.length} design${items.length > 1 ? "s" : ""} ready for checkout or a WhatsApp enquiry.`
            : "Designs you add will appear here, saved on this device."
        }
        crumbs={[{ label: "Your Bag" }]}
        actions={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-soft transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
          </Link>
        }
      />

      <PageSection width="medium">
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Your bag is empty"
            message="Browse our collections and add a design — your bag stays saved on this device."
            actionLabel="Shop collections"
            actionTo="/"
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
              <ul className="space-y-4">
                {items.map((i, idx) => (
                  <Reveal
                    as="li"
                    key={i.key}
                    delay={stagger(idx, 60)}
                    className="flex gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-soft transition-shadow duration-300 hover:shadow-lift sm:gap-4 sm:p-4"
                  >
                    <img
                      loading="lazy"
                      src={i.image || "/placeholder.svg"}
                      alt={i.name}
                      className="aspect-[4/5] h-24 w-[77px] shrink-0 rounded-xl object-cover object-center sm:h-32 sm:w-[102px]"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display line-clamp-2 text-sm font-semibold text-foreground sm:truncate sm:text-base">
                            {i.name}
                          </h2>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            Size {i.size} · {i.colour}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-primary">{inr(i.price)}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${i.name}`}
                          onClick={() => remove(i.key)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
                        <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-1.5 py-1 sm:gap-2 sm:px-2">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(i.key, i.qty - 1)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary transition-transform active:scale-95 hover:bg-primary hover:text-primary-foreground sm:h-9 sm:w-9"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold sm:w-6">{i.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQty(i.key, i.qty + 1)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary transition-transform active:scale-95 hover:bg-primary hover:text-primary-foreground sm:h-9 sm:w-9"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="ml-auto text-sm font-semibold text-foreground">
                          {inr(i.price * i.qty)}
                        </span>
                      </div>
                    </div>

                  </Reveal>
                ))}
              </ul>

              <aside className="h-fit rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-soft lg:sticky lg:top-28 z-10">
                <h2 className="font-display text-xl font-semibold text-foreground">Order Summary</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-medium text-foreground">{inr(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="font-medium text-foreground">
                      {delivery === 0 ? "Free" : inr(delivery)}
                    </dd>
                  </div>
                  <div className="gold-divider my-2 h-px" />
                  <div className="flex justify-between text-base">
                    <dt className="font-semibold text-foreground">Total</dt>
                    <dd className="font-semibold text-primary">{inr(total)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Delivery fee is calculated at checkout based on your address and delivery options.
                </p>

                <Link
                  to="/checkout"
                  className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
                >
                  Proceed to checkout
                </Link>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Secure checkout · Razorpay UPI, cards & netbanking.
                </p>
                <a
                  href={orderWaLink(items, { subtotal, delivery, total })}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <MessageCircle className="h-4 w-4" /> Query on WhatsApp
                </a>
              </aside>
          </div>
        )}
      </PageSection>
    </PageShell>
  );
}
