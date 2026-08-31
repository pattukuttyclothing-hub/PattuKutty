import { Router } from "express";
import { OrdersService } from "../services/orders.service.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

export const ordersRouter = Router();

const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

// ═══════════════════════════════════════════════════════════════════
//  AUTHENTICATED CUSTOMER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  PAYMENT & ORDER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

ordersRouter.post("/orders/calculate-summary", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const summary = await OrdersService.calculateOrderSummary(customerId, req.body as Parameters<typeof OrdersService.calculateOrderSummary>[1]);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

ordersRouter.post("/payments/create-order", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const paymentInfo = await OrdersService.createRazorpayOrder(customerId, req.body);
    res.status(201).json({ success: true, data: paymentInfo });
  } catch (err) { next(err); }
});

ordersRouter.post("/payments/verify", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const order = await OrdersService.verifyRazorpayPayment(customerId, req.body as {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

ordersRouter.post("/payments/cancel", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const { razorpayOrderId } = req.body as { razorpayOrderId: string };
    const result = await OrdersService.cancelRazorpayOrder(customerId, razorpayOrderId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

ordersRouter.post("/orders/cod", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const order = await OrdersService.placeCODOrder(customerId, req.body as Parameters<typeof OrdersService.placeCODOrder>[1]);
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

ordersRouter.post("/orders", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const order = await OrdersService.placeOrder(customerId, req.body as Parameters<typeof OrdersService.placeOrder>[1]);
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});


ordersRouter.get("/orders", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const data = await OrdersService.getCustomerOrders(customerId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get("/orders/:id", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const data = await OrdersService.getCustomerOrderById(p(req.params.id), customerId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Customer tracking endpoint (spec §25) — no Blue Dart credentials in response
ordersRouter.get("/orders/:id/tracking", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const data = await OrdersService.getOrderTracking(p(req.params.id), customerId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Customer order cancellation (spec §52)
// Case A: before shipment — cancels, restores stock, refunds prepaid
// Case B: waybill not handed over — cancels Blue Dart waybill then Case A
// Case C: after handover — records request only, requires admin to handle RTO
ordersRouter.post("/orders/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const { reason } = req.body as { reason?: string };
    const data = await OrdersService.cancelOrderCustomer(
      p(req.params.id),
      customerId,
      reason || "Cancelled by customer"
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
//  ADMIN PROTECTED ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

ordersRouter.get("/admin/orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { stage, delivery_type, limit, offset } = req.query as {
      stage?: string;
      delivery_type?: string;
      limit?: string;
      offset?: string;
    };
    const data = await OrdersService.getAllOrdersAdmin({
      stage,
      delivery_type,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get("/admin/orders/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = await OrdersService.getOrderByIdAdmin(p(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Advance order stage + audit event
ordersRouter.patch("/admin/orders/:id/stage", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const { stage, notes } = req.body as { stage: string; notes?: string };
    const data = await OrdersService.setOrderStageAdmin(p(req.params.id), stage, adminId, notes);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Create Blue Dart shipment (backend calls Blue Dart — no AWB in request body)
// spec §9: admin triggers, backend obtains AWB from Blue Dart, persists, returns AWB
ordersRouter.post("/admin/orders/:id/shipments", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const data = await OrdersService.createBlueDartShipment(p(req.params.id), adminId);
    const status = data.alreadyExists ? 200 : 201;
    res.status(status).json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Register Blue Dart pickup (spec §8)
ordersRouter.post("/admin/orders/:id/shipments/pickup", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const { pickupDate, pickupTime } = req.body as { pickupDate?: string; pickupTime?: string };
    const data = await OrdersService.registerBlueDartPickup(p(req.params.id), adminId, { pickupDate, pickupTime });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Cancel Blue Dart waybill (spec §11)
ordersRouter.post("/admin/orders/:id/shipments/cancel-waybill", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const data = await OrdersService.cancelBlueDartWaybill(p(req.params.id), adminId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Cancel Blue Dart pickup (spec §12)
ordersRouter.post("/admin/orders/:id/shipments/cancel-pickup", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const { reason } = req.body as { reason?: string };
    const data = await OrdersService.cancelBlueDartPickup(p(req.params.id), adminId, reason);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Get shipment for order
ordersRouter.get("/admin/orders/:id/shipments", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = await OrdersService.getOrderTracking(p(req.params.id));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Health & configuration check (spec §16 - secrets masked)
ordersRouter.get("/admin/bluedart/health", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { getBlueDartHealth } = await import("../services/bluedart.service.js");
    res.json({ success: true, data: getBlueDartHealth() });
  } catch (err) { next(err); }
});

// Admin: Blue Dart Product master lookup (spec §2)
ordersRouter.get("/admin/bluedart/products", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { getProductsAndSubProducts } = await import("../services/bluedart.service.js");
    const data = await getProductsAndSubProducts();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Cancel an order (spec §50)
// Can cancel at any stage; handles all three cases (before_shipment, waybill_not_handed_over, after_handover)
ordersRouter.post("/admin/orders/:id/cancel", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const { reason } = req.body as { reason?: string };
    const data = await OrdersService.cancelOrderAdmin(
      p(req.params.id),
      adminId,
      reason || "Cancelled by admin"
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Initiate / retry a Razorpay refund (spec §53)
// Used after Case C cancellation when RTO is confirmed, or to retry failed refunds
ordersRouter.post("/admin/orders/:id/refund", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const { reason } = req.body as { reason?: string };
    const data = await OrdersService.initiateAdminRefund(
      p(req.params.id),
      adminId,
      reason || "Admin-initiated refund"
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Process RTO arrival & restock inventory (spec §47)
ordersRouter.post("/admin/orders/:id/rto-restock", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const { note } = req.body as { note?: string };
    const { processRtoRestockAdmin } = await import("../services/cancellation.service.js");
    const data = await processRtoRestockAdmin({ orderId: p(req.params.id), adminId, note });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Retry failed refund (spec §44)
ordersRouter.post("/admin/orders/:id/retry-refund", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const { retryRefundAdmin } = await import("../services/refund.service.js");
    const data = await retryRefundAdmin(p(req.params.id), adminId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Surface stuck refunds (status = 'processing' > 24 hours threshold)
ordersRouter.get("/admin/refunds/stuck", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { getStuckRefunds } = await import("../services/refund.service.js");
    const hours = req.query.hours ? Number(req.query.hours) : 24;
    const data = await getStuckRefunds(hours);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Admin: Trigger batch background sync for all active shipments
ordersRouter.post("/admin/shipments/sync-tracking", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const data = await OrdersService.syncAllActiveShipmentsTracking();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Razorpay webhook handler for payments, orders & refund events
ordersRouter.post("/payments/webhook", async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string;

    const rawBodyBuffer = (req as unknown as { rawBody?: Buffer }).rawBody;
    const bodyContent = rawBodyBuffer ? rawBodyBuffer.toString("utf-8") : JSON.stringify(req.body);

    if (!webhookSecret) {
      console.error(
        "[CRITICAL] RAZORPAY_WEBHOOK_SECRET is not configured. " +
        "Rejecting webhook request to prevent unverified payload processing. " +
        "Set RAZORPAY_WEBHOOK_SECRET in environment variables before deploying."
      );
      res.status(500).json({ success: false, message: "Webhook secret not configured" });
      return;
    }

    if (!signature) {
      res.status(400).json({ success: false, message: "Missing webhook signature" });
      return;
    }

    {
      const crypto = await import("crypto");
      const expectedSig = crypto
        .default
        .createHmac("sha256", webhookSecret)
        .update(bodyContent)
        .digest("hex");

      const a = Buffer.from(expectedSig);
      const b = Buffer.from(signature);
      const isValid = a.length === b.length && crypto.timingSafeEqual(a, b);

      if (!isValid) {
        res.status(400).json({ success: false, message: "Invalid webhook signature" });
        return;
      }
    }

    const event = req.body as { event: string; payload?: Record<string, unknown> };

    if (event.event === "refund.processed" || event.event === "refund.failed" || event.event === "refund.speed_changed") {
      const { processRefundWebhook } = await import("../services/refund.service.js");
      const refundPayload = (event.payload as Record<string, unknown>)?.refund as Record<string, unknown> | undefined;
      const refundEntity = (refundPayload as Record<string, unknown>)?.entity as Record<string, unknown> | undefined;

      await processRefundWebhook({
        event: event.event,
        providerRefundId: String(refundEntity?.id ?? ""),
        failureCode: refundEntity?.failure_code ? String(refundEntity.failure_code) : undefined,
        failureReason: refundEntity?.failure_reason ? String(refundEntity.failure_reason) : undefined,
      });
    } else if (
      event.event === "order.paid" ||
      event.event === "payment.captured" ||
      event.event === "payment.authorized" ||
      event.event === "payment.failed"
    ) {
      await OrdersService.processRazorpayPaymentWebhook(event.event, event.payload || {});
    }

    // Acknowledge webhook immediately
    res.json({ received: true });
  } catch (err) { next(err); }
});
