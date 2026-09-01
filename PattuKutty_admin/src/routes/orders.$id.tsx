import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clipboard,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { ProductGallery } from "@/components/shared/ProductGallery";
import { StatusBadge } from "@/components/shared/Badge";
import { storeSettings, waLink } from "@/data/boutique";
import {
  useAdmin,
  getStagesForOrder,
  stageIndex,
  stageMeta,
  blueDartTrackingUrl,
  type AdminOrder,
  type OrderStage,
} from "@/lib/admin-store";
import { fmtDateTime, inr } from "@/lib/format";
import { fetchOrderById, enterShipment, updateOrderStage, cancelOrderAdmin, initiateRefundAdmin, fetchShipmentScansAdmin, type LiveScanEvent } from "@/lib/api/orders";
import { ShipmentPickupModal } from "@/components/admin/ShipmentPickupModal";
import { ShipmentPickupCancelModal } from "@/components/admin/ShipmentPickupCancelModal";

function CopyButton({ text, title = "Copy to clipboard" }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      title={title}
    >
      {copied ? <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Clipboard className="h-3.5 w-3.5" />}
    </button>
  );
}

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order detail — Pattu Kutty Admin" },
      {
        name: "description",
        content:
          "Order items, payment and address, plus the stage control that drives the customer's tracking labels.",
      },
      { property: "og:title", content: "Order detail — Pattu Kutty Admin" },
      { property: "og:description", content: "Order metadata and stage control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { findOrder, setOrderStage, saveOrder } = useAdmin();
  const storeOrder = findOrder(id);

  const [fetchedOrder, setFetchedOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(!storeOrder);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const fetched = await fetchOrderById(id);
        if (active) {
          if (fetched) {
            setFetchedOrder(fetched);
            setNotFound(false);
          } else if (!storeOrder) {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.warn("[Order Detail] Remote fetch error:", err);
        if (active && !storeOrder) {
          setNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const o = fetchedOrder || storeOrder;

  const [stageLoading, setStageLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  if (loading) {
    return (
      <AdminShell>
        <PageHead title="Loading Order..." />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  if (notFound || !o) {
    return (
      <AdminShell>
        <PageHead title="Order Not Found" subtitle={`No order found matching ID "${id}".`} />
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <XCircle className="h-8 w-8" />
          </div>
          <h3 className="font-display text-lg font-semibold">Order Not Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested order (ID: <span className="font-mono">{id}</span>) could not be found in the database or local store.
          </p>
          <div className="mt-6">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Orders List
            </Link>
          </div>
        </div>
      </AdminShell>
    );
  }

  const stages = getStagesForOrder(o);
  const current = stageIndex(o.stage, stages);
  const next = stages[current + 1];

  const isDoorstep = o.deliveryType !== "store_pickup";
  const isShippedOrBeyond =
    isDoorstep && (o.stage === "shipped" || o.stage === "delivered");
  const isCancelled = o.stage === "cancelled";

  // For doorstep orders, the "shipped" stage needs AWB input
  const isReadyToShip =
    isDoorstep && next?.id === "shipped";

  const advance = async () => {
    if (!next || !next.adminControlled || stageLoading) return;

    if (next.id === "shipped" && isDoorstep) {
      return;
    }

    setStageLoading(true);
    try {
      setOrderStage(o.id, next.id);
      await updateOrderStage(o.id, next.id).catch((err) => {
        console.warn("Backend stage sync notice:", err);
      });
      if (next.id === "ready_for_pickup") {
        const msg = `Pattu Kutty \u2014 Your order #${o.orderNo} is ready for pickup!\nPlease visit our store at Gandhipuram, Coimbatore to collect your order.\nThank you!`;
        window.open(waLink(o.customerPhone, msg), "_blank", "noopener");
      }
      toast.success(`Customer now sees "${next.label}".`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update order stage";
      toast.error(msg);
    } finally {
      setStageLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim() || cancelLoading) return;
    setCancelLoading(true);
    try {
      await cancelOrderAdmin(o.id, cancelReason.trim());
      saveOrder(o.id, {
        stage: "cancelled" as OrderStage,
      });
      setCancelModalOpen(false);
      toast.success(`Order #${o.orderNo} has been cancelled.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel order";
      toast.error(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <AdminShell>
      <PageHead
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span>#{o.orderNo}</span>
            <span>·</span>
            <span>{fmtDateTime(o.createdAt)}</span>
            <span>·</span>
            <span className="font-mono text-[0.62rem] text-muted-foreground inline-flex items-center gap-1">
              UUID: {o.id.slice(0, 8)}...
              <CopyButton text={o.id} title="Copy full Order UUID" />
            </span>
          </span>
        }
        title={stageMeta(o.stage, stages).label}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge tone={o.paymentStatus === "paid" || o.paymentStatus === "refunded" ? "ok" : o.paymentStatus === "refund_processing" ? "gold" : "review"}>
              {o.paymentStatus === "paid"
                ? "Paid"
                : o.paymentStatus === "refunded"
                  ? "Refunded"
                  : o.paymentStatus === "refund_processing"
                    ? "Refund Processing"
                    : o.paymentMethod === "cod"
                      ? "Pay on delivery"
                      : "Payment pending"}
            </StatusBadge>
            {o.isCustom ? <StatusBadge tone="gold">Customisation {o.requestNo}</StatusBadge> : null}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-medium ${
              o.deliveryType === "store_pickup"
                ? "border-violet-500/30 bg-violet-500/10 text-violet-600"
                : "border-blue-500/30 bg-blue-500/10 text-blue-600"
            }`}>
              {o.deliveryType === "store_pickup" ? (
                <><Store className="h-3 w-3" /> Store Pickup</>
              ) : (
                <><Truck className="h-3 w-3" /> Doorstep Delivery</>
              )}
            </span>
            <span className="text-xs">{stageMeta(o.stage, stages).hint}</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {!isCancelled && o.stage !== "delivered" ? (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-card px-4 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" /> Cancel Order
              </button>
            ) : null}
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        }
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <ProductGallery images={o.items.map((i) => i.image)} alt={o.items[0]?.name ?? "Order"} />
        </div>

        <div className="space-y-6">
          <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Customer</h2>
            <p className="text-sm font-medium">{o.customerName}</p>
            <a
              href={`tel:${o.customerPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 text-sm text-primary"
            >
              <Phone className="h-4 w-4" /> {o.customerPhone}
            </a>
            {o.deliveryType === "store_pickup" ? (
              <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                <Store className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Store pickup — Gandhipuram, Coimbatore</span>
              </p>
            ) : (
              <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {o.address.line1}
                  {o.address.landmark ? <>, near {o.address.landmark}</> : null}, {o.address.city},{" "}
                  {o.address.state} — {o.address.pincode}
                  {o.address.type ? (
                    <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[0.62rem] font-medium capitalize">
                      {o.address.type}
                    </span>
                  ) : null}
                </span>
              </p>
            )}
            {o.customerNotes ? (
              <p className="flex items-start gap-1.5 rounded-2xl bg-secondary p-3 text-sm">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {o.customerNotes}
              </p>
            ) : null}
          </section>

          <PaymentCard order={o} />

          {/* Blue Dart Tracking & Pickup — only for doorstep orders that have been shipped */}
          {isDoorstep && isShippedOrBeyond && o.shipment ? (
            <BlueDartCard
              orderId={o.id}
              shipment={o.shipment}
              onUpdateShipment={(updated) =>
                saveOrder(o.id, { shipment: { ...o.shipment, ...updated } })
              }
            />
          ) : null}

          <section className="space-y-2 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Items</h2>
            {o.items.map((it, i) => (
              <div key={`${it.name}-${i}`} className="flex items-center gap-3">
                <img src={it.image} alt="" className="h-16 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size {it.size} · {it.colour} · Qty {it.qty}
                  </p>
                </div>
                <span className="text-sm font-semibold">{inr(it.unitPrice * it.qty)}</span>
              </div>
            ))}
            <div className="rounded-2xl bg-secondary p-4 text-sm">
              <Row label="Subtotal" value={inr(o.subtotal)} />
              <Row label={`GST (${storeSettings.gstPercent}%)`} value={inr(o.gstAmount)} />
              <Row label="Delivery" value={o.deliveryFee ? inr(o.deliveryFee) : "Free"} />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="font-medium">Total</span>
                <span className="font-display text-xl font-semibold text-primary">
                  {inr(o.total)}
                </span>
              </div>
            </div>
          </section>

          <ProgressSection
            order={o}
            stages={stages}
            current={current}
            next={next}
            isReadyToShip={isReadyToShip}
            onAdvance={advance}
            stageLoading={stageLoading}
          />
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground">Cancel Order #{o.orderNo}</h3>
            <p className="text-xs text-muted-foreground">
              Please enter the reason for cancelling this order. This will cancel any active BlueDart shipment and update the status.
            </p>
            <textarea
              id="cancelReason"
              name="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation before dispatch"
              rows={3}
              className="w-full rounded-2xl border border-border bg-background p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelLoading}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelLoading || !cancelReason.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground shadow-soft disabled:opacity-50"
              >
                {cancelLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cancelling…
                  </>
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

/** Enlarged, copyable payment details */
function PaymentCard({ order: o }: { order: AdminOrder }) {
  const { saveOrder } = useAdmin();
  const [refundLoading, setRefundLoading] = useState(false);

  const razorpayOrderId = (o as any).razorpay_order_id || (o as any).razorpayOrderId;

  const handleInitiateRefund = async () => {
    if (refundLoading) return;
    setRefundLoading(true);
    try {
      await initiateRefundAdmin(o.id, "Admin-initiated refund");
      saveOrder(o.id, { paymentStatus: "refund_processing" });
      toast.success(`Refund initiated for Order #${o.orderNo}. Status set to refund processing pending webhook confirmation.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to initiate refund";
      toast.error(msg);
    } finally {
      setRefundLoading(false);
    }
  };

  const canRefund = o.paymentMethod === "razorpay" && (o.stage === "cancelled" || o.paymentStatus === "paid") && o.paymentStatus !== "refunded" && o.paymentStatus !== "refund_processing";

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Payment</h2>
        {canRefund ? (
          <button
            type="button"
            onClick={handleInitiateRefund}
            disabled={refundLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            {refundLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Initiate Refund
          </button>
        ) : null}
      </div>
      <Row
        label="Method"
        value={o.paymentMethod === "razorpay" ? "Razorpay" : "Cash on delivery"}
      />
      <Row label="Status" value={o.paymentStatus} />

      {razorpayOrderId ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-medium tracking-[0.1em] text-muted-foreground uppercase">
              Razorpay Order ID
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold tracking-wide text-foreground truncate">
              {razorpayOrderId}
            </p>
          </div>
          <CopyButton text={razorpayOrderId} title="Copy Razorpay Order ID" />
        </div>
      ) : null}

      {o.paymentRef ? (
        <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
          <CreditCard className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-medium tracking-[0.1em] text-muted-foreground uppercase">
              Razorpay Reference
            </p>
            <p className="mt-0.5 font-mono text-base font-semibold tracking-wide text-foreground">
              {o.paymentRef}
            </p>
            {o.paymentAttemptedAt ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fmtDateTime(o.paymentAttemptedAt)}
              </p>
            ) : null}
          </div>
          <CopyButton text={o.paymentRef} title="Copy Razorpay Payment Reference" />
        </div>
      ) : null}
    </section>
  );
}

/** Blue Dart tracking & pickup management card */
function BlueDartCard({
  orderId,
  shipment,
  onUpdateShipment,
}: {
  orderId: string;
  shipment: NonNullable<AdminOrder["shipment"]> & {
    pickup_token?: string;
    pickup_date?: string;
    pickup_time?: string;
    pickup_registration_status?: string;
  };
  onUpdateShipment: (updated: any) => void;
}) {
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [scansOpen, setScansOpen] = useState(false);
  const [scans, setScans] = useState<LiveScanEvent[]>([]);
  const [scansLoading, setScansLoading] = useState(false);

  const isRegistered = shipment.pickup_registration_status === "registered" && Boolean(shipment.pickup_token);
  const isCancelled = shipment.pickup_registration_status === "cancelled";
  const hasAwb = Boolean(shipment.awb);

  const toggleScans = async () => {
    if (!scansOpen && scans.length === 0) {
      setScansLoading(true);
      try {
        const rows = await fetchShipmentScansAdmin(orderId);
        setScans(rows);
      } catch (err) {
        toast.error("Failed to load live shipment scans");
      } finally {
        setScansLoading(false);
      }
    }
    setScansOpen(!scansOpen);
  };

  return (
    <section className="space-y-3 rounded-3xl border border-blue-500/25 bg-blue-500/5 p-5 shadow-soft">
      <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
        <Truck className="h-5 w-5 text-blue-600" /> Blue Dart Shipment & Pickup
      </h2>
      <div className="rounded-2xl bg-card p-4 space-y-2">
        <Row label="Courier Partner" value={shipment.partner} />
        <div className="flex items-center justify-between text-xs py-0.5">
          <span className="text-muted-foreground">AWB Number</span>
          <span className="font-mono font-semibold text-foreground inline-flex items-center gap-1.5">
            {shipment.awb || "Not generated"}
            {shipment.awb ? <CopyButton text={shipment.awb} title="Copy AWB Number" /> : null}
          </span>
        </div>
        {shipment.handedOverAt ? (
          <Row label="Handed Over" value={fmtDateTime(shipment.handedOverAt)} />
        ) : null}
      </div>

      {/* Pickup Registration Status & Action Card */}
      <div className="rounded-2xl bg-card p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Courier Pickup Status</span>
        </p>

        {isRegistered ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Check className="h-4 w-4 text-emerald-600" /> Pickup Scheduled
              </span>
              <span className="font-mono text-[0.7rem] bg-emerald-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                Token #{shipment.pickup_token}
                {shipment.pickup_token ? <CopyButton text={shipment.pickup_token} title="Copy Pickup Token" /> : null}
              </span>
            </div>
            {shipment.pickup_date ? (
              <p className="text-emerald-700 text-[0.72rem]">
                Scheduled for {shipment.pickup_date} {shipment.pickup_time ? `at ${shipment.pickup_time}` : ""}
              </p>
            ) : null}

            <div className="pt-1.5 flex justify-end border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold text-red-600 hover:bg-red-50 transition shadow-2xs"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel Scheduled Pickup
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {isCancelled ? (
              <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>Previous pickup was cancelled. You can schedule a fresh pickup below.</span>
              </div>
            ) : null}

            {hasAwb ? (
              <button
                type="button"
                onClick={() => setPickupModalOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition-colors hover:bg-amber-700"
              >
                <Truck className="h-4 w-4" /> Schedule Blue Dart Pickup
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-not-allowed"
                >
                  <Truck className="h-4 w-4" /> Schedule Blue Dart Pickup
                </button>
                <p className="text-[0.68rem] text-muted-foreground text-center">
                  Generate a Blue Dart Waybill (AWB) first before scheduling pickup.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Courier Scans Collapsible Drawer */}
      {hasAwb ? (
        <div className="rounded-2xl border border-blue-500/20 bg-card p-3">
          <button
            type="button"
            onClick={toggleScans}
            className="inline-flex w-full items-center justify-between text-xs font-semibold text-foreground"
          >
            <span className="inline-flex items-center gap-2 text-blue-700">
              <Truck className="h-4 w-4 text-blue-600" /> Live Courier Scans ({scans.length})
            </span>
            <span className="text-[0.7rem] text-blue-600 font-medium">
              {scansLoading ? "Loading..." : scansOpen ? "Hide Scans" : "View Scans"}
            </span>
          </button>

          {scansOpen ? (
            <div className="mt-3 space-y-2 border-t border-border pt-3 animate-in fade-in duration-200">
              {scansLoading ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Fetching live Blue Dart scan logs...
                </div>
              ) : scans.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {scans.map((s, idx) => (
                    <div key={idx} className="rounded-xl bg-secondary/50 p-2.5 text-[0.72rem] space-y-0.5 border border-border/40">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-foreground">{s.status}</span>
                        <span className="text-[0.65rem] text-muted-foreground font-mono">{fmtDateTime(s.at)}</span>
                      </div>
                      {s.detail ? <p className="text-muted-foreground">{s.detail}</p> : null}
                      {s.location ? <p className="text-blue-600 font-medium text-[0.65rem]">{s.location}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  No scan events recorded yet by Blue Dart hub.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {shipment.trackingUrl ? (
        <a
          href={shipment.trackingUrl}
          target="_blank"
          rel="noopener font-semibold"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-blue-700"
        >
          <ExternalLink className="h-4 w-4" /> Check Delivery Status on Blue Dart
        </a>
      ) : null}

      {/* Pickup Registration Modal */}
      <ShipmentPickupModal
        isOpen={pickupModalOpen}
        onClose={() => setPickupModalOpen(false)}
        orderId={orderId}
        awb={shipment.awb}
        onSuccess={onUpdateShipment}
      />

      {/* Pickup Cancellation Modal */}
      <ShipmentPickupCancelModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        orderId={orderId}
        pickupToken={shipment.pickup_token || ""}
        pickupDate={shipment.pickup_date}
        onSuccess={onUpdateShipment}
      />
    </section>
  );
}

/** Progress stepper with Blue Dart backend shipment creation */
function ProgressSection({
  order: o,
  stages,
  current,
  next,
  isReadyToShip,
  onAdvance,
  stageLoading = false,
}: {
  order: AdminOrder;
  stages: { id: OrderStage; label: string; hint: string; adminControlled: boolean }[];
  current: number;
  next: (typeof stages)[number] | undefined;
  isReadyToShip: boolean;
  onAdvance: (awb?: string) => void;
  stageLoading?: boolean;
}) {
  const { saveOrder } = useAdmin();
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);

  /**
   * Calls backend to create Blue Dart shipment.
   * Backend generates AWB — nothing sent from frontend.
   * spec §9, §24: never fake success, never send AWB from admin UI.
   */
  const handleCreateShipment = async () => {
    if (shipmentLoading) return; // prevent double-click
    setShipmentLoading(true);
    setShipmentError(null);
    try {
      const result = await enterShipment(o.id);
      // Update local store with backend-generated shipment data
      saveOrder(o.id, {
        stage: "shipped" as OrderStage,
        shipment: {
          partner: result.courier ?? "Blue Dart",
          awb: result.awb,
          trackingUrl: result.trackingUrl,
          handedOverAt: new Date().toISOString(),
        },
      });
      toast.success(`Shipment created. AWB: ${result.awb}. Customer now sees \"Handed to Delivery Partner\".`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Shipment creation failed. Please try again.";
      setShipmentError(msg);
      toast.error(msg);
    } finally {
      setShipmentLoading(false);
    }
  };

  const handleAdvance = () => {
    if (isReadyToShip) {
      void handleCreateShipment();
    } else {
      onAdvance();
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-lg font-semibold">Progress shown to the customer</h2>
      <ol className="space-y-2">
        {stages.map((s, i) => {
          const done = i <= current;
          return (
            <li
              key={s.id}
              className={`flex items-start gap-3 rounded-2xl border p-3 ${
                done ? "border-primary/30 bg-secondary" : "border-border"
              }`}
            >
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.65rem] ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {s.label}
                  {!s.adminControlled ? (
                    <span className="inline-flex items-center gap-1 text-[0.62rem] text-muted-foreground">
                      <Lock className="h-3 w-3" /> delivery partner
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs text-muted-foreground">{s.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Blue Dart backend shipment — no AWB input; backend generates (spec §9) */}
      {isReadyToShip ? (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-semibold text-blue-600">
              Create Blue Dart Shipment
            </p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                o.paymentMethod === "cod"
                  ? "border border-amber-300 bg-amber-100 text-amber-800"
                  : "border border-emerald-300 bg-emerald-100 text-emerald-800"
              }`}
            >
              {o.paymentMethod === "cod"
                ? `Mode: Cash on Delivery (Collect ${inr(o.total)})`
                : "Mode: Prepaid (Collect ₹0)"}
            </span>
          </div>
          <p className="text-[0.68rem] text-muted-foreground">
            Clicking below calls Blue Dart from the backend and generates an AWB number automatically.
            The order will be marked as "Handed to Delivery Partner" only after Blue Dart confirms.
          </p>
          {shipmentError ? (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {shipmentError}
            </p>
          ) : null}
        </div>
      ) : null}

      {next && next.adminControlled ? (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={shipmentLoading || stageLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          {shipmentLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Blue Dart shipment…
            </>
          ) : stageLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating stage…
            </>
          ) : (
            isReadyToShip ? "Create Shipment & Mark as Handed Over" : `Mark as "${next.label}"`
          )}
        </button>
      ) : (
        <p className="rounded-2xl bg-muted p-3 text-center text-xs text-muted-foreground">
          {next
            ? "Handover done \u2014 the delivery partner updates the remaining stages."
            : "This order is complete."}
        </p>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
