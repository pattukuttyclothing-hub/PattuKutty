/**
 * Order Cancellation Service
 *
 * Implements three distinct cancellation cases per spec §29–§33, §46–§48:
 *
 * Case A: Before shipment (placed/confirmed/packed, no shipment)
 *   → Cancel order, restore stock, initiate refund if prepaid
 *
 * Case B: Waybill created but not handed over
 *   → Attempt Blue Dart waybill cancellation, then Case A
 *
 * Case C: Already handed over / shipped
 *   → Record cancellation request ONLY
 *   → Do NOT restore stock (parcel physically with courier)
 *   → Create refund record in "requested" state but do NOT submit to Razorpay
 *   → Admin must handle RTO and manually trigger stock restoration and refund
 *
 * SPEC CRITICAL: spec §47 — do not blindly restore stock while parcel is with courier.
 *
 * IDEMPOTENCY (spec §70):
 *   - If order already cancelled: return existing state, no double processing
 *   - If stock already restored: detect via stock_adjustments, skip
 */

import { db } from "../config/db.js";
import { cancelWaybill, cancelPickup, isBlueDartConfigured } from "./bluedart.service.js";
import { initiateRefund } from "./refund.service.js";

export type CancellationCase = "before_shipment" | "waybill_not_handed_over" | "after_handover";

export interface CancellationResult {
  case: CancellationCase;
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
 * Determines which cancellation case applies.
 */
async function detectCancellationCase(orderId: string): Promise<{
  order: Record<string, unknown>;
  shipment: Record<string, unknown> | null;
  case: CancellationCase;
}> {
  const { data: order, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Get current active shipment
  const { data: shipment } = await db
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .not("status", "in", '("cancelled","rto")')
    .maybeSingle();

  let cancellationCase: CancellationCase;

  if (!shipment) {
    // No shipment at all
    cancellationCase = "before_shipment";
  } else if (shipment.status === "created") {
    // Waybill exists but parcel not yet handed to courier
    cancellationCase = "waybill_not_handed_over";
  } else {
    // handed_over, picked_up, in_transit, delivered
    cancellationCase = "after_handover";
  }

  return { order, shipment, case: cancellationCase };
}

/**
 * Restores stock for an order — idempotent.
 * Checks stock_adjustments to prevent double restoration (spec §8, §70).
 */
async function restoreStockIdempotent(
  orderId: string,
  orderItems: Record<string, unknown>[],
  performedBy: string | null
): Promise<boolean> {
  // Check if we've already restored stock for this order
  const { data: existingAdjustment } = await db
    .from("stock_adjustments")
    .select("id")
    .eq("order_id", orderId)
    .eq("reason", "sale_reversal")
    .maybeSingle();

  if (existingAdjustment) {
    // Stock already restored — idempotent return
    return false;
  }

  for (const item of orderItems) {
    const variantId = item.variant_id as string | null;
    const qty = Number(item.qty);
    if (!variantId || qty <= 0) continue;

    const { data: v } = await db
      .from("product_variants")
      .select("stock_qty")
      .eq("id", variantId)
      .single();

    if (!v) continue;

    const newStock = Number(v.stock_qty || 0) + qty;
    await db
      .from("product_variants")
      .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
      .eq("id", variantId);

    await db.from("stock_adjustments").insert({
      variant_id: variantId,
      delta: qty,
      reason: "sale_reversal",
      order_id: orderId,
      adjusted_by: performedBy,
      note: "Order cancellation — stock returned to inventory",
      created_at: new Date().toISOString(),
    });
  }

  return true;
}

/**
 * Main cancellation entry point.
 *
 * spec §52: authenticate and authorize before calling this.
 * spec §70: idempotent — second call returns existing state.
 */
// In-memory concurrency locks map for cancellation operations
const cancellationLocks = new Map<string, Promise<CancellationResult>>();

export async function cancelOrder(params: {
  orderId: string;
  requestedBy: string | null;
  reason: string;
  /** true if admin is initiating (admin can cancel any stage) */
  isAdmin?: boolean;
}): Promise<CancellationResult> {
  const { orderId, requestedBy, reason, isAdmin = false } = params;

  if (cancellationLocks.has(orderId)) {
    return await cancellationLocks.get(orderId)!;
  }

  const task = (async (): Promise<CancellationResult> => {
    const { order, shipment, case: cancellationCase } = await detectCancellationCase(orderId);

  const stage = String(order.stage);
  const paymentMethod = String(order.payment_method);
  const paymentStatus = String(order.payment_status);
  const orderItems = (order.order_items as Record<string, unknown>[]) || [];

  // ── Idempotency check (spec §70) ───────────────────────────────────────────
  if (stage === "cancelled") {
    return {
      case: cancellationCase,
      orderId,
      orderStage: "cancelled",
      stockRestored: false,
      refundInitiated: false,
      refundId: null,
      blueDartCancelled: null,
      message: "Order is already cancelled.",
      requiresAdminAction: false,
    };
  }

  if (stage === "delivered" || stage === "picked_up") {
    const err = new Error(
      "Cannot cancel a delivered or picked-up order. Contact the boutique for return assistance."
    ) as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  // ── Eligibility checks ─────────────────────────────────────────────────────
  if (!isAdmin && stage === "shipped" && cancellationCase === "after_handover") {
    // Customers cannot self-cancel after handover — per spec §32, §33
    // They see a message to contact boutique; admin handles the process
    const err = new Error(
      "Your order has already been dispatched. Please contact us via WhatsApp " +
      "and we will arrange the return process with Blue Dart."
    ) as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  // ── Audit: record stage event ──────────────────────────────────────────────
  await db.from("order_stage_events").insert({
    order_id: orderId,
    stage: "cancellation_requested",
    changed_by: requestedBy,
    created_at: new Date().toISOString(),
  });

  // ══════════════════════════════════════════════════════════════════
  // CASE C: Already handed over to courier
  // spec §32, §33, §46, §47
  // ══════════════════════════════════════════════════════════════════
  if (cancellationCase === "after_handover") {
    // Cancel the order stage to signal cancellation initiated
    await db
      .from("orders")
      .update({ stage: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    await db.from("order_stage_events").insert({
      order_id: orderId,
      stage: "cancelled",
      changed_by: requestedBy,
      created_at: new Date().toISOString(),
    });

    // DO NOT restore stock — parcel is physically with the courier (spec §47)
    // Stock restoration must happen manually by admin AFTER confirmed return

    // Create refund record in "requested" state but do NOT submit to Razorpay yet
    // Refund is contingent on RTO completion (spec §32)
    let refundId: string | null = null;
    if (paymentMethod === "razorpay" && paymentStatus === "paid") {
      const { data: refundRecord } = await db
        .from("refunds")
        .insert({
          order_id: orderId,
          razorpay_payment_id: order.razorpay_payment_id as string | null,
          customer_id: order.customer_id as string | null,
          amount: Number(order.total) * 100,
          currency: "INR",
          reason: `${reason} (after courier handover — pending RTO)`,
          status: "requested",
          provider: "razorpay",
          idempotency_key: `refund_${orderId}`,
          requested_by: requestedBy,
          requested_at: new Date().toISOString(),
          metadata: { note: "Refund pending RTO confirmation from Blue Dart" },
        })
        .select("id")
        .single();
      refundId = refundRecord?.id ?? null;
    }

    return {
      case: "after_handover",
      orderId,
      orderStage: "cancelled",
      stockRestored: false,
      refundInitiated: false, // Razorpay not yet called
      refundId,
      blueDartCancelled: null, // Cannot cancel after handover via API
      message:
        "Cancellation request recorded. The parcel is with the courier. " +
        "Our team will contact you once the return process is initiated with Blue Dart. " +
        "Your refund will be processed after the parcel is returned to us.",
      requiresAdminAction: true,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // CASE B: Waybill created, not yet handed over — attempt BD cancel
  // spec §31
  // ══════════════════════════════════════════════════════════════════
  let blueDartCancelled: boolean | null = null;
  if (cancellationCase === "waybill_not_handed_over" && shipment) {
    const awb = String(shipment.awb ?? "");
    if (awb && isBlueDartConfigured()) {
      // Step 1: If pickup was registered and token exists on shipment record, cancel driver pickup registration
      if (shipment.pickup_token && shipment.pickup_date) {
        try {
          const pResult = await cancelPickup({
            awb,
            pickupToken: String(shipment.pickup_token),
            pickupDate: String(shipment.pickup_date),
            reason: `Order cancelled by ${isAdmin ? "admin" : "customer"}`,
          });
          if (!pResult.cancelled) {
            console.warn(`[Cancellation] Blue Dart pickup cancellation warning for AWB ${awb}: ${pResult.reason}`);
          }
        } catch (pickupErr) {
          console.warn(`[Cancellation] Error cancelling pickup for AWB ${awb}:`, pickupErr);
        }
      } else {
        console.warn(`[Cancellation] AWB ${awb} has no registered pickup token. Skipping cancelPickup call.`);
      }

      // Step 2: Cancel waybill (AWB) at BlueDart
      const cancelResult = await cancelWaybill(awb);
      blueDartCancelled = cancelResult.cancelled;

      // Update shipment status
      await db
        .from("shipments")
        .update({
          status: "cancelled",
          pickup_registration_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", shipment.id);

      if (!cancelResult.cancelled) {
        console.warn(
          `[Cancellation] Blue Dart waybill cancellation failed for AWB ${awb}: ${cancelResult.reason}. ` +
          "Flagging courier cancellation failure on order/shipment record for admin review."
        );

        // Record audit event for admin order stage timeline / admin visibility
        await db.from("order_stage_events").insert({
          order_id: orderId,
          stage: "courier_cancellation_failed",
          changed_by: requestedBy,
          created_at: new Date().toISOString(),
        });

        // Surface unresolved courier cancellation flag on shipment record
        try {
          await db
            .from("shipments")
            .update({
              courier_cancellation_failed: true,
              courier_cancellation_error: cancelResult.reason || "Blue Dart waybill cancellation failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", shipment.id);
        } catch (err) {
          // If shipments table lacks courier_cancellation_failed column, update status to cancel_failed
          await db
            .from("shipments")
            .update({
              status: "cancel_failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", shipment.id);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // CASE A + B (continued): Cancel order, restore stock, refund
  // spec §30, §31
  // ══════════════════════════════════════════════════════════════════

  // 1. Mark order cancelled
  await db
    .from("orders")
    .update({ stage: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  await db.from("order_stage_events").insert({
    order_id: orderId,
    stage: "cancelled",
    changed_by: requestedBy,
    created_at: new Date().toISOString(),
  });

  // 2. Restore stock — idempotent (spec §8, §70)
  const stockRestored = await restoreStockIdempotent(orderId, orderItems, requestedBy);

  // 3. Initiate refund if prepaid (spec §30, §43)
  let refundInitiated = false;
  let refundId: string | null = null;

  if (paymentMethod === "razorpay" && paymentStatus === "paid") {
    try {
      const refund = await initiateRefund({
        orderId,
        requestedBy,
        reason,
      });
      refundId = refund.id;
      refundInitiated = refund.status === "processing";
    } catch (refundErr) {
      // Refund failed — but order cancellation and stock restoration still succeeded
      // Admin must retry the refund (spec §44)
      console.error("[Cancellation] Refund initiation failed:", refundErr);
      // Do not throw — cancellation is still valid
    }
  }
  // COD orders: no Razorpay refund (spec §43)

  return {
    case: cancellationCase,
    orderId,
    orderStage: "cancelled",
    stockRestored,
    refundInitiated,
    refundId,
    blueDartCancelled,
    message:
      cancellationCase === "waybill_not_handed_over"
        ? `Order cancelled. ${blueDartCancelled ? "Blue Dart waybill cancelled." : "Blue Dart waybill could not be cancelled automatically — boutique team will handle it."} ${refundInitiated ? "Refund initiated." : paymentMethod === "cod" ? "No refund required (COD)." : "Refund queued — contact boutique if not received within 5-7 days."}`
        : `Order cancelled. ${refundInitiated ? "Refund initiated and will be processed within 5-7 business days." : paymentMethod === "cod" ? "No refund required (COD)." : "Refund queued — contact boutique if not received."}`,
      requiresAdminAction: !refundInitiated && paymentMethod === "razorpay" && paymentStatus === "paid",
    };
  })();

  cancellationLocks.set(orderId, task);
  try {
    return await task;
  } finally {
    cancellationLocks.delete(orderId);
  }
}

/**
 * Processes RTO arrival & physical item quality verification (spec §47).
 * Restores stock idempotently and initiates pending refund once parcel is back at boutique.
 */
export async function processRtoRestockAdmin(params: {
  orderId: string;
  adminId: string;
  note?: string;
}): Promise<{ stockRestored: boolean; refundInitiated: boolean; message: string; trackingStaleWarning?: boolean }> {
  const { orderId, adminId, note } = params;

  const { data: order } = await db.from("orders").select("*, order_items(*)").eq("id", orderId).single();
  if (!order) {
    throw new Error("Order not found.");
  }

  // 1. Check shipment tracking state and pull fresh tracking updates
  const { data: shipment } = await db
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  let trackingStaleWarning = false;

  if (shipment && shipment.awb && isBlueDartConfigured()) {
    try {
      const { OrdersService } = await import("./orders.service.js");
      await OrdersService.syncShipmentTracking(shipment);
    } catch (trackErr) {
      console.warn("[RTO Restock] Live tracking sync pull failed:", trackErr);
    }

    // Re-query shipment after sync attempt to inspect updated last_tracking_at timestamp
    const { data: freshShipment } = await db
      .from("shipments")
      .select("*")
      .eq("id", shipment.id)
      .single();

    const lastTracking = freshShipment?.last_tracking_at ? new Date(freshShipment.last_tracking_at).getTime() : 0;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (lastTracking < twentyFourHoursAgo) {
      trackingStaleWarning = true;
      console.warn(
        `[RTO Restock Warning] Tracking data for order ${orderId} (AWB: ${shipment.awb}) ` +
        "is older than 24 hours. Admin should verify physical parcel arrival."
      );
    }
  }

  const orderItems = (order.order_items as Record<string, unknown>[]) || [];

  // 2. Restore stock idempotently
  const stockRestored = await restoreStockIdempotent(orderId, orderItems, adminId);

  // 3. Process pending refund if Razorpay prepaid
  let refundInitiated = false;
  if (order.payment_method === "razorpay" && order.payment_status === "paid") {
    try {
      const refund = await initiateRefund({
        orderId,
        requestedBy: adminId,
        reason: note || "RTO completed - parcel verified at boutique",
      });
      refundInitiated = refund.status === "processing" || refund.status === "processed";
    } catch (err) {
      console.error("[RTO Restock] Refund trigger failed:", err);
    }
  }

  // 4. Log audit event
  await db.from("order_stage_events").insert({
    order_id: orderId,
    stage: "rto_restocked",
    changed_by: adminId,
    created_at: new Date().toISOString(),
  });

  // 5. Update shipment status to RTO if active shipment exists
  await db
    .from("shipments")
    .update({ status: "rto", updated_at: new Date().toISOString() })
    .eq("order_id", orderId);

  const warningNote = trackingStaleWarning ? " (Warning: Tracking data was older than 24h — ensure physical parcel is in hand)." : "";

  return {
    stockRestored,
    refundInitiated,
    trackingStaleWarning,
    message: `RTO processing complete.${warningNote} ${stockRestored ? "Stock returned to inventory." : "Stock was already restored."} ${refundInitiated ? "Refund initiated via Razorpay." : order.payment_method === "cod" ? "COD order — no refund required." : "Refund pending admin retry."}`,
  };
}
