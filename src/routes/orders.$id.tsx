import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  Circle,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Star,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell, EmptyState } from "@/components/shared/Page";
import { StatusBadge } from "@/components/shared/Badge";
import { storeInfo, waLink } from "@/data/boutique";
import { inr } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { mapOrder, useOrders, type Order } from "@/lib/orders";
import {
  blueDartTrackingUrl,
  courier,
  fmtDate,
  fmtScanTime,
  getStepsForOrder,
  stepFor,
  stepIndex,
} from "@/lib/tracking";
import { addReview, listReviewsForOrder, type Review } from "@/lib/reviews";
import type { CancellationResult, TrackingData } from "@/lib/api/orders";
import { fetchOrderById, fetchOrderTracking } from "@/lib/api/orders";

/** Cancels an order via the backend API */
async function cancelOrderApi(orderId: string, reason: string): Promise<CancellationResult> {
  const { cancelOrder } = await import("@/lib/api/orders");
  return cancelOrder(orderId, reason);
}

/** Cancel section — only shown when order is in a cancellable state */
function CancelSection({ order, onCancelled }: { order: Order; onCancelled: () => void }) {
  const cancellableStages = ["placed", "measuring", "stitching", "quality-check", "packed"];
  const isCancellable = cancellableStages.includes(order.status);
  const isShipped = order.status === "shipped" || order.status === "in-transit" || order.status === "out-for-delivery";

  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CancellationResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  if (order.status === "delivered" || order.status === "picked_up" || (order.status as string) === "cancelled") {
    return null;
  }

  // After handover: show contact-us message (no self-cancel allowed)
  if (isShipped) {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-50/50 p-5 shadow-soft">
        <h2 className="font-display text-sm font-semibold text-amber-800">Want to cancel?</h2>
        <p className="mt-1 text-xs text-amber-700">
          Your parcel is already with the courier. Please contact us via WhatsApp and we will arrange the return with Blue Dart.
        </p>
        <a
          href={waLink(`Hi, I want to cancel my order #${order.orderNo}. It is already shipped. Please help with Blue Dart return.`)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-400 bg-amber-100 py-2.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Contact Boutique for Return
        </a>
      </div>
    );
  }

  if (!isCancellable) return null;

  if (result) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">Cancellation Requested</p>
            <p className="mt-1 text-xs text-muted-foreground">{result.message}</p>
            {result.requiresAdminAction ? (
              <p className="mt-2 text-[0.68rem] text-amber-700">Our team will contact you about your refund.</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50/40 p-5 shadow-soft">
      {!confirming ? (
        <>
          <h2 className="font-display text-sm font-semibold text-foreground">Cancel Order</h2>
          <p className="mt-1 text-xs text-muted-foreground">Changed your mind? Cancel before we start stitching.</p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-300 bg-red-50 py-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <XCircle className="h-3.5 w-3.5" /> Request Cancellation
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground">Confirm cancellation?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.paymentMethod === "razorpay"
              ? "Your payment will be refunded within 5-7 business days."
              : "Your COD order will be cancelled. No payment to refund."}
          </p>
          {apiError ? (
            <p className="mt-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{apiError}</p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="flex-1 rounded-full border border-border py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Keep Order
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setApiError(null);
                try {
                  const res = await cancelOrderApi(order.id, "Cancelled by customer");
                  setResult(res);
                  onCancelled();
                  toast.success(res.message || "Order cancellation request submitted successfully.");
                } catch (err) {
                  const msg = err instanceof Error ? err.message : "Cancellation failed. Please try again.";
                  setApiError(msg);
                  toast.error(msg);
                } finally {
                  setLoading(false);
                }
              }}
              className="flex-1 rounded-full bg-red-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Yes, Cancel"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}


export const Route = createFileRoute("/orders/$id")({
  head: () => {
    const title = "Order tracking — Pattu Kutty";
    const description = "Track your Pattu Kutty order from measurement to delivery.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex, follow" },
      ],
    };
  },
  component: OrderTrackingPage,
});

function Stars({
  value,
  onChange,
  size = "h-5 w-5",
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: string;
}) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange?.(n)}
          className={onChange ? "transition-transform hover:scale-110" : "cursor-default"}
        >
          <Star
            className={`${size} ${n <= value ? "fill-accent text-accent" : "text-border"}`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </span>
  );
}

function ReviewPanel({ order }: { order: Order }) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const itemsList = order.items ?? [];
  const [productId, setProductId] = useState(itemsList[0]?.id ?? "");

  useEffect(() => {
    void listReviewsForOrder(order.id).then((rows) => {
      setReviews(rows);
      setLoading(false);
    });
  }, [order.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const item = itemsList.find((i) => i.id === productId) ?? itemsList[0];
      const created = await addReview({
        userId: user.id,
        orderId: order.id,
        productId: item?.id ?? productId,
        productName: item?.name ?? "",
        authorName: profile?.full_name || user.email?.split("@")[0] || "Pattu Kutty customer",
        rating,
        title,
        body,
      });
      if (created) {
        setReviews((prev) => [created, ...prev]);
        setTitle("");
        setBody("");
        setRating(5);
        toast.success("Thank you! Your review has been posted successfully.");
      } else {
        toast.error("Could not post review. Please try again.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to post review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const delivered = order.status === "delivered" || order.status === "picked_up";

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">Reviews & ratings</h2>

      {delivered ? (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-secondary/50 p-4">
          <p className="text-sm font-medium text-foreground">
            How did we stitch it? Your review helps other brides & mums.
          </p>
          {itemsList.length > 1 ? (
            <select
              id="reviewProductId"
              name="reviewProductId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            >
              {itemsList.map((i) => (
                <option key={i.key} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          ) : null}
          <Stars value={rating} onChange={setRating} />
          <input
            id="reviewTitle"
            name="reviewTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Headline (e.g. Perfect fit for the reception!)"
            className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <textarea
            id="reviewBody"
            name="reviewBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Share your experience with fabric, fitting or stitching timeline..."
            className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-opacity disabled:opacity-50"
          >
            {busy ? "Submitting..." : "Post Review"}
          </button>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading reviews...</p>
        ) : reviews.length ? (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{r.authorName}</span>
                <Stars value={r.rating} size="h-3.5 w-3.5" />
              </div>
              {r.title ? <p className="mt-1 font-medium text-foreground">{r.title}</p> : null}
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">
            {delivered
              ? "No reviews posted yet for this order. Be the first!"
              : "Reviews open once your outfit is delivered or picked up."}
          </p>
        )}
      </div>
    </div>
  );
}

function OrderTrackingPage() {
  const { id } = Route.useParams();
  const { find, loading, refresh } = useOrders();
  const { user, ready } = useAuth();

  const [directOrder, setDirectOrder] = useState<Order | null>(null);
  const [directLoading, setDirectLoading] = useState(false);

  const order = find(id) || directOrder;

  const [copiedPayment, setCopiedPayment] = useState(false);
  const [liveTracking, setLiveTracking] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    if (find(id)) return;
    setDirectLoading(true);
    fetchOrderById(id)
      .then((ord: any) => {
        if (ord) setDirectOrder(mapOrder(ord));
      })
      .catch(() => setDirectOrder(null))
      .finally(() => setDirectLoading(false));
  }, [id]);

  useEffect(() => {
    if (!order) return;
    setTrackingLoading(true);
    fetchOrderTracking(order.id)
      .then((data) => setLiveTracking(data))
      .catch(() => setLiveTracking(null))
      .finally(() => setTrackingLoading(false));
  }, [order?.id]);

  if (!ready || loading) {
    return (
      <PageShell>
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Sign in to view tracking"
          message="Please sign in with your account to view your order details."
          actionLabel="Sign in"
          actionTo="/auth"
        />
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell>
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Order not found"
          message="We couldn't locate this order number."
          actionLabel="Back to orders"
          actionTo="/orders"
        />
      </PageShell>
    );
  }

  const isPickup = order.deliveryType === "store_pickup";
  const steps = getStepsForOrder(order.deliveryType);
  const currentStepIdx = stepIndex(order.status, steps);
  const currentStep = stepFor(order.status, steps);
  const isShipped = order.status === "shipped" || order.status === "in-transit" || order.status === "out-for-delivery" || order.status === "delivered";
  const effectiveAwb = liveTracking?.awb || order.awb;
  const effectiveTrackingUrl = liveTracking?.shipment?.trackingUrl || order.trackingUrl || (effectiveAwb ? blueDartTrackingUrl(effectiveAwb) : undefined);
  const displayScans = (liveTracking?.scans && liveTracking.scans.length > 0) ? liveTracking.scans : order.scans;

  const copyPaymentRef = () => {
    if (!order.paymentRef) return;
    void navigator.clipboard.writeText(order.paymentRef);
    setCopiedPayment(true);
    setTimeout(() => setCopiedPayment(false), 2000);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={`Order #${order.orderNo}`}
        title={currentStep.label}
        subtitle={currentStep.hint}
        crumbs={[{ label: "My Orders", to: "/orders" }, { label: `#${order.orderNo}` }]}
      />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Header Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={order.paymentStatus === "paid" ? "ok" : "review"}>
                {order.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
              </StatusBadge>

              {order.custom ? <StatusBadge tone="gold">Customised Order</StatusBadge> : null}

              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isPickup
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-600"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-600"
              }`}>
                {isPickup ? <><Store className="h-3.5 w-3.5" /> Store Pickup</> : <><Truck className="h-3.5 w-3.5" /> Doorstep Delivery</>}
              </span>
            </div>

            {/* Store Pickup Banner (if applicable) */}
            {isPickup && (order.status === "ready_for_pickup" || order.status === "picked_up") ? (
              <div className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <Store className="mt-0.5 h-6 w-6 shrink-0 text-violet-600" />
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {order.status === "picked_up" ? "Order Picked Up!" : "Ready for Store Pickup"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.status === "picked_up"
                        ? "Thank you for visiting our boutique!"
                        : `Please visit our boutique at ${storeInfo?.address} with Order #${order.orderNo} to collect your outfit.`}
                    </p>
                    <a
                      href={`tel:${(storeInfo?.phone || "+91 97917 12622").replace(/\s/g, "")}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call Boutique: {storeInfo?.phone || "+91 97917 12622"}
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Stepper Progress */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-foreground">Stitching & Delivery Progress</h2>
              <div className="mt-6 space-y-6">
                {steps.map((step, idx) => {
                  const done = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div key={step.id} className="relative flex items-start gap-4">
                      {idx < steps.length - 1 ? (
                        <span
                          className={`absolute top-6 left-3.5 -bottom-6 w-0.5 ${
                            idx < currentStepIdx ? "bg-primary" : "bg-border"
                          }`}
                        />
                      ) : null}

                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                          isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : done
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? <Check className="h-4 w-4" /> : idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                            {step.label}
                          </p>
                          {isCurrent ? (
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                              Current Stage
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Blue Dart Courier Card — ONLY shown for doorstep orders when shipped/AWB present */}
            {!isPickup && (isShipped || effectiveAwb) ? (
              <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h2 className="font-display text-lg font-semibold text-foreground">BlueDart Courier Tracking</h2>
                  </div>
                  <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-600">
                    Live Courier
                  </span>
                </div>

                {liveTracking?.statusDescription ? (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-50/50 p-3.5 text-xs text-blue-900">
                    <span className="font-semibold">Tracking Status: </span>
                    {liveTracking.statusDescription}
                  </div>
                ) : !liveTracking && !trackingLoading && effectiveAwb ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-3.5 text-xs text-amber-900">
                    <span className="font-semibold">Live Status Sync Delayed: </span>
                    Direct BlueDart courier tracking link active below.
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-card p-4">
                  <div>
                    <p className="text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase">Courier Partner</p>
                    <p className="text-sm font-semibold text-foreground">{courier.name} ({courier.service})</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase">AWB Tracking Number</p>
                    <p className="font-mono text-sm font-semibold text-foreground">{effectiveAwb || "Pending pickup"}</p>
                  </div>
                </div>

                {effectiveAwb ? (
                  <a
                    href={effectiveTrackingUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.01]"
                  >
                    <ExternalLink className="h-4 w-4" /> Track Parcel on BlueDart Website
                  </a>
                ) : null}
              </div>
            ) : null}

            {/* Scans timeline */}
            {displayScans && displayScans.length > 0 ? (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-foreground">Scan Updates</h2>
                  {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                </div>
                <div className="mt-4 space-y-3">
                  {displayScans.map((scan, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 rounded-2xl bg-secondary/40 p-3.5 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{scan.status}</p>
                        <p className="text-muted-foreground">{scan.detail}</p>
                        <p className="mt-1 text-[0.65rem] text-primary">{scan.location}</p>
                      </div>
                      <span className="shrink-0 text-muted-foreground font-mono text-[0.68rem]">
                        {fmtScanTime(scan.at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Items */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-foreground">Items in Order</h2>
              <div className="mt-4 divide-y divide-border">
                {(order.items ?? []).map((it, i) => {
                  const name = it.name || (it as any).product_name_snapshot || "";
                  const size = it.size || (it as any).size_snapshot || "";
                  const qty = Math.max(1, Number(it.qty || (it as any).quantity || 1));
                  const unitPrice = Number(it.price ?? (it as any).unit_price ?? 0);
                  const img =
                    it.image ||
                    (it as any).image_url_snapshot ||
                    (it as any).image_url ||
                    "";

                  return (
                    <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      {img ? (
                        <img loading="lazy" src={img} alt={name} className="h-16 w-14 rounded-xl object-cover" />
                      ) : (
                        <div className="h-16 w-14 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xs">No img</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          Size {size} · Qty {qty}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{inr(unitPrice * qty)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stitching / Delivery Notes */}
            {order.notes ? (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Stitching / Delivery Notes</h2>
                </div>
                <p className="mt-3 rounded-2xl bg-secondary/50 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            ) : null}

            {/* Reviews */}
            <ReviewPanel order={order} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Info Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Payment Summary</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{inr(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="font-medium text-foreground">{order.delivery ? inr(order.delivery) : "Free"}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span className="text-primary">{inr(order.total)}</span>
                </div>
              </div>

              {/* Payment Ref ID */}
              {order.paymentRef ? (
                <div className="mt-4 rounded-2xl bg-secondary/80 p-3.5">
                  <p className="text-[0.65rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Razorpay Reference ID
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-mono text-sm font-semibold text-foreground">{order.paymentRef}</p>
                    <button
                      type="button"
                      onClick={copyPaymentRef}
                      className="p-1 text-muted-foreground hover:text-primary"
                    >
                      {copiedPayment ? <BadgeCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Fulfilment / Address Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {isPickup ? "Store Pickup Location" : "Delivery Address"}
              </h2>

              {isPickup ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{storeInfo?.name}</p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{storeInfo?.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{storeInfo?.phone || "+91 97917 12622"}</span>
                  </p>
                </div>
              ) : order?.shipping ? (
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {order.shipping?.fullName ? (
                    <p className="font-semibold text-foreground">{order.shipping.fullName}</p>
                  ) : null}
                  {order.shipping?.phone ? <p>{order.shipping.phone}</p> : null}
                  {order.shipping?.line1 ? <p>{order.shipping.line1}</p> : null}
                  {order.shipping?.landmark ? <p>Near {order.shipping.landmark}</p> : null}
                  {order.shipping?.city || order.shipping?.state || order.shipping?.pincode ? (
                    <p>
                      {[order.shipping?.city, order.shipping?.state].filter(Boolean).join(", ")}
                      {order.shipping?.pincode ? ` — ${order.shipping.pincode}` : ""}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No delivery address recorded.</p>
              )}
            </div>

            {/* Cancellation Section */}
            <CancelSection order={order} onCancelled={refresh} />

            {/* Support CTA */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft text-center">
              <p className="text-xs text-muted-foreground">Need help with this order?</p>
              <a
                href={waLink(`Hi, I have a question about my order #${order.orderNo}`)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary py-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" /> Chat with Boutique on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
