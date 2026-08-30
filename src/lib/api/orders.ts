import { apiFetch } from "./client";
import type { Order } from "@/lib/orders";

export interface AddressPayload {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | undefined;
  landmark?: string | undefined;
  city: string;
  state: string;
  pincode: string;
  addressType: "home" | "work" | "other";
  isDefault?: boolean | undefined;
}

export interface PlaceOrderPayload {
  addressId?: string | undefined;
  shipping?: Record<string, unknown> | undefined;
  deliveryType: "doorstep" | "store_pickup";
  paymentMethod: "razorpay" | "cod";
  razorpayOrderId?: string | undefined;
  razorpayPaymentId?: string | undefined;
  customerNotes?: string | undefined;
  idempotencyKey?: string | undefined;
  idempotency_key?: string | undefined;
  items: Array<{
    id?: string | undefined;
    productId?: string | undefined;
    variantId?: string | undefined;
    productName?: string | undefined;
    size: string;
    colour?: string | undefined;
    unitPrice?: number | undefined;
    qty: number;
    imageUrl?: string | undefined;
  }>;
}

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
  orderId?: string;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface TrackingData {
  shipped: boolean;
  carrier: string | null;
  awb: string | null;
  status: string;
  statusDescription: string;
  lastUpdated: string | null;
  stateCode: string;
  shipment: {
    id: string;
    courier: string;
    awb: string;
    trackingUrl: string;
    status: string;
    handedOverAt: string;
    expectedDate: string | null;
  } | null;
  scans: Array<{
    status: string;
    location: string;
    detail: string;
    at: string;
  }>;
}

export async function fetchCustomerOrders(): Promise<Order[]> {
  const res = await apiFetch<{ success: boolean; data: Order[] }>("/orders");
  return res.data || (res as unknown as Order[]);
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await apiFetch<{ success: boolean; data: Order }>(`/orders/${id}`);
  return res.data || (res as unknown as Order);
}

export async function fetchOrderTracking(id: string): Promise<TrackingData> {
  const res = await apiFetch<{ success: boolean; data: TrackingData }>(`/orders/${id}/tracking`);
  return res.data;
}

export async function placeCODOrder(payload: PlaceOrderPayload): Promise<Order> {
  const res = await apiFetch<{ success: boolean; data: Order }>("/orders/cod", {
    method: "POST",
    body: JSON.stringify({ ...payload, paymentMethod: "cod" }),
  });
  return res.data || (res as unknown as Order);
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<Order> {
  const res = await apiFetch<{ success: boolean; data: Order }>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data || (res as unknown as Order);
}

export async function createBackendPaymentOrder(payload: PlaceOrderPayload): Promise<RazorpayOrderResponse> {
  const res = await apiFetch<{ success: boolean; data: RazorpayOrderResponse }>("/payments/create-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function verifyBackendPayment(payload: VerifyPaymentPayload): Promise<Order> {
  const res = await apiFetch<{ success: boolean; data: Order }>("/payments/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function cancelBackendPaymentOrder(razorpayOrderId: string): Promise<void> {
  await apiFetch<{ success: boolean }>("/payments/cancel", {
    method: "POST",
    body: JSON.stringify({ razorpayOrderId }),
  });
}

export async function submitReview(orderId: string, productId: string, rating: number, title: string, comment: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/orders/${orderId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ productId, rating, title, comment }),
  });
}

/** Result of a customer cancellation request */
export interface CancellationResult {
  case: "before_shipment" | "waybill_not_handed_over" | "after_handover";
  orderId: string;
  orderStage: string;
  stockRestored: boolean;
  refundInitiated: boolean;
  refundId: string | null;
  blueDartCancelled: boolean | null;
  message: string;
  requiresAdminAction: boolean;
}

/**
 * Cancels a customer order via backend.
 * spec §52: authenticated, own-order verified server-side.
 * Returns case-specific result — frontend displays message from backend.
 */
export async function cancelOrder(orderId: string, reason: string): Promise<CancellationResult> {
  const res = await apiFetch<{ success: boolean; data: CancellationResult }>(
    `/orders/${orderId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  );
  return res.data;
}
