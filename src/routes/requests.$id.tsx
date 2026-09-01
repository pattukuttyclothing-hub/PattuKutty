import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, ShoppingBag, XCircle, Edit3, Sparkles, Mic } from "lucide-react";
import { PageShell, PageHeader } from "@/components/shared/Page";
import { StatusBadge, RotatedStampBadge } from "@/components/shared/Badge";
import { ConfirmDialog, InfoTip } from "@/components/shared/Dialogs";
import { ProductGallery } from "@/components/shared/ProductGallery";
import {
  fulfilmentById,
  gstSplit,
  isRequestPaid,
  requestLabels,
  requestTypeLabel,
  requestWaLink,
  useRequests,
} from "@/lib/requests";
import { fmtDateTime } from "@/lib/persist";
import { inr, useCart } from "@/lib/cart";
import { timelineById } from "@/data/boutique";
import { fmtDate } from "@/lib/tracking";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({
    meta: [
      { title: "Custom Design Request — Pattu Kutty" },
      {
        name: "description",
        content:
          "Review your custom design request and place the order once our studio accepts it.",
      },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Custom Design Request — Pattu Kutty" },
      {
        property: "og:description",
        content:
          "Track and manage your custom stitching request with Pattu Kutty, Coimbatore.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ params }) => ({ id: params.id }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useLoaderData() as { id: string };
  const { find, cancel, rerequest, requestUpdate, acceptQuotation, refreshRequests } = useRequests();
  const navigate = useNavigate();
  const { add } = useCart();
  const req = find(id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateNoteText, setUpdateNoteText] = useState("");
  const [cancelResultModal, setCancelResultModal] = useState<{
    open: boolean;
    type: "success" | "failure";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    void refreshRequests();
  }, [refreshRequests]);

  if (!req) {
    return (
      <PageShell>
        <PageHeader
          title="Request not found"
          compact
          crumbs={[{ label: "My Design Requests", to: "/requests" }]}
        />
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">
          This request is no longer available.{" "}
          <Link to="/requests" className="font-medium text-primary">
            Back to my requests
          </Link>
        </div>
      </PageShell>
    );
  }

  const meta = requestLabels[req.status];
  const isQuotedOrAccepted = req.status === "quoted" || req.status === "accepted";
  const cancelled = req.status === "cancelled";
  const paid = isRequestPaid(req);
  const underReview = req.status === "under-review";
  const fulfil = fulfilmentById(req.fulfilment);

  // Quote pricing computation
  const rawPrice = req.quote?.price ?? req.quote?.prices?.[req.timeline] ?? 0;
  const split = gstSplit(rawPrice);
  const deliveryFee = req.quote?.deliveryFee ?? (fulfil.id === "doorstep" ? 49 : 0);
  const totalPayable = req.quote?.totalPayable ?? (rawPrice + split.gst + deliveryFee);

  const handleConfirmCancel = async () => {
    if (!reason.trim() || reason.trim().length < 3) return;
    try {
      await cancel(req.id, reason.trim());
      setCancelOpen(false);
      setReason("");
      void refreshRequests();
      setCancelResultModal({
        open: true,
        type: "success",
        title: "Order Cancelled Successfully",
        message: "The design request has been cancelled in database.",
      });
    } catch (err: any) {
      setCancelOpen(false);
      setCancelResultModal({
        open: true,
        type: "failure",
        title: "Unable to Cancel Request",
        message: String(err?.message || "Your request could not be cancelled. Please try again."),
      });
    }
  };

  const handleConfirmUpdate = async () => {
    if (!updateNoteText.trim() || updateNoteText.trim().length < 3) return;
    try {
      await requestUpdate(req.id, {}, updateNoteText.trim());
      setUpdateOpen(false);
      setUpdateNoteText("");
      void refreshRequests();
      setCancelResultModal({
        open: true,
        type: "success",
        title: "Modification Request Submitted",
        message: "Your modification notes have been saved in database and sent to our design studio.",
      });
    } catch (err: any) {
      setUpdateOpen(false);
      setCancelResultModal({
        open: true,
        type: "failure",
        title: "Unable to Submit Modification",
        message: String(err?.message || "Could not submit modification note. Please try again."),
      });
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={`Custom Request · Submitted ${fmtDateTime(req.createdAt)}`}
        title={req.quote?.name ?? requestTypeLabel(req)}
        compact
        crumbs={[{ label: "My Design Requests", to: "/requests" }, { label: "Request Detail" }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            {paid ? (
              <Link
                {...({ to: req.orderId ? "/orders/$id" : "/orders", ...(req.orderId ? { params: { id: req.orderId } } : {}) } as any)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
              >
                View order
              </Link>
            ) : null}
            {!cancelled ? (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-card px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel Request
              </button>
            ) : null}
          </div>
        }
      />

      <section className="relative bg-background py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
          {/* TOP UNIFIED STATUS BANNER */}
          {isQuotedOrAccepted || cancelled ? (
            <div className={`relative overflow-hidden rounded-3xl border-2 p-5 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
              cancelled
                ? "border-rose-500/40 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-card"
                : "border-pink-500/40 bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-card"
            }`}>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <RotatedStampBadge
                  status={cancelled ? "cancelled" : req.updateReason ? "quotation-updated" : req.status}
                  label={
                    cancelled
                      ? "CANCELLED"
                      : req.updateReason
                        ? "QUOTATION UPDATED"
                        : req.status === "accepted"
                          ? "QUOTATION PAID"
                          : "QUOTATION RECEIVED"
                  }
                />
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {cancelled
                      ? "This Custom Request is Cancelled"
                      : req.status === "accepted"
                        ? "Payment Received — Order Confirmed"
                        : "Quotation Received from Studio"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cancelled
                      ? `Reason: ${req.cancelReason || "No reason specified."} (${req.cancelledBy === 'admin' ? 'Cancelled by Admin' : 'Cancelled by You'})`
                      : "Review the price breakdown and specification below to confirm your order."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className={`grid gap-8 lg:grid-cols-2 lg:gap-12 transition-all ${
            isQuotedOrAccepted || cancelled
              ? "backdrop-blur-md bg-card/60 p-6 rounded-3xl border-2 border-accent/30 shadow-2xl opacity-90 select-none"
              : ""
          }`}>
            {/* -------- left: your references -------- */}
            <div className="relative space-y-4">
              {req.sourceProductId ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between shadow-soft">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <span className="text-[0.65rem] font-bold tracking-[0.14em] text-primary uppercase block">Product Customization</span>
                      <p className="text-xs text-foreground font-semibold">Customized from boutique product ID: <code className="text-primary font-mono">{req.sourceProductId}</code></p>
                    </div>
                  </div>
                </div>
              ) : null}
              <ProductGallery
                images={req.images.filter(Boolean)}
                alt="Your uploaded design"
              />
              {!isQuotedOrAccepted ? (
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-blush/25" />
              ) : null}
            </div>

            {/* -------- right: specs + status + actions -------- */}
            <div className="space-y-4">
              {isQuotedOrAccepted && req.quote ? (
                <div className="rounded-3xl border border-primary/25 bg-blush p-5 shadow-soft space-y-3">
                  <div className="flex justify-center sm:justify-start">
                    <RotatedStampBadge
                      status={req.updateReason ? "quotation-updated" : req.status}
                      label={req.updateReason ? "QUOTATION UPDATED" : req.status === "accepted" ? "QUOTATION PAID" : "QUOTATION RECEIVED"}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                        Quoted Price & Breakdown
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-primary">{inr(totalPayable)}</p>
                    </div>
                    <StatusBadge tone="gold">
                      {req.quote.readyBy
                        ? `Ready by ${fmtDate(req.quote.readyBy)}`
                        : `${timelineById(req.timeline).label} stitching`}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-primary/15 pt-3 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <span>Stitching price</span>
                      <InfoTip text={`Base price for stitching.`} />
                      <span className="ml-auto font-medium">{inr(rawPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <span>GST (5%)</span>
                      <InfoTip text={`GST calculation split.`} />
                      <span className="ml-auto font-medium">{inr(req.quote.gstAmount ?? split.gst)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <span>Delivery charge ({fulfil.label})</span>
                      <InfoTip
                        text={
                          deliveryFee === 0
                            ? "Store pickup selected — no delivery charge."
                            : `Doorstep delivery charge is ${inr(deliveryFee)}.`
                        }
                      />
                      <span className="ml-auto font-medium">
                        {deliveryFee === 0 ? "Free" : inr(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-primary/15 pt-2 font-semibold text-primary text-base">
                      <span>Total payable</span>
                      <span>{inr(totalPayable)}</span>
                    </div>
                  </div>

                  {req.quote.readyBy ? (
                    <p className="mt-3 text-xs font-medium text-primary">
                      Confirmed handover date from our studio: <strong>{fmtDate(req.quote.readyBy)}</strong>
                    </p>
                  ) : null}
                </div>
              ) : null}
                {cancelled ? (
                    <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-card p-6 shadow-xl backdrop-blur-md space-y-4 text-center sm:text-left">
                      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between border-b border-rose-500/20 pb-4 gap-4">
                        <RotatedStampBadge status="cancelled" label="CANCELLED" />
                        <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-4 py-1.5 text-xs font-bold text-rose-700">
                          {req.cancelledBy ? `Cancelled by ${req.cancelledBy === 'admin' ? 'Admin' : 'You'}` : 'Cancelled'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cancelled on {fmtDateTime(req.cancelledAt ?? req.createdAt)}.
                      </p>
                      {req.cancelReason ? (
                        <div className="space-y-1.5 pt-1 text-left">
                          <p className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Cancellation Reason</p>
                          <p className="text-sm font-medium text-foreground bg-card/90 p-4 rounded-2xl border border-rose-500/30 shadow-xs">
                            {req.cancelReason}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : !isQuotedOrAccepted ? (
                    <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft space-y-4">
                      <div className="flex justify-center">
                        <RotatedStampBadge status="under-review" label="UNDER REVIEW" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Our designer is reviewing your request and will share a confirmed quotation shortly.
                      </p>
                    </div>
                  ) : null}

              {(() => {
                const rawNotes = req.description || (req as any).fabricNotes || "";
                const phoneMatch = rawNotes.match(/\[Contact Phone\]:\s*([^\n]+)/);
                const phoneVal = (req as any).phone || (req as any).customerPhone || (phoneMatch ? phoneMatch[1].trim() : "");

                const cleanNotes = rawNotes
                  .replace(/\[Colour\]:\s*[^\n]+/gi, "")
                  .replace(/\[Measurements\]:\s*[^\n]+/gi, "")
                  .replace(/\[Contact Phone\]:\s*[^\n]+/gi, "")
                  .trim();

                const combined = `${req.size || ""} ${rawNotes || ""}`;
                const measurements: { label: string; value: string }[] = [];
                const seen = new Set<string>();

                const patterns = [
                  /([a-zA-Z_\s]{2,25})\s*[:=-]\s*([0-9.]+(?:"|in|inch|cm)?)/g,
                  /([a-zA-Z_\s]{2,25})\s*\(\s*([0-9.]+(?:"|in|inch|cm)?)\s*\)/g,
                ];

                for (const regex of patterns) {
                  for (const match of combined.matchAll(regex)) {
                    if (!match[1] || !match[2]) continue;
                    const rawKey = match[1].trim().toLowerCase();
                    const val = match[2].trim();
                    if (["colour", "color", "contact phone", "phone", "status", "size", "type", "quantity", "qty"].includes(rawKey)) continue;

                    const formattedKey = rawKey
                      .replace(/_/g, " ")
                      .split(" ")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ");

                    if (!seen.has(formattedKey)) {
                      seen.add(formattedKey);
                      measurements.push({ label: formattedKey, value: val.endsWith('"') ? val : `${val}"` });
                    }
                  }
                }

                return (
                  <div className="space-y-4">
                    <dl className="divide-y divide-border/60 rounded-3xl border border-border bg-card p-5 text-sm">
                      {[
                        ["Type", requestTypeLabel(req)],
                        [
                          "Colour",
                          <div key="col" className="flex items-center gap-3">
                            <span>{req.colour}</span>
                            {req.colourImage ? (
                              <a
                                href={req.colourImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary p-1 pr-2.5 text-xs font-semibold text-primary hover:border-primary"
                              >
                                <img loading="lazy" src={req.colourImage} alt="Custom colour photo" className="h-7 w-7 rounded-lg object-cover" />
                                Photo
                              </a>
                            ) : null}
                          </div>,
                        ],
                        ["Size", req.size === "Custom" ? "Custom measurements" : `Size ${req.size}`],
                        ["Quantity", `${req.qty} ${req.qty > 1 ? "pieces" : "piece"}`],
                        ["Stitching time", `Ready in ${timelineById(req.timeline).label.toLowerCase()}`],
                        ["Delivery", `${fulfil.label} — ${deliveryFee === 0 ? "no delivery charge" : inr(deliveryFee)}`],
                        ["Phone", phoneVal],
                        ["Details", cleanNotes || "Custom design stitching request."],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex gap-4 py-2.5">
                          <dt className="w-28 shrink-0 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                            {k}
                          </dt>
                          <dd className="text-foreground">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    {req.updateReason ? (
                      <div className="rounded-3xl border border-amber-300/80 bg-amber-500/10 p-5 space-y-1 text-left">
                        <span className="block text-[0.65rem] font-bold tracking-[0.12em] text-amber-800 dark:text-amber-300 uppercase">
                          Edited by Admin
                        </span>
                        <p className="text-sm font-medium text-amber-950 dark:text-amber-200 leading-relaxed">
                          {req.updateReason}
                        </p>
                      </div>
                    ) : null}

                    {measurements.length > 0 ? (
                      <div className="rounded-3xl border border-pink-200/80 bg-pink-50/80 p-5 space-y-2.5 shadow-xs">
                        <p className="text-[0.68rem] tracking-[0.14em] text-pink-900 uppercase font-semibold">
                          Technical Size & Body Measurements
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          {measurements.map((m, idx) => (
                            <div key={idx} className="rounded-xl border border-pink-200 bg-pink-50 p-3 shadow-xs transition-colors hover:bg-pink-100 hover:border-pink-300 group cursor-default">
                              <span className="block text-[0.65rem] text-pink-700 uppercase font-semibold">{m.label}</span>
                              <span className="block text-sm font-bold text-pink-950 mt-0.5">{m.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              {req.updateNote ? (
                <div className="rounded-2xl border border-primary/20 bg-secondary p-4 text-xs">
                  <p className="font-semibold text-primary">Your Change Note:</p>
                  <p className="mt-1 text-foreground">{req.updateNote}</p>
                  <p className="mt-1 text-muted-foreground text-[0.65rem]">
                    Submitted {fmtDateTime(req.updateRequestedAt ?? req.createdAt)}
                  </p>
                </div>
              ) : null}

              {req.voiceNote ? (
                <div className="mt-3 rounded-2xl border border-border/80 bg-secondary/40 p-3 shadow-xs">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <Mic className="h-4 w-4 text-primary" /> Voice Note Recording
                  </span>
                  <audio src={req.voiceNote} controls preload="metadata" className="w-full h-10 outline-none rounded-lg" />
                </div>
              ) : null}

              {/* actions */}
              <div className="space-y-3 pt-1">
                {isQuotedOrAccepted ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await acceptQuotation(req.id);
                          add({
                            id: req.id,
                            customRequestId: req.id,
                            isCustom: true,
                            name: `${req.quote?.name ?? requestTypeLabel(req)} (Customised)`,
                            image: req.images[0] ?? "",
                            price: totalPayable,
                            size: req.size,
                            colour: req.colour,
                            qty: req.qty,
                          });
                          navigate({ to: "/checkout" });
                        } catch (err: any) {
                          setCancelResultModal({
                            open: true,
                            type: "failure",
                            title: "Quotation Acceptance Warning",
                            message: String(err?.message || "Could not accept studio quotation. Please try again."),
                          });
                        }
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
                    >
                      <ShoppingBag className="h-4 w-4" /> Accept Quotation & Pay {inr(totalPayable)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpdateOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-card py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      <Edit3 className="h-4 w-4" /> Request Modification / Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-destructive/40 bg-card py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" /> Cancel request
                    </button>
                  </>
                ) : cancelled ? (
                  <button
                    type="button"
                    onClick={() => rerequest(req.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground"
                  >
                    Re-request this design
                  </button>
                ) : null}

                {underReview ? (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setUpdateOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-card py-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      <Edit3 className="h-4 w-4" /> Request Modification / Changes
                    </button>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <a
                        href={requestWaLink(req)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        <MessageCircle className="h-4 w-4" /> Contact Studio on WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => setCancelOpen(true)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive/40 bg-card py-3.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <XCircle className="h-4 w-4" /> Cancel request
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* modification confirm dialog */}
      <ConfirmDialog
        open={updateOpen}
        tone="primary"
        title="Request Design Modification"
        message="Describe the changes or adjustments you'd like our studio designer to make."
        confirmLabel="Submit Modification"
        cancelLabel="Cancel"
        disabled={updateNoteText.trim().length < 3}
        onClose={() => setUpdateOpen(false)}
        onConfirm={handleConfirmUpdate}
      >
        <textarea
          id="updateNoteText"
          name="updateNoteText"
          value={updateNoteText}
          onChange={(e) => setUpdateNoteText(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Details of required modifications (e.g. adjust sleeve length, change neck pattern)..."
          className="mt-3 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
        />
      </ConfirmDialog>

      {/* cancel confirm with reason */}
      <ConfirmDialog
        open={cancelOpen}
        tone="danger"
        title="Cancel this design request?"
        message="Tell us why so our designer can help better — you can always re-request it later."
        confirmLabel="Cancel request"
        cancelLabel="Keep it"
        disabled={reason.trim().length < 3}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleConfirmCancel}
      >
        <textarea
          id="cancelReasonText"
          name="cancelReasonText"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Reason for cancellation"
          className="mt-3 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
        />
      </ConfirmDialog>

      {/* Customer Cancellation Result Modal */}
      {cancelResultModal?.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center">
            <h3 className={`font-display text-xl font-semibold ${cancelResultModal.type === "success" ? "text-emerald-600" : "text-destructive"}`}>
              {cancelResultModal.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{cancelResultModal.message}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCancelResultModal(null)}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
