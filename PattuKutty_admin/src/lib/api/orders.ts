import { apiFetch } from "./client";
import type { AdminOrder, OrderStage } from "@/lib/admin-store";

export interface BlueDartShipmentResult {
  alreadyExists: boolean;
  awb: string;
  courier: string;
  trackingUrl: string;
  message: string;
  shipment?: Record<string, unknown>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function mapRawOrder(o: any): AdminOrder {
  if (!o) return o;
  const items = Array.isArray(o.items)
    ? o.items.map((i: any) => ({
        name: i.product_name_snapshot || i.name || "Custom Piece",
        size: i.size_snapshot || i.size || "M",
        colour: i.colour_snapshot || i.colour || "Design Colour",
        unitPrice: i.unit_price ?? i.unitPrice ?? 0,
        qty: i.qty ?? 1,
        image: i.image_url_snapshot || i.image || "",
      }))
    : [];

  return {
    id: o.id,
    orderNo: o.order_no || o.orderNo || `OR-${String(o.id).slice(0, 6)}`,
    createdAt: o.created_at || o.createdAt || new Date().toISOString(),
    customerName: o.customer_name || o.customerName || "Customer",
    customerPhone: o.customer_phone || o.customerPhone || "",
    address: o.address || {
      line1: o.line1 || "",
      landmark: o.landmark || "",
      city: o.city || "Coimbatore",
      state: o.state || "Tamil Nadu",
      pincode: o.pincode || "",
    },
    customerNotes: typeof o.customer_notes === "string" ? o.customer_notes : o.customerNotes || "",
    items,
    subtotal: o.subtotal ?? 0,
    gstAmount: o.gst_amount ?? o.gstAmount ?? 0,
    deliveryFee: o.delivery_fee ?? o.deliveryFee ?? 0,
    total: o.total ?? 0,
    paymentMethod: o.payment_method || o.paymentMethod || "cod",
    paymentStatus: o.payment_status || o.paymentStatus || "pending",
    paymentRef: o.payment_ref || o.paymentRef || o.razorpay_payment_id || undefined,
    paymentAttemptedAt: o.payment_attempted_at || o.paymentAttemptedAt || undefined,
    shipment: o.shipment || undefined,
    stage: o.stage || "placed",
    deliveryType: o.fulfilment_type === "store_pickup" || o.deliveryType === "store_pickup" ? "store_pickup" : "doorstep",
    isCustom: Boolean(o.is_custom || o.isCustom),
    requestNo: o.request_no || o.requestNo || undefined,
  };
}

export interface FetchOrdersResult {
  orders: AdminOrder[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchOrders(filters?: {
  stage?: string | undefined;
  deliveryType?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}): Promise<FetchOrdersResult> {
  const params = new URLSearchParams();
  if (filters?.stage && filters.stage !== "all") params.append("stage", filters.stage);
  if (filters?.deliveryType && filters.deliveryType !== "all") params.append("delivery_type", filters.deliveryType);
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.offset) params.append("offset", String(filters.offset));

  const queryStr = params.toString();
  const res = await apiFetch<any>(`/admin/orders${queryStr ? `?${queryStr}` : ""}`);

  if (res && res.data && Array.isArray(res.data.orders)) {
    return {
      orders: res.data.orders.map(mapRawOrder),
      total: res.data.total ?? res.data.orders.length,
      limit: res.data.limit ?? 20,
      offset: res.data.offset ?? 0,
    };
  }

  const list = Array.isArray(res) ? res : (res?.data || []);
  const mapped = Array.isArray(list) ? list.map(mapRawOrder) : [];
  return { orders: mapped, total: mapped.length, limit: mapped.length || 20, offset: 0 };
}

export async function fetchOrderById(id: string): Promise<AdminOrder> {
  const res = await apiFetch<ApiResponse<AdminOrder> | AdminOrder>(`/admin/orders/${id}`);
  const raw = "data" in res && res.data ? res.data : (res as AdminOrder);
  return mapRawOrder(raw);
}

export async function updateOrderStage(id: string, stage: OrderStage): Promise<AdminOrder> {
  const res = await apiFetch<any>(`/admin/orders/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stage }),
  });
  return mapRawOrder(res && res.data ? res.data : res);
}

/**
 * Creates a Blue Dart shipment via backend.
 * No AWB in request body — backend calls Blue Dart and returns the generated AWB.
 * spec §9: backend-only, credentials never exposed to frontend.
 */
export async function enterShipment(orderId: string): Promise<BlueDartShipmentResult> {
  return apiFetch<BlueDartShipmentResult>(`/admin/orders/${orderId}/shipments`, {
    method: "POST",
    body: JSON.stringify({}), // no payload — backend generates AWB
  });
}

/**
 * Admin order cancellation.
 * spec §50: admin can cancel at any stage; backend handles three-case logic.
 */
export async function cancelOrderAdmin(orderId: string, reason?: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/admin/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "Cancelled by admin" }),
  });
}

/**
 * Admin refund initiation / retry.
 * spec §53: used for post-RTO refunds or failed refund retries.
 */
export async function initiateRefundAdmin(orderId: string, reason?: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/admin/orders/${orderId}/refund`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "Admin-initiated refund" }),
  });
}

export interface RegisterPickupParams {
  pickupDate?: string;
  pickupTime?: string;
}

export interface BlueDartPickupResult {
  success: boolean;
  pickupToken?: string;
  shipment?: Record<string, unknown>;
  message?: string;
}

/**
 * Registers a Blue Dart courier pickup for an existing shipment.
 */
export async function registerPickupAdmin(orderId: string, params?: RegisterPickupParams): Promise<BlueDartPickupResult> {
  const res = await apiFetch<any>(`/admin/orders/${orderId}/shipments/pickup`, {
    method: "POST",
    body: JSON.stringify(params || {}),
  });
  if (res && res.data) {
    return res.data;
  }
  return res;
}

export interface BlueDartCancelPickupResult {
  success: boolean;
  cancelled: boolean;
  shipment?: Record<string, unknown>;
  message?: string;
}

/**
 * Cancels a previously registered Blue Dart courier pickup.
 */
export async function cancelPickupAdmin(orderId: string, reason?: string): Promise<BlueDartCancelPickupResult> {
  const res = await apiFetch<any>(`/admin/orders/${orderId}/shipments/cancel-pickup`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  if (res && res.data) {
    return res.data;
  }
  return res;
}

export interface BlueDartHealthResult {
  status: "active" | "error";
  mode: string;
  tokenAgeMinutes?: number;
  message?: string;
}

/**
 * Queries Blue Dart API health and token status on backend.
 */
export async function fetchBlueDartHealthAdmin(): Promise<BlueDartHealthResult> {
  const res = await apiFetch<any>(`/admin/bluedart/health`);
  if (res && res.data) {
    return res.data;
  }
  return res || { status: "error", mode: "sandbox", message: "Health check unavailable" };
}

export interface LiveScanEvent {
  status: string;
  location: string;
  detail: string;
  at: string;
}

/**
 * Queries live Blue Dart tracking scan logs for an order.
 */
export async function fetchShipmentScansAdmin(orderId: string): Promise<LiveScanEvent[]> {
  const res = await apiFetch<any>(`/admin/orders/${orderId}/shipments`);
  const data = res && res.data ? res.data : res;
  return Array.isArray(data?.scans) ? data.scans : Array.isArray(data) ? data : [];
}
