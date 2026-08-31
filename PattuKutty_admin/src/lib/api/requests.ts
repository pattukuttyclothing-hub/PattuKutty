import { apiFetch } from "./client";
import type { CustomRequest } from "@/lib/admin-store";

export interface SubmitQuotePayload {
  name: string;
  size: string;
  price: number;
  gstAmount: number;
  deliveryFee: number;
  readyBy: string;
  isEdit?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function mapRawRequestToCustomRequest(raw: any): CustomRequest {
  if (!raw || typeof raw !== "object") return raw;

  const customerName = raw.customer?.full_name || raw.customer_name || raw.customerName || "";
  
  const phoneMatch = raw.fabric_notes ? raw.fabric_notes.match(/\[Contact Phone\]:\s*([^\n]+)/) : null;
  const contactPhoneFromNotes = phoneMatch ? phoneMatch[1].trim() : null;

  const customerPhone =
    contactPhoneFromNotes ||
    raw.customer?.phone ||
    raw.customer_phone ||
    raw.customerPhone ||
    raw.phone ||
    "";

  // Extract colour from fabric_notes or colour relation
  const colourMatch = raw.fabric_notes ? raw.fabric_notes.match(/\[Colour\]:\s*([^\n]+)/) : null;
  const colour =
    (typeof raw.colour === "string" ? raw.colour : raw.colour?.name || raw.colour_detail?.name) ||
    (colourMatch ? colourMatch[1].trim() : "");

  // Category & Subcategory resolution (prioritize slug, then object name, then string/id)
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
    "designer-blouses";

  const categoryName = raw.category?.name || raw.category_name;
  const subCategoryName = raw.sub_category?.name || raw.sub_category_name;

  const rawImages = raw.reference_image_urls ?? raw.referenceImages;
  let referenceImages: string[] = Array.isArray(rawImages)
    ? rawImages.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];

  if (referenceImages.length === 0 && raw.custom_colour_image_url) {
    referenceImages = [raw.custom_colour_image_url];
  }

  const resObj: CustomRequest = {
    id: raw.id,
    requestNo: raw.request_no || raw.requestNo || "CR-0000",
    customerName,
    customerPhone,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    category: categorySlug,
    sub: subSlug,
    referenceImages,
    colour,
    fabricNotes: raw.fabric_notes || raw.fabricNotes || "",
    size: raw.size || "Standard",
    qty: Number(raw.qty || 1),
    timeline: raw.timeline_id || raw.timeline || "3-day",
    fulfilment: raw.fulfilment || "doorstep",
    status: raw.status || "submitted",
    ...(categoryName ? { categoryName } : {}),
    ...(subCategoryName ? { subCategoryName } : {}),
    ...(raw.custom_colour_image_url || raw.customColourImage ? { customColourImage: raw.custom_colour_image_url || raw.customColourImage } : {}),
    ...(raw.voice_note_url || raw.voiceNote ? { voiceNote: raw.voice_note_url || raw.voiceNote } : {}),
    ...(raw.cancel_reason || raw.cancelReason ? { cancelReason: raw.cancel_reason || raw.cancelReason } : {}),
    ...(raw.cancelled_at || raw.cancelledAt ? { cancelledAt: raw.cancelled_at || raw.cancelledAt } : {}),
    ...(raw.update_requested_at || raw.updateRequestedAt ? { updateRequestedAt: raw.update_requested_at || raw.updateRequestedAt } : {}),
    ...(raw.update_request_note || raw.updateRequestNote ? { updateRequestNote: raw.update_request_note || raw.updateRequestNote } : {}),
    ...(() => {
      const um = raw.fabric_notes ? raw.fabric_notes.match(/\[Admin Update Reason\]:\s*([^\n]+)/) : null;
      const ur = raw.update_reason || raw.updateReason || (um ? um[1].trim() : undefined);
      return ur ? { updateReason: ur } : {};
    })(),
    ...(() => {
      const sm = raw.fabric_notes ? raw.fabric_notes.match(/\[Source Product ID\]:\s*([^\n]+)/) : null;
      const sp = raw.source_product_id || raw.sourceProductId || (sm ? sm[1].trim() : undefined);
      return sp ? { sourceProductId: sp } : {};
    })(),
    ...(raw.quote
      ? {
          quote: {
            name: raw.quote.name,
            size: raw.quote.size || raw.size,
            price: Number(raw.quote.price || 0),
            gstAmount: Number(raw.quote.gst_amount ?? raw.quote.gstAmount ?? 0),
            deliveryFee: Number(raw.quote.delivery_fee ?? raw.quote.deliveryFee ?? 0),
            totalPayable: Number(raw.quote.total_payable ?? raw.quote.totalPayable ?? 0),
            readyBy: raw.quote.ready_by || raw.quote.readyBy || new Date().toISOString(),
            quotedAt: raw.quote.quoted_at || raw.quote.quotedAt || new Date().toISOString(),
          },
        }
      : {}),
  };

  return resObj;
}

export async function fetchCustomRequests(status?: string): Promise<CustomRequest[]> {
  const queryStr = status ? `?status=${status}` : "";
  const res = await apiFetch<ApiResponse<CustomRequest[]> | CustomRequest[]>(`/admin/requests${queryStr}`);
  const rawList = Array.isArray(res) ? res : (res.data ?? []);
  return rawList.map(mapRawRequestToCustomRequest);
}

export async function fetchCustomRequestById(id: string): Promise<CustomRequest> {
  const res = await apiFetch<ApiResponse<CustomRequest> | CustomRequest>(`/admin/requests/${id}`);
  const raw = "data" in res && res.data ? res.data : (res as CustomRequest);
  return mapRawRequestToCustomRequest(raw);
}

export interface QuoteResponse {
  success: boolean;
  data: CustomRequest;
  whatsapp?: {
    sent: boolean;
    error?: string;
    normalizedPhone?: string;
    mediaIncluded?: boolean;
    waLink?: string | undefined;
  };
}

export async function submitCustomQuote(requestId: string, payload: SubmitQuotePayload): Promise<QuoteResponse> {
  return apiFetch<QuoteResponse>(`/admin/requests/${requestId}/quote`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function notifyWhatsAppQuote(requestId: string): Promise<{ success: boolean; whatsapp: any }> {
  return apiFetch<{ success: boolean; whatsapp: any }>(`/admin/requests/${requestId}/notify-whatsapp`, {
    method: "POST",
  });
}

export async function cancelCustomRequestAdmin(requestId: string, reason: string): Promise<QuoteResponse> {
  return apiFetch<QuoteResponse>(`/admin/requests/${requestId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function convertRequestToOrder(requestId: string, deliveryType: "doorstep" | "store_pickup"): Promise<{ orderId: string; orderNo: string }> {
  return apiFetch<{ orderId: string; orderNo: string }>(`/admin/requests/${requestId}/convert`, {
    method: "POST",
    body: JSON.stringify({ deliveryType }),
  });
}
