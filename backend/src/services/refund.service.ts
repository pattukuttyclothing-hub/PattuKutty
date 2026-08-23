/**
 * Razorpay Refund Service
 *
 * SECURITY RULES (spec §37, §38, §40, §65):
 *   - Refund amount is calculated from DB — never trusted from frontend
 *   - Razorpay secret key only on backend
 *   - Idempotency key prevents duplicate refunds on network failure
 *   - Never marks payment_status = refunded until webhook confirms
 *   - Refund failure is persisted — not silently swallowed
 */

import { db } from "../config/db.js";
import { env } from "../config/env.js";

export type RefundStatus = "requested" | "processing" | "processed" | "failed" | "cancelled";

export interface RefundRecord {
  id: string;
  order_id: string;
  razorpay_payment_id: string | null;
  customer_id: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  provider: string;
  provider_refund_id: string | null;
  idempotency_key: string;
  requested_by: string | null;
  requested_at: string;
  processed_at: string | null;
  failure_code: string | null;
  failure_message: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Initiates a Razorpay refund for a captured payment.
 *
 * Spec §42, §44, §45:
 * - Creates refund record FIRST (so we never lose the intent even if Razorpay call fails)
 * - Then calls Razorpay
 * - On success: updates status to processing + stores provider_refund_id
 * - On failure: updates status to failed + stores failure info
 * - Never updates orders.payment_status — that is done by webhook (processRefundWebhook)
 *
 * Spec §71: idempotent — returns existing refund if one already exists for this order.
 */
export async function initiateRefund(params: {
  orderId: string;
  requestedBy: string | null;
  reason: string;
}): Promise<RefundRecord> {
  const { orderId, requestedBy, reason } = params;

  // 1. Load the authoritative order from DB
  const { data: order, error: orderErr } = await db
    .from("orders")
    .select("id, payment_method, payment_status, razorpay_payment_id, total, customer_id")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    throw new Error(`Order not found for refund: ${orderId}`);
  }

  // 2. Validate payment is refundable
  if (order.payment_method !== "razorpay") {
    // COD orders: no Razorpay refund (spec §43)
    throw new Error("No Razorpay refund required for COD orders.");
  }

  if (order.payment_status !== "paid") {
    throw new Error(
      `Order payment status is "${order.payment_status}". Refund only applies to paid orders.`
    );
  }

  if (!order.razorpay_payment_id) {
    throw new Error("Order has no Razorpay payment ID. Cannot initiate refund.");
  }

  // 3. Idempotency: check for existing refund record
  const { data: existingRefund } = await db
    .from("refunds")
    .select("*")
    .eq("order_id", orderId)
    .in("status", ["requested", "processing", "processed"])
    .maybeSingle();

  if (existingRefund) {
    // Return existing refund — do not create duplicate (spec §71)
    return existingRefund as RefundRecord;
  }

  // 4. Refund amount from DB — never from frontend (spec §38)
  // Business decision: refund full total (subtotal + GST + delivery fee)
  const amountInPaise = Number(order.total) * 100;
  if (!amountInPaise || amountInPaise <= 0) {
    throw new Error("Order has no refundable amount.");
  }

  // 5. Generate idempotency key — stable for this order (spec §40)
  const idempotencyKey = `refund_${orderId}`;

  // 6. Create refund record in REQUESTED state BEFORE calling Razorpay
  //    This ensures we never lose the intent even if Razorpay call fails
  const { data: refundRecord, error: refundInsertErr } = await db
    .from("refunds")
    .insert({
      order_id: orderId,
      razorpay_payment_id: order.razorpay_payment_id,
      customer_id: order.customer_id,
      amount: amountInPaise,
      currency: "INR",
      reason,
      status: "requested",
      provider: "razorpay",
      idempotency_key: idempotencyKey,
      requested_by: requestedBy,
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (refundInsertErr || !refundRecord) {
    throw refundInsertErr || new Error("Failed to create refund record.");
  }

  // 7. Call Razorpay refund API from backend (spec §37)
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // No Razorpay credentials — mark as failed for admin attention
    await db
      .from("refunds")
      .update({
        status: "failed",
        failure_code: "CONFIG_MISSING",
        failure_message: "Razorpay credentials not configured on backend.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", refundRecord.id);

    throw new Error("Payment gateway credentials not configured. Refund record created but not submitted.");
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

  let rzpRes: Response;
  try {
    rzpRes = await fetch(
      `https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          notes: { order_id: orderId, reason },
        }),
      }
    );
  } catch (networkErr) {
    // Network failure — record is in requested state so admin can retry
    await db
      .from("refunds")
      .update({
        status: "failed",
        failure_code: "NETWORK_ERROR",
        failure_message: String(networkErr),
        updated_at: new Date().toISOString(),
      })
      .eq("id", refundRecord.id);

    throw new Error(
      "Network error contacting Razorpay. Refund record saved — admin can retry. " +
      `Original error: ${String(networkErr)}`
    );
  }

  const rzpBody = (await rzpRes.json()) as {
    id?: string;
    status?: string;
    error?: { code?: string; description?: string };
  };

  if (!rzpRes.ok || rzpBody.error) {
    // Razorpay rejected the refund
    const failCode = rzpBody.error?.code ?? `HTTP_${rzpRes.status}`;
    const failMsg = rzpBody.error?.description ?? `Razorpay returned HTTP ${rzpRes.status}`;

    console.error("[Refund] Razorpay refund failed:", failCode, failMsg);

    const { data: failedRefund } = await db
      .from("refunds")
      .update({
        status: "failed",
        failure_code: failCode,
        failure_message: failMsg,
        metadata: rzpBody as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", refundRecord.id)
      .select()
      .single();

    // Spec §44: order cancellation state preserved; payment_status stays "paid"
    // Admin must see refund as failed and retry
    throw new Error(
      `Razorpay refund failed: ${failMsg}. ` +
      "Order is cancelled but refund requires admin attention."
    );

    return failedRefund as RefundRecord;
  }

  // 8. Razorpay accepted the refund — update to processing state
  //    Do NOT mark orders.payment_status = refunded yet (spec §42)
  //    That happens via webhook when Razorpay confirms processing
  const { data: processingRefund } = await db
    .from("refunds")
    .update({
      status: "processing",
      provider_refund_id: rzpBody.id ?? null,
      metadata: rzpBody as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq("id", refundRecord.id)
    .select()
    .single();

  return processingRefund as RefundRecord;
}

/**
 * Processes a Razorpay refund webhook event.
 *
 * Spec §41, §42:
 * - refund.processed  → status = processed, orders.payment_status = refunded
 * - refund.failed     → status = failed, orders.payment_status remains paid
 * - Idempotent: checks current status before updating
 */
export async function processRefundWebhook(payload: {
  event: string;
  providerRefundId: string;
  orderId?: string;
  failureCode?: string;
  failureReason?: string;
}): Promise<void> {
  const { event, providerRefundId, failureCode, failureReason } = payload;

  // Find the refund by provider_refund_id
  const { data: refund } = await db
    .from("refunds")
    .select("*")
    .eq("provider_refund_id", providerRefundId)
    .maybeSingle();

  if (!refund) {
    console.warn("[Refund Webhook] No refund record found for provider_refund_id:", providerRefundId);
    return;
  }

  // Idempotency: don't re-process
  if (refund.status === "processed" || refund.status === "cancelled") {
    return;
  }

  if (event === "refund.processed" || event === "refund.speed_changed") {
    await db
      .from("refunds")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", refund.id);

    // Now safe to mark orders.payment_status = refunded (spec §42)
    await db
      .from("orders")
      .update({
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", refund.order_id);

  } else if (event === "refund.failed") {
    await db
      .from("refunds")
      .update({
        status: "failed",
        failure_code: failureCode ?? "REFUND_FAILED",
        failure_message: failureReason ?? "Razorpay webhook reported refund failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", refund.id);
    // orders.payment_status stays "paid" — admin must investigate
  }
}

/**
 * Returns current refund status for an order.
 * Used by admin API to check refund state.
 */
export async function getRefundByOrder(orderId: string): Promise<RefundRecord | null> {
  const { data } = await db
    .from("refunds")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .maybeSingle();
  return (data as RefundRecord | null) ?? null;
}

/**
 * Retries a failed or pending refund for an order (spec §44).
 */
export async function retryRefundAdmin(orderId: string, adminId: string): Promise<RefundRecord> {
  const { data: refund } = await db
    .from("refunds")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!refund) {
    throw new Error("No refund record found for this order. Cannot retry.");
  }

  if (refund.status === "processed") {
    return refund as RefundRecord;
  }

  // Reset status to requested and re-invoke initiateRefund
  await db
    .from("refunds")
    .update({ status: "requested", failure_code: null, failure_message: null, updated_at: new Date().toISOString() })
    .eq("id", refund.id);

  return await initiateRefund({
    orderId,
    requestedBy: adminId,
    reason: refund.reason || "Admin retry failed refund",
  });
}
