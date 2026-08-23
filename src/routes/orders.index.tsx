import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Package, Store, Truck } from "lucide-react";
import { PageHeader, PageShell, EmptyState } from "@/components/shared/Page";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import { inr } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useOrders } from "@/lib/orders";
import { courier, fmtDate, getStepsForOrder, stepFor, stepIndex } from "@/lib/tracking";

const title = "My Orders — Pattu Kutty";
const description =
  "Track every outfit you've ordered from Pattu Kutty, Coimbatore — stitching progress and delivery tracking in one place.";

export const Route = createFileRoute("/orders/")({
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
  component: OrdersPage,
});

function OrdersPage() {
  const { user, ready } = useAuth();
  const { orders, loading } = useOrders();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your Wardrobe In Progress"
        title="My Orders"
        compact
        subtitle={`Follow each outfit from measurement to delivery or store pickup.`}
        crumbs={[{ label: "My Orders" }]}
      />

      <section className="bg-background py-10 lg:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {!ready || (user && loading) ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !user ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Sign in to see your orders"
              message="Your orders, addresses and tracking live in your account so you can pick up on any device."
              actionLabel="Sign in"
              actionTo="/auth"
            />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="No orders yet"
              message="Once you place an order it appears here with live stitching status and delivery tracking."
              actionLabel="Browse collections"
              actionTo="/"
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((o, i) => {
                const steps = getStepsForOrder(o.deliveryType);
                const step = stepFor(o.status, steps);
                const idx = stepIndex(o.status, steps);
                const pct = ((idx + 1) / steps.length) * 100;
                const itemsList = o.items ?? [];
                const imgs = itemsList.map((it) => it.image).filter(Boolean);
                const paid = o.paymentStatus === "paid";
                const isPickup = o.deliveryType === "store_pickup";

                return (
                  <Link
                    key={o.id}
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="card-lift group relative block aspect-[3/4.2] overflow-hidden rounded-2xl bg-card shadow-soft"
                  >
                    {imgs.length ? (
                      <AutoImageFade
                        images={imgs}
                        alt={itemsList[0]?.name ?? "Your order"}
                        className="absolute inset-0 h-full w-full"
                        interval={9000}
                        showDots={false}
                        offset={i * 1400}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-secondary" />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon/92 via-maroon/35 to-maroon/5" />

                    {/* payment + customisation + delivery labels, stamped on the card */}
                    <div className="absolute top-3 -right-1 z-10 flex flex-col items-end gap-1.5">
                      <span
                        className={`-rotate-6 rounded-l-xl rounded-r-sm px-3.5 py-1.5 text-[0.62rem] font-bold tracking-[0.16em] uppercase shadow-lift ring-2 ring-primary-foreground/70 ${
                          paid
                            ? "bg-primary text-primary-foreground"
                            : o.paymentMethod === "cod"
                              ? "bg-accent text-accent-foreground"
                              : "bg-destructive text-primary-foreground"
                        }`}
                      >
                        {paid
                          ? "Paid"
                          : o.paymentMethod === "cod"
                            ? "Pay on Delivery"
                            : "Payment Pending"}
                      </span>
                      {o.custom ? (
                        <span className="-rotate-6 rounded-l-xl rounded-r-sm bg-secondary px-3.5 py-1.5 text-[0.62rem] font-bold tracking-[0.16em] text-primary uppercase shadow-lift ring-2 ring-primary/30">
                          Customisation
                        </span>
                      ) : null}
                      <span className={`-rotate-6 rounded-l-xl rounded-r-sm px-3 py-1 text-[0.6rem] font-bold tracking-[0.12em] uppercase shadow-lift ring-2 ring-primary-foreground/50 ${
                        isPickup ? "bg-violet-600 text-white" : "bg-blue-600 text-white"
                      }`}>
                        {isPickup ? "Store Pickup" : "Doorstep"}
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                      <p className="text-[0.6rem] tracking-[0.22em] text-primary-foreground/70 uppercase">
                        #{o.orderNo} · {fmtDate(o.createdAt)}
                      </p>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <h2 className="font-display truncate text-lg leading-tight font-semibold text-primary-foreground">
                          {itemsList[0]?.name ?? "Order"}
                          {itemsList.length > 1 ? ` + ${itemsList.length - 1} more` : ""}
                        </h2>
                        <span className="shrink-0 rounded-full bg-accent/90 px-3 py-1 text-[0.6rem] font-semibold tracking-[0.12em] text-accent-foreground uppercase">
                          {step.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[0.7rem] text-primary-foreground/80">
                        {inr(o.total)} {o.awb ? `· AWB ${o.awb}` : ""}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[0.7rem] font-medium text-accent">
                        {isPickup ? (
                          <><Store className="h-3.5 w-3.5" /> Store Pickup · Gandhipuram</>
                        ) : (
                          <><Truck className="h-3.5 w-3.5" /> {o.status === "delivered" ? `Delivered on ${fmtDate(o.expectedDelivery)}` : `Expected by ${fmtDate(o.expectedDelivery)} · ${courier.name}`}</>
                        )}
                      </p>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/25">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="truncate text-[0.62rem] text-primary-foreground/75">
                          {step.hint}
                        </p>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[0.62rem] font-semibold text-primary-foreground">
                          View <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>

                  </Link>
                );
              })}
            </div>

          )}
        </div>
      </section>
    </PageShell>
  );
}
