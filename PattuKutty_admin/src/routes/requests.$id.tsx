import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, Mic, Phone, Truck, Store, PackageCheck, XCircle, Check, Edit3, Lock, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { ProductGallery } from "@/components/shared/ProductGallery";
import { StatusBadge, RotatedStampBadge } from "@/components/shared/Badge";
import { colourHex, findCategory, storeSettings, subName, timelineById, waLink } from "@/data/boutique";
import { useAdmin, gstOf, requestStatusLabel } from "@/lib/admin-store";
import { fmtDate, fmtDateTime, inr } from "@/lib/format";
import { statusTone } from "./requests.index";

export const Route = createFileRoute("/requests/$id")({
  head: () => ({
    meta: [
      { title: "Request detail — Pattu Kutty Admin" },
      {
        name: "description",
        content:
          "Review a customer's custom design specification and send back a GST-split price quotation.",
      },
      { property: "og:title", content: "Request detail — Pattu Kutty Admin" },
      {
        property: "og:description",
        content: "Customer specification, voice note and quotation builder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const { findRequest, saveRequest } = useAdmin();
  const navigate = useNavigate();
  const r = findRequest(id);

  const [name, setName] = useState(r?.quote?.name ?? "");
  const [price, setPrice] = useState<number>(r?.quote?.price ?? 0);
  const [readyBy, setReadyBy] = useState(
    (r?.quote?.readyBy ?? new Date(Date.now() + 2 * 86_400_000).toISOString()).slice(0, 10),
  );
  const [deliveryFee, setDeliveryFee] = useState<number>(
    r?.quote?.deliveryFee ?? (r?.fulfilment === "doorstep" ? storeSettings.deliveryFee : 0),
  );
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [retryingWa, setRetryingWa] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [quoteModal, setQuoteModal] = useState<{
    open: boolean;
    type: "success" | "partial" | "failure";
    title: string;
    message: string;
    waLink?: string | undefined;
  } | null>(null);

  const [editDesignModalOpen, setEditDesignModalOpen] = useState(false);
  const [editSize, setEditSize] = useState(r?.size ?? "Standard");
  const [editQty, setEditQty] = useState(r?.qty ?? 1);
  const [editColour, setEditColour] = useState(r?.colour ?? "");
  const [editNotes, setEditNotes] = useState(r?.fabricNotes ?? "");
  const [updateReason, setUpdateReason] = useState(r?.updateReason ?? "");

  if (!r) {
    return (
      <AdminShell>
        <PageHead title="Request not found" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Link to="/requests" className="text-sm text-primary underline">
            Back to requests
          </Link>
        </div>
      </AdminShell>
    );
  }

  const isUuid = (val?: string) => !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  const catObj = findCategory(r.category);
  const catLabel =
    (r.categoryName && !isUuid(r.categoryName) ? r.categoryName : catObj?.name) ||
    (isUuid(r.category) ? "Custom Design" : r.category || "Custom Design");

  const rawSubName = r.subCategoryName || subName(r.sub || "");
  const subLabel = rawSubName && !isUuid(rawSubName) ? rawSubName : (isUuid(r.sub) ? "" : r.sub || "");

  const categoryTitle = !subLabel || subLabel.toLowerCase() === catLabel.toLowerCase() ? catLabel : `${catLabel} — ${subLabel}`;
  const requestDisplayName = r.quote?.name ?? categoryTitle;

  const gst = gstOf(price);
  const total = price + gst + deliveryFee;
  const isPickup = r.fulfilment === "pickup";

  const handleSaveDesign = async () => {
    try {
      const { updateCustomRequestDesignAdmin } = await import("@/lib/api/requests");
      const res = await updateCustomRequestDesignAdmin(r.id, {
        size: editSize,
        qty: editQty,
        colour: editColour,
        fabricNotes: editNotes,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || "Failed to update design specification on server.");
      }

      saveRequest(r.id, {
        size: editSize,
        qty: editQty,
        colour: editColour,
        fabricNotes: editNotes,
      });
      setEditDesignModalOpen(false);
      setQuoteModal({
        open: true,
        type: "success",
        title: "Design Updated Successfully",
        message: "The design specification and sizing measurements have been updated in database.",
      });
    } catch (err: any) {
      setQuoteModal({
        open: true,
        type: "failure",
        title: "Design Update Error",
        message: String(err?.message || "Could not update design specification. Please try again."),
      });
    }
  };

  const handleSendQuote = async () => {
    if (!name.trim()) {
      setQuoteModal({
        open: true,
        type: "failure",
        title: "Name Required",
        message: "Please give this custom design a name before sending a quotation.",
      });
      return;
    }
    if (price <= 0) {
      setQuoteModal({
        open: true,
        type: "failure",
        title: "Invalid Price",
        message: "Please enter a valid stitching price greater than ₹0.",
      });
      return;
    }

    const isEditMode = Boolean(r.quote);

    if (isEditMode && !updateReason.trim()) {
      setQuoteModal({
        open: true,
        type: "failure",
        title: "Modification Reason Required",
        message: "Please enter a reason for modifying this design specification and quotation.",
      });
      return;
    }

    setSubmittingQuote(true);
    try {
      const { submitCustomQuote } = await import("@/lib/api/requests");
      const res = await submitCustomQuote(r.id, {
        name: name.trim(),
        size: r.size,
        price,
        gstAmount: gst,
        deliveryFee,
        readyBy: new Date(readyBy).toISOString(),
        isEdit: isEditMode,
        ...(isEditMode && updateReason.trim() ? { updateReason: updateReason.trim() } : {}),
      });

      let updatedFabricNotes = r.fabricNotes || "";
      if (isEditMode && updateReason.trim()) {
        const cleanNotes = updatedFabricNotes.replace(/\[Admin Update Reason\]:\s*[^\n]+/gi, "").trim();
        updatedFabricNotes = `${cleanNotes}\n[Admin Update Reason]: ${updateReason.trim()}`;
      }

      // Update local state with saved quote
      saveRequest(r.id, {
        status: "quoted",
        fabricNotes: updatedFabricNotes,
        ...(updateReason.trim() ? { updateReason: updateReason.trim() } : {}),
        quote: {
          name: name.trim(),
          size: r.size,
          price,
          gstAmount: gst,
          deliveryFee,
          totalPayable: total,
          readyBy: new Date(readyBy).toISOString(),
          quotedAt: new Date().toISOString(),
        },
      });

      setIsEditingQuote(false);

      const cleanPhone = (r.customerPhone || "").replace(/[^0-9]/g, "");
      const primaryImg = (r.referenceImages && r.referenceImages[0]) || "";
      const imgText = primaryImg && primaryImg.startsWith("http") ? `\n\n📷 *Design Reference Photo*:\n${primaryImg}` : "";
      const fallbackWaText = `*Pattu Kutty — Quotation for ${r.requestNo || "CR"}*\n\nHello ${r.customerName},\nOur designer has reviewed your design specification and prepared a quotation:\n\n📌 *Design Name*: ${name.trim()}\n✂️ *Stitching Price*: ₹${price.toLocaleString("en-IN")}\n🧾 *GST (5%)*: ₹${gst.toLocaleString("en-IN")}\n🚚 *Delivery*: ${deliveryFee === 0 ? "Store Pickup (Free)" : `₹${deliveryFee} (Doorstep Delivery)`}\n💰 *Total Payable*: ₹${total.toLocaleString("en-IN")}\n📅 *Handover Ready By*: ${fmtDate(readyBy)}${imgText}\n\nPlease review and confirm your order at Pattu Kutty. ✨`;
      const fallbackWaUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fallbackWaText)}` : undefined;
      const waLinkToUse = res?.whatsapp?.waLink || fallbackWaUrl;

      if (res?.whatsapp?.sent) {
        setQuoteModal({
          open: true,
          type: "success",
          title: isEditMode ? "Quotation Updated Successfully" : "Quotation Sent Successfully",
          message: isEditMode
            ? "Quotation updated successfully, and the customer was notified via WhatsApp."
            : "Quotation sent successfully, and the customer was notified via WhatsApp.",
          waLink: waLinkToUse,
        });
      } else {
        setQuoteModal({
          open: true,
          type: "partial",
          title: "Quotation Saved Successfully",
          message: "Quotation saved in database. Click 'Open WhatsApp Chat' below to send the pre-filled quotation with image preview directly to the customer.",
          waLink: waLinkToUse,
        });
      }
    } catch (err: any) {
      let rawMsg = String(err?.message || "Failed to create quotation.");
      if (rawMsg.includes("already been created") || rawMsg.includes("already")) {
        rawMsg = "A quotation has already been created for this request. Click 'Edit Quotation' to modify it.";
      } else if (rawMsg.includes("401") || rawMsg.includes("500") || rawMsg.includes("fetch failed") || rawMsg.includes("Network")) {
        rawMsg = "Could not save quotation due to a server connection error. Please try again.";
      }
      setQuoteModal({
        open: true,
        type: "failure",
        title: "Quotation Submission Warning",
        message: rawMsg,
      });
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleRetryWhatsApp = async () => {
    setRetryingWa(true);
    try {
      const { notifyWhatsAppQuote } = await import("@/lib/api/requests");
      const res = await notifyWhatsAppQuote(r.id);

      const cleanPhone = (r.customerPhone || "").replace(/[^0-9]/g, "");
      const primaryImg = (r.referenceImages && r.referenceImages[0]) || "";
      const imgText = primaryImg && primaryImg.startsWith("http") ? `\n\n📷 *Design Reference Photo*:\n${primaryImg}` : "";
      const fallbackWaText = `*Pattu Kutty — Quotation for ${r.requestNo || "CR"}*\n\nHello ${r.customerName},\nOur designer has prepared a quotation for your design:\n\n📌 *Design Name*: ${r.quote?.name || requestDisplayName}\n💰 *Total Payable*: ₹${total.toLocaleString("en-IN")}\n📅 *Handover Ready By*: ${fmtDate(readyBy)}${imgText}\n\nPlease review and confirm your order. ✨`;
      const fallbackWaUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fallbackWaText)}` : undefined;
      const waLinkToUse = res?.whatsapp?.waLink || fallbackWaUrl;

      if (res?.whatsapp?.sent) {
        setQuoteModal({
          open: true,
          type: "success",
          title: "WhatsApp Notification Sent",
          message: "WhatsApp media notification re-sent successfully to the customer.",
          waLink: waLinkToUse,
        });
      } else {
        setQuoteModal({
          open: true,
          type: "partial",
          title: "WhatsApp Notification Ready",
          message: "Click 'Open WhatsApp Chat' below to open WhatsApp with pre-filled quotation text and design photo preview.",
          waLink: waLinkToUse,
        });
      }
    } catch (err: any) {
      setQuoteModal({
        open: true,
        type: "failure",
        title: "WhatsApp Retry Failed",
        message: "Could not send WhatsApp notification. Please check customer phone number and try again.",
      });
    } finally {
      setRetryingWa(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a reason for rejecting this request.");
      return;
    }

    try {
      const { cancelCustomRequestAdmin } = await import("@/lib/api/requests");
      const res = await cancelCustomRequestAdmin(r.id, rejectReason.trim());

      if (!res || (!res.success && res?.request?.status !== "cancelled")) {
        throw new Error(res?.message || "Failed to persist request cancellation on server.");
      }

      saveRequest(r.id, {
        status: "cancelled",
        cancelReason: rejectReason.trim(),
        cancelledBy: "admin",
        cancelledAt: new Date().toISOString(),
      });

      setCancelModalOpen(false);

      if (res?.whatsapp?.sent) {
        toast.success("Request cancelled successfully and WhatsApp media notification sent.");
      } else {
        toast.success("Request cancelled successfully in database.");
      }

      const cleanPhone = (r.customerPhone || "").replace(/[^0-9]/g, "");
      if (cleanPhone) {
        const waText = `Hello ${r.customerName},\n\nYour Custom Design Request (${r.requestNo || "CR"}) has been cancelled by Pattu Kutty.\n\nReason: ${rejectReason.trim()}\n\nNote: The reference design photo media has been dispatched directly to your WhatsApp inbox.\n\nThank you for choosing Pattu Kutty.`;
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, "_blank");
      }

      setTimeout(() => navigate({ to: "/requests" }), 1000);
    } catch (err: any) {
      toast.error(String(err?.message || "Failed to persist request cancellation. Please try again."));
    }
  };

  return (
    <AdminShell>
      <PageHead
        eyebrow={`${r.requestNo || "Custom Request"} · ${fmtDateTime(r.createdAt)}`}
        title={requestDisplayName}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge tone={statusTone[r.status]}>{requestStatusLabel[r.status]}</StatusBadge>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-[0.68rem] font-medium">
              {r.customerName}
            </span>
            <a
              href={`tel:${r.customerPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[0.68rem] font-medium transition-colors hover:border-primary hover:text-primary"
            >
              <Phone className="h-3 w-3" /> {r.customerPhone}
            </a>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {r.status !== "cancelled" ? (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-card px-4 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" /> Reject Request
              </button>
            ) : null}
            <Link
              to="/requests"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* TOP UNIFIED STATUS BANNER (Rendered when Quoted, Accepted, or Cancelled) */}
        {r.status === "quoted" || r.status === "accepted" || r.status === "cancelled" ? (
          <div className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
            r.status === "cancelled"
              ? "border-rose-500/40 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-card"
              : "border-pink-500/40 bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-card"
          }`}>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <RotatedStampBadge
                status={r.status === "cancelled" ? "cancelled" : r.updateReason ? "quotation-updated" : r.status}
                label={
                  r.status === "cancelled"
                    ? "CANCELLED"
                    : r.updateReason
                      ? "QUOTATION UPDATED"
                      : r.status === "accepted"
                        ? "QUOTATION ACCEPTED"
                        : "QUOTATION SENT"
                }
              />
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {r.status === "cancelled"
                    ? "This Custom Request is Cancelled"
                    : r.status === "accepted"
                      ? "Customer Accepted Confirmed Quotation"
                      : "Quotation Delivered to Customer"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.status === "cancelled"
                    ? `Reason: ${r.cancelReason || "No reason specified."} (${r.cancelledBy === 'admin' ? 'Cancelled by Admin' : 'Cancelled by Customer'})`
                    : "The request layout and quotation are frozen. Click edit to make modifications."}
                </p>
              </div>
            </div>

            {r.status !== "cancelled" ? (
              <div className="flex items-center gap-2">
                {!isEditingQuote ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (r.quote) {
                        setName(r.quote.name || requestDisplayName);
                        setPrice(r.quote.price || 0);
                        setDeliveryFee(r.quote.deliveryFee || 0);
                        setReadyBy((r.quote.readyBy || new Date().toISOString()).slice(0, 10));
                      }
                      setIsEditingQuote(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  >
                    <Edit3 className="h-4 w-4" /> Edit Request & Quotation
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingQuote(false)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary"
                  >
                    <Lock className="h-3.5 w-3.5" /> Lock & View Frozen Page
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* MAIN TWO-COLUMN GRID (Wrapped in Frosted Glass Blur Overlay when Frozen) */}
        <div className={`relative grid gap-8 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] transition-all ${
          r.status === "cancelled" || ((r.status === "quoted" || r.status === "accepted") && !isEditingQuote)
            ? "backdrop-blur-md bg-white/40 dark:bg-black/40 p-6 rounded-3xl border-2 border-pink-400/30 shadow-2xl opacity-90 pointer-events-none select-none"
            : ""
        }`}>
          {/* Left Column: Reference Images & Custom Colour Photo */}
          <div className="space-y-6">
            {r.sourceProductId ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between shadow-soft">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-[0.65rem] font-bold tracking-[0.14em] text-primary uppercase block">Product Customization Request</span>
                    <p className="text-xs text-foreground font-semibold">Customized from boutique product ID: <code className="text-primary font-mono">{r.sourceProductId}</code></p>
                  </div>
                </div>
              </div>
            ) : null}

            <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Reference Images</h2>
              <ProductGallery images={r.referenceImages} alt={`${r.requestNo || "Custom Request"} reference`} />
              {r.referenceImages && r.referenceImages.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {r.referenceImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageModal(imgUrl)}
                      className="group relative overflow-hidden rounded-xl border border-border transition-transform hover:scale-105"
                    >
                      <img src={imgUrl} alt={`Reference ${idx + 1}`} className="h-16 w-16 object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 text-[0.6rem] font-semibold text-white">
                        Enlarge
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <div className="attn-card flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span
                className="h-9 w-9 rounded-full border border-border shadow-inner"
                style={{ backgroundColor: colourHex(r.colour) }}
              />
              <div>
                <p className="text-xs text-muted-foreground">Colour requested</p>
                <p className="text-sm font-medium">{r.colour}</p>
              </div>
              {r.customColourImage ? (
                <button
                  type="button"
                  onClick={() => setActiveImageModal(r.customColourImage || null)}
                  className="ml-auto flex items-center gap-2 rounded-2xl border border-border p-1.5 pr-3 text-xs font-medium transition-colors hover:border-primary"
                >
                  <img
                    src={r.customColourImage}
                    alt="Custom colour reference uploaded by customer"
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                  Custom colour photo
                </button>
              ) : null}
            </div>

            {/* Fulfilment Business Rule Card */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-base font-semibold">Fulfilment Method</h2>
              <div className={`mt-3 flex items-start gap-3 rounded-2xl border p-4 ${isPickup ? "border-emerald-500/30 bg-emerald-500/5" : "border-blue-500/30 bg-blue-500/5"}`}>
                {isPickup ? <Store className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" /> : <Truck className="mt-0.5 h-5 w-5 text-blue-600 shrink-0" />}
                <div>
                  <p className="text-sm font-semibold">{isPickup ? "Store Pickup (In-Boutique)" : "Doorstep Delivery (Courier)"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isPickup
                      ? "Customer will collect the finished outfit directly from our Coimbatore boutique. No courier shipment required."
                      : "Outfit will be shipped to the customer's delivery address via BlueDart courier upon completion."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Complete Design Specification & Quotation Builder */}
          <div className="space-y-6">
            {r.updateRequestedAt ? (
              <section className="rounded-3xl border border-primary/30 bg-secondary p-5 shadow-soft">
                <p className="text-[0.7rem] font-semibold tracking-[0.1em] text-primary uppercase">
                  Change requested by customer · {fmtDateTime(r.updateRequestedAt)}
                </p>
                <p className="mt-1.5 text-sm font-medium">
                  {r.updateRequestNote ?? "The customer asked for a change to this design specification."}
                </p>
              </section>
            ) : null}

            {/* DEDICATED DESIGN SPECIFICATION SECTION */}
            <section className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="font-display text-lg font-semibold">Design Specification</h2>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                    {categoryTitle}
                  </span>
                </div>
              </div>

              {r.updateReason ? (
                <div className="rounded-2xl border border-amber-300/80 bg-amber-500/10 p-4 space-y-1 text-left">
                  <span className="block text-[0.65rem] font-bold tracking-[0.12em] text-amber-800 dark:text-amber-300 uppercase">
                    Edited by Admin
                  </span>
                  <p className="text-sm font-medium text-amber-950 dark:text-amber-200 leading-relaxed">
                    {r.updateReason}
                  </p>
                </div>
              ) : null}

            <div>
              <p className="text-[0.68rem] tracking-[0.12em] text-muted-foreground uppercase font-semibold">
                Customer Fabric & Design Notes
              </p>
              <p className="attn-card mt-1.5 rounded-2xl border border-border/40 bg-secondary/60 p-4 text-sm leading-relaxed text-foreground">
                {(() => {
                  const raw = r.fabricNotes || "";
                  const clean = raw
                    .replace(/\[Colour\]:\s*[^\n]+/gi, "")
                    .replace(/\[Measurements\]:\s*[^\n]+/gi, "")
                    .replace(/\[Contact Phone\]:\s*[^\n]+/gi, "")
                    .trim();
                  return clean || "No extra fabric notes provided.";
                })()}
              </p>
            </div>

            {r.voiceNote ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  <Mic className="h-4 w-4" /> Customer Voice Note
                </p>
                <audio controls preload="metadata" src={r.voiceNote} className="mt-2.5 w-full outline-none" />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Requested Size" value={r.size} />
              <Stat label="Quantity" value={`${r.qty} ${r.qty > 1 ? "pieces" : "piece"}`} />
              <Stat label="Stitching Time" value={timelineById(r.timeline).label} />
              <Stat
                label="Fulfilment"
                value={isPickup ? "Store pickup" : "Doorstep"}
                icon={isPickup ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
              />
            </div>

            {/* Structured Technical Measurements Display */}
            {(() => {
              const combined = `${r.size} ${r.fabricNotes || ""}`;
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

              if (measurements.length === 0) return null;

              return (
                <div className="rounded-2xl border border-pink-200/80 bg-pink-50/80 p-4 space-y-2.5 shadow-xs">
                  <p className="text-[0.68rem] tracking-[0.12em] text-pink-900 uppercase font-semibold">
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
              );
            })()}
          </section>

          {/* QUOTATION SECTION — Frozen Frosted Glass Read-Only Card when Quotation has been Sent */}
          {(() => {
            const hasQuote = Boolean(r.quote) || (r.status as string) === "quoted" || (r.status as string) === "accepted" || (r.status as string) === "ordered";
            const activeQuote = r.quote || {
              name: requestDisplayName,
              size: r.size,
              price: price || 0,
              gstAmount: gst || 0,
              deliveryFee: deliveryFee || 0,
              totalPayable: total || price || 0,
              readyBy: readyBy,
              quotedAt: r.createdAt,
            };

            if (r.status === "cancelled") {
              return null;
            }

            return (
              <section className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">
                    {hasQuote ? "Quotation Delivered to Customer" : "Quotation Builder"}
                  </h2>
                  {hasQuote ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3.5 py-1.5 rounded-full border border-emerald-500/30 shadow-sm">
                      <Check className="h-3.5 w-3.5" /> QUOTATION FROZEN & SENT
                    </span>
                  ) : null}
                </div>

                {/* Frosted Glass Read-Only Frozen Quotation Card */}
                {hasQuote && !isEditingQuote ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-3xl border-2 border-pink-400/40 bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-card p-6 shadow-xl backdrop-blur-md space-y-4">
                      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between border-b border-pink-500/20 pb-4 gap-3">
                        <RotatedStampBadge
                          status={r.status === "accepted" ? "accepted" : "quoted"}
                          label={r.status === "accepted" ? "QUOTATION ACCEPTED" : "QUOTATION SENT"}
                        />
                        <div className="text-right">
                          <h3 className="font-display text-base font-bold text-foreground">{activeQuote.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Size: <strong className="text-foreground">{activeQuote.size || r.size}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 bg-card/80 p-4 rounded-2xl border border-pink-500/20 backdrop-blur-sm text-sm">
                        <div className="space-y-1">
                          <span className="text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase font-semibold block">Stitching Charge</span>
                          <p className="text-base font-bold text-foreground">{inr(activeQuote.price)}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase font-semibold block">GST ({storeSettings.gstPercent}%)</span>
                          <p className="text-base font-bold text-foreground">{inr(activeQuote.gstAmount)}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase font-semibold block">Delivery Charge</span>
                          <p className="text-base font-bold text-foreground">{activeQuote.deliveryFee ? inr(activeQuote.deliveryFee) : "Free (Store Pickup)"}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl bg-pink-500/15 p-4 border border-pink-500/30 gap-3">
                        <div>
                          <span className="text-[0.65rem] font-bold tracking-[0.14em] text-pink-900 dark:text-pink-300 uppercase block">Total Payable</span>
                          <span className="font-display text-2xl font-extrabold text-primary">{inr(activeQuote.totalPayable)}</span>
                        </div>
                        <div className="text-right text-xs text-muted-foreground space-y-0.5">
                          <p>Quoted On: <strong className="text-foreground">{fmtDateTime(activeQuote.quotedAt)}</strong></p>
                          <p>Ready By: <strong className="text-foreground">{fmtDate(activeQuote.readyBy)}</strong></p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setName(activeQuote.name ?? "");
                          setPrice(activeQuote.price ?? 0);
                          setDeliveryFee(activeQuote.deliveryFee ?? 0);
                          setReadyBy((activeQuote.readyBy ?? new Date().toISOString()).slice(0, 10));
                          setIsEditingQuote(true);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
                      >
                    <Edit3 className="h-4 w-4" /> Edit Quotation
                  </button>

                  <button
                    type="button"
                    disabled={retryingWa}
                    onClick={handleRetryWhatsApp}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 text-emerald-600" /> {retryingWa ? "Re-sending WhatsApp..." : "Re-send WhatsApp Media"}
                  </button>
                </div>
              </div>
            ) : (
              /* Editable Form View (Creating new or Editing existing) */
              <div className="space-y-5">
                <label className="block space-y-2">
                  <span className="block text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Name this design for the customer
                  </span>
                  <input
                    id="quoteName"
                    name="quoteName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Peacock Zardosi Aari Blouse"
                    className="input"
                  />
                </label>

                {Boolean(r.quote) ? (
                  <label className="block space-y-2">
                    <span className="block text-[0.7rem] font-bold tracking-[0.1em] text-amber-800 dark:text-amber-300 uppercase">
                      Reason for modification (Visible to customer)
                    </span>
                    <input
                      id="quoteUpdateReason"
                      name="quoteUpdateReason"
                      value={updateReason}
                      onChange={(e) => setUpdateReason(e.target.value)}
                      placeholder="e.g. Updated sleeve length & fabric colour per customer request"
                      className="input border-amber-400/80 bg-amber-500/10 focus:border-amber-500"
                    />
                  </label>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="block text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                      Stitching Price
                    </span>
                    <span className="relative block">
                      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        ₹
                      </span>
                      <input
                        id="quotePrice"
                        name="quotePrice"
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        value={price || ""}
                        onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                        className="input pl-8"
                      />
                    </span>
                  </label>

                  <label className="block space-y-2">
                    <span className="block text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                      Delivery Charge ({isPickup ? "Store Pickup" : "Doorstep"})
                    </span>
                    <span className="relative block">
                      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        ₹
                      </span>
                      <input
                        id="quoteDeliveryFee"
                        name="quoteDeliveryFee"
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value)))}
                        className="input pl-8"
                      />
                    </span>
                  </label>

                  <label className="block space-y-2 sm:col-span-2">
                    <span className="block text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                      Ready By Date
                    </span>
                    <input
                      id="quoteReadyBy"
                      name="quoteReadyBy"
                      type="date"
                      value={readyBy}
                      onChange={(e) => setReadyBy(e.target.value)}
                      className="input"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-secondary p-5 text-sm">
                  <Row label="Stitching Price" value={inr(price)} />
                  <Row label={`GST (${storeSettings.gstPercent}%)`} value={inr(gst)} />
                  <Row
                    label={`Delivery Fee (${isPickup ? "store pickup" : "doorstep"})`}
                    value={deliveryFee ? inr(deliveryFee) : "Free (₹0)"}
                  />
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-semibold">
                    <span>Total Payable</span>
                    <span className="font-display text-xl font-semibold text-primary">{inr(total)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    disabled={submittingQuote}
                    onClick={handleSendQuote}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />{" "}
                    {submittingQuote
                      ? "Saving & Sending..."
                      : r.quote
                      ? "Update Quotation & Notify WhatsApp"
                      : "Send Quotation & Notify WhatsApp"}
                  </button>

                  {r.quote ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingQuote(false)}
                      className="rounded-full border border-border bg-card px-5 py-3.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                    >
                      Cancel Editing
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        );
      })()}

        </div>
      </div>
    </div>

      {/* Quotation Success / Partial Success / Failure Result Modal */}
      {quoteModal?.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center">
            <div
              className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
                quoteModal.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : quoteModal.type === "partial"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {quoteModal.type === "success" ? (
                <Check className="h-6 w-6" />
              ) : quoteModal.type === "partial" ? (
                <Send className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">{quoteModal.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{quoteModal.message}</p>
            <div className="pt-2 flex flex-col gap-2.5 sm:flex-row">
              {quoteModal.waLink ? (
                <a
                  href={quoteModal.waLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setQuoteModal(null)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.01]"
                >
                  <MessageCircle className="h-4 w-4" /> Open WhatsApp Chat
                </a>
              ) : null}
              {quoteModal.type === "partial" ? (
                <button
                  type="button"
                  onClick={async () => {
                    setQuoteModal(null);
                    await handleRetryWhatsApp();
                  }}
                  disabled={retryingWa}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {retryingWa ? "Retrying..." : "Retry Dispatch"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setQuoteModal(null)}
                className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Structured Edit Design & Measurement Editor Modal */}
      {editDesignModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-display text-lg font-semibold">Update Design Specification</h3>
              <button
                type="button"
                onClick={() => setEditDesignModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Outfit Size
                  </span>
                  <select
                    id="editSize"
                    name="editSize"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="input w-full"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Custom">Custom</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Quantity
                  </span>
                  <input
                    id="editQty"
                    name="editQty"
                    type="number"
                    min={1}
                    value={editQty}
                    onChange={(e) => setEditQty(Math.max(1, Number(e.target.value)))}
                    className="input w-full"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Requested Colour
                </span>
                <input
                  id="editColour"
                  name="editColour"
                  type="text"
                  value={editColour}
                  onChange={(e) => setEditColour(e.target.value)}
                  placeholder="e.g. Royal Blue"
                  className="input w-full"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Fabric & Design Notes / Sizing Measurements
                </span>
                <textarea
                  id="editNotes"
                  name="editNotes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Bust: 34, Waist: 28, Hip: 36, Length: 14. Extra lining required."
                  className="input w-full"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setEditDesignModalOpen(false)}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDesign}
                className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-soft"
              >
                Save Design Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Enlarged Image Lightbox Modal */}
      {activeImageModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-card p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black"
            >
              ✕
            </button>
            <img src={activeImageModal} alt="Enlarged design view" className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl" />
          </div>
        </div>
      ) : null}

      {/* Reject / Cancel Confirmation Modal */}
      {cancelModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-semibold text-destructive">Reject Custom Design Request</h3>
            <p className="text-sm text-muted-foreground">
              Please enter the reason for rejecting this request. This will update the status to cancelled and display the reason to the customer.
            </p>
            <textarea
              id="rejectReason"
              name="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Fabric specification unavailable or out of capacity"
              rows={3}
              className="input w-full"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectRequest}
                className="rounded-full bg-destructive px-5 py-2 text-xs font-semibold text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="attn-card cursor-default rounded-2xl border border-border bg-card p-4">
      <p className="text-[0.65rem] tracking-[0.1em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {value}
      </p>
    </div>
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
