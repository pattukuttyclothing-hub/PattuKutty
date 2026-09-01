import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { categories, deliveryRules, storeInfo, timelineById, waLink, type CategoryId, type TimelineId } from "@/data/boutique";
import { useAuth } from "./auth";
import { fetchCustomerRequests } from "./api/requests";

export type RequestStatus = "under-review" | "quoted" | "accepted" | "cancelled" | "ordered";

/** How the finished outfit reaches the customer. */
export type FulfilmentId = "pickup" | "doorstep";

export const GST_RATE = 0.05;

export const fulfilmentOptions: {
  id: FulfilmentId;
  label: string;
  note: string;
  fee: number;
}[] = [
  {
    id: "pickup",
    label: "Store Pickup",
    note: "Collect from our Coimbatore boutique. No delivery charge.",
    fee: 0,
  },
  {
    id: "doorstep",
    label: "Doorstep Delivery",
    note: "Courier-delivered to your address. A delivery charge applies.",
    fee: deliveryRules.fee,
  },
];

export const fulfilmentById = (id: FulfilmentId | undefined) =>
  fulfilmentOptions.find((f) => f.id === id) ?? fulfilmentOptions[0]!;

/** Base price + GST split for a confirmed quote amount (quote is GST-inclusive). */
export const gstSplit = (amount: number) => {
  const base = Math.round(amount / (1 + GST_RATE));
  return { base, gst: amount - base };
};

export type CustomRequestQuote = {
  name: string;
  size: string;
  price: number;
  gstAmount?: number | undefined;
  deliveryFee?: number | undefined;
  totalPayable?: number | undefined;
  prices?: Record<TimelineId, number> | undefined;
  readyBy?: string | undefined;
  quotedAt?: string | undefined;
};

export type CustomRequest = {
  id: string;
  createdAt: string;
  category: CategoryId;
  sub: string;
  categoryName?: string | undefined;
  subCategoryName?: string | undefined;
  images: string[];
  colour: string;
  colourImage?: string | undefined;
  description: string;
  voiceNote?: string | undefined;
  phone: string;
  qty: number;
  size: string;
  measurements?: Record<string, number | undefined> | undefined;
  timeline: TimelineId;
  status: RequestStatus;
  sourceProductId?: string | undefined;
  fulfilment?: FulfilmentId | undefined;
  updateRequestedAt?: string | undefined;
  updateNote?: string | undefined;
  updateReason?: string | undefined;
  cancelReason?: string | undefined;
  cancelledAt?: string | undefined;
  cancelledBy?: string | undefined;
  quote?: CustomRequestQuote | undefined;
  /** Linked order id once the customer has paid for the accepted quotation. */
  orderId?: string | undefined;
};

export type NewRequest = Omit<CustomRequest, "id" | "createdAt" | "status">;

type RequestsValue = {
  requests: CustomRequest[];
  count: number;
  openCount: number;
  loading: boolean;
  error: string | null;
  refreshRequests: () => Promise<void>;
  find: (id: string) => CustomRequest | undefined;
  create: (r: NewRequest) => Promise<CustomRequest>;
  update: (id: string, patch: Partial<CustomRequest>) => void;
  requestUpdate: (id: string, patch: Partial<CustomRequest>, note: string) => Promise<void>;
  acceptQuotation: (id: string) => Promise<void>;
  cancel: (id: string, reason: string) => Promise<void>;
  rerequest: (id: string) => void;
};

const Ctx = createContext<RequestsValue | null>(null);

export function mapBackendToCustomRequest(raw: any): CustomRequest {
  const rawStatus = String(raw.status || "").toLowerCase();
  const status: RequestStatus =
    rawStatus === "quoted"
      ? "quoted"
      : rawStatus === "accepted"
      ? "accepted"
      : rawStatus === "cancelled"
      ? "cancelled"
      : rawStatus === "ordered"
      ? "ordered"
      : "under-review";

  const categorySlug =
    raw.category?.slug ||
    raw.category_slug ||
    (typeof raw.category === "string" && !raw.category.includes("-") && raw.category.length > 20 ? undefined : raw.category) ||
    raw.category_id ||
    "blouses";

  const subSlug =
    raw.sub_category?.slug ||
    raw.sub_category_slug ||
    (typeof raw.sub === "string" && !raw.sub.includes("-") && raw.sub.length > 20 ? undefined : raw.sub) ||
    raw.sub_category_id ||
    "bridal-blouses";

  return {
    id: raw.id,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    category: categorySlug,
    sub: subSlug,
    categoryName: raw.category?.name || raw.category_name || raw.categoryName,
    subCategoryName: raw.sub_category?.name || raw.sub_category_name || raw.subCategoryName,
    images: Array.isArray(raw.reference_image_urls)
      ? raw.reference_image_urls
      : Array.isArray(raw.images)
      ? raw.images
      : [],
    colour: raw.colour || "",
    colourImage: raw.custom_colour_image_url || raw.colourImage,
    description: raw.fabric_notes || raw.description || "",
    voiceNote: raw.voice_note_url || raw.voiceNote,
    phone: (() => {
      const pm = (raw.fabric_notes || raw.description || "").match(/\[Contact Phone\]:\s*([^\n]+)/);
      return pm ? pm[1].trim() : (raw.phone || raw.customer?.phone || "");
    })(),
    qty: Number(raw.qty || 1),
    size: raw.size || "",
    timeline: raw.timeline_id || raw.timeline || "",
    status,
    fulfilment: raw.fulfilment === "doorstep" ? "doorstep" : "pickup",
    updateRequestedAt: raw.update_requested_at || raw.updateRequestedAt,
    updateNote: raw.update_request_note || raw.updateNote,
    updateReason: (() => {
      const um = (raw.fabric_notes || raw.description || "").match(/\[Admin Update Reason\]:\s*([^\n]+)/);
      return raw.update_reason || raw.updateReason || (um ? um[1].trim() : undefined);
    })(),
    sourceProductId: (() => {
      const sm = (raw.fabric_notes || raw.description || "").match(/\[Source Product ID\]:\s*([^\n]+)/);
      return raw.source_product_id || raw.sourceProductId || (sm ? sm[1].trim() : undefined);
    })(),
    orderId: raw.order_id || raw.orderId || raw.order?.id || undefined,
    cancelReason: raw.cancel_reason || raw.cancelReason,
    cancelledAt: raw.cancelled_at || raw.cancelledAt,
    quote: raw.quote
      ? {
          name: raw.quote.name || "Custom Design Quotation",
          size: raw.quote.size || raw.size || "",
          price: Number(raw.quote.price || 0),
          gstAmount: Number(raw.quote.gst_amount ?? raw.quote.gstAmount ?? 0),
          deliveryFee: Number(raw.quote.delivery_fee ?? raw.quote.deliveryFee ?? 0),
          totalPayable: Number(raw.quote.total_payable ?? raw.quote.totalPayable ?? 0),
          readyBy: raw.quote.ready_by || raw.quote.readyBy,
          quotedAt: raw.quote.quoted_at || raw.quote.quotedAt,
        }
      : undefined,
  };
}

export function RequestsProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomerRequests();
      const mapped = Array.isArray(data) ? data.map(mapBackendToCustomRequest) : [];
      setRequests(mapped);
    } catch (err: any) {
      console.warn("Error fetching customer requests:", err?.message);
      setError(err?.message || "Failed to load custom requests from server.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    void refreshRequests();
  }, [ready, user, refreshRequests]);

  const create = useCallback(
    async (r: NewRequest): Promise<CustomRequest> => {
      const cleanSize = (r.size || "").slice(0, 20);

      const { submitCustomRequest } = await import("./api/requests");
      const backendData = await submitCustomRequest({
        categoryId: r.category,
        subCategoryId: r.sub,
        colour: r.colour,
        customColourImageUrl: r.colourImage,
        fabricNotes: r.description,
        voiceNoteUrl: r.voiceNote,
        referenceImageUrls: r.images,
        size: cleanSize,
        measurements: r.measurements,
        qty: r.qty,
        timelineId: r.timeline,
        fulfilment: r.fulfilment,
        phone: r.phone,
      });

      if (!backendData || !backendData.id) {
        throw new Error("Server returned invalid custom request data.");
      }

      const created = mapBackendToCustomRequest(backendData);
      setRequests((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      return created;
    },
    [],
  );

  const update = useCallback(
    (id: string, patch: Partial<CustomRequest>) =>
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [],
  );

  const requestUpdate = useCallback(
    async (id: string, patch: Partial<CustomRequest>, note: string) => {
      const { requestChanges: apiRequestChanges } = await import("./api/requests");
      const res = await apiRequestChanges(id, note);
      if (!res) throw new Error("Failed to submit request modification to server.");
      update(id, { ...patch, updateNote: note, updateRequestedAt: new Date().toISOString() });
    },
    [update],
  );

  const acceptQuotation = useCallback(
    async (id: string) => {
      const { acceptQuotation: apiAccept } = await import("./api/requests");
      const res = await apiAccept(id);
      if (!res) throw new Error("Failed to accept studio quotation on server.");
      update(id, { status: "accepted" });
    },
    [update],
  );

  const cancel = useCallback(
    async (id: string, reason: string) => {
      const { cancelCustomRequest: apiCancel } = await import("./api/requests");
      const res = await apiCancel(id, reason);
      if (!res) throw new Error("Failed to cancel custom request on server.");
      update(id, { status: "cancelled", cancelReason: reason, cancelledAt: new Date().toISOString() });
    },
    [update],
  );

  const rerequest = useCallback(
    (id: string) =>
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const { cancelReason: _cr, cancelledAt: _ca, ...rest } = r;
          return { ...rest, status: "under-review", createdAt: new Date().toISOString() };
        }),
      ),
    [],
  );

  const value = useMemo<RequestsValue>(
    () => ({
      requests,
      count: requests.length,
      openCount: requests.filter((r) => r.status === "under-review" || r.status === "quoted" || r.status === "accepted").length,
      loading,
      error,
      refreshRequests,
      find: (id) => requests.find((r) => r.id === id),
      create,
      update,
      requestUpdate,
      acceptQuotation,
      cancel,
      rerequest,
    }),
    [requests, loading, error, refreshRequests, create, update, requestUpdate, cancel, rerequest],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRequests() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRequests must be used inside RequestsProvider");
  return ctx;
}

export const requestLabels: Record<RequestStatus, { label: string; tone: "review" | "ok" | "bad" | "info" | "gold" }> = {
  "under-review": { label: "Under Review", tone: "review" },
  quoted: { label: "Quotation Received", tone: "gold" },
  accepted: { label: "Paid", tone: "ok" },
  cancelled: { label: "Cancelled", tone: "bad" },
  ordered: { label: "Order Placed", tone: "info" },
};

const isUuidString = (val?: string) =>
  !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

/** A request is treated as paid once the studio quotation has been settled with a confirmed order. */
export const isRequestPaid = (r: Pick<CustomRequest, "status" | "orderId">) =>
  r.status === "ordered" || Boolean(r.orderId);

export const requestTypeLabel = (r: CustomRequest) => {
  // 1. If admin assigned a quote title/name, prioritize it
  if (r.quote?.name && r.quote.name.trim() && !r.quote.name.includes("Custom Design Quotation")) {
    return r.quote.name.trim();
  }

  // 2. If request was initiated from a sold-out product, extract the source product name
  const sourceNameMatch = (r.description || "").match(/\[Source Product Name\]:\s*([^\n]+)/);
  if (sourceNameMatch && sourceNameMatch[1]?.trim()) {
    return sourceNameMatch[1].trim();
  }

  const catObj = categories.find((c) => c.id === r.category);
  const subObj = catObj?.subs.find((s) => s.id === r.sub);

  const catName =
    (r.categoryName && !isUuidString(r.categoryName) ? r.categoryName : catObj?.name) ||
    (isUuidString(r.category) ? "Custom Design" : r.category || "Custom Design");

  const subNameStr =
    (r.subCategoryName && !isUuidString(r.subCategoryName) ? r.subCategoryName : subObj?.name) ||
    (isUuidString(r.sub) ? "" : r.sub || "");

  if (!subNameStr || subNameStr.toLowerCase() === catName.toLowerCase()) {
    return catName;
  }
  return `${catName} — ${subNameStr}`;
};

export function requestWaLink(r: CustomRequest, intent: "enquiry" | "update" = "enquiry") {
  const t = timelineById(r.timeline);
  const head =
    intent === "update"
      ? `Hi mam, I'd like to *update the specifications* of my custom design request (${requestTypeLabel(r)}).`
      : `Hi mam, I had requested this custom design with ${storeInfo.name}.`;

  const validImages = (r.images || []).filter(
    (img) => img && typeof img === "string" && img.startsWith("http")
  );

  const body = [
    head,
    "",
    `Design: ${requestTypeLabel(r)}`,
    `Colour: ${r.colour}`,
    `Size: ${r.size} | Qty: ${r.qty}`,
    `Needed in: ${t.label}`,
    `Details: ${r.description || "—"}`,
    r.updateNote ? `Update needed: ${r.updateNote}` : "",
    r.cancelReason ? `Cancellation reason: ${r.cancelReason}` : "",
    "",
    validImages.length > 0
      ? `📷 *Reference Photos*:\n${validImages.join("\n")}`
      : "I will share reference images here.",
  ]
    .filter(Boolean)
    .join("\n");
  return waLink(body);
}
