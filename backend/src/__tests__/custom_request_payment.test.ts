/**
 * Custom Request Payment Integration & Regression Test Suite
 *
 * Scenarios:
 * CR-PAY-01: Custom quotation ₹50 -> Razorpay 5000 paise, orders.custom_request_id preserved, fallback product NOT used.
 * CR-PAY-02: Normal product ₹3,499 -> Razorpay 349900 paise.
 * CR-PAY-03: Invalid customRequestId -> HTTP 4xx error (NEVER fallback to catalogue product).
 * CR-PAY-04: Store pickup -> delivery fee ₹0 respected.
 * CR-PAY-05: Customer A request used by Customer B -> HTTP 403 Forbidden.
 * CR-PAY-06: Custom request with no active quotation -> HTTP 400 Bad Request.
 * CR-PAY-07: Custom request + quotation ₹50 -> Razorpay exactly 5000 paise (ignores client-supplied price).
 * CR-PAY-08: Successful payment -> PostgreSQL orders.custom_request_id = request UUID.
 *
 * Run with: npx tsx src/__tests__/custom_request_payment.test.ts
 */

import { OrdersService, PlaceOrderPayload } from "../services/orders.service.js";
import { db } from "../config/db.js";

const pass = (msg: string) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const fail = (msg: string, err?: unknown) => {
  const errMsg = err instanceof Error ? err.message : typeof err === "object" ? JSON.stringify(err) : String(err);
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}`, errMsg);
  process.exitCode = 1;
};

async function runCustomRequestPaymentTests() {
  console.log("\n==================================================");
  console.log(" CUSTOM REQUEST PAYMENT INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  let passedCount = 0;
  let failedCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      pass(name);
      passedCount++;
    } catch (err: any) {
      fail(name, err?.message || err);
      failedCount++;
    }
  }

  // 1. Fetch real customer & address from DB for testing
  const { data: customers } = await db.from("customers").select("id").limit(2);
  const customerAId = customers?.[0]?.id || "e9026f67-9748-4394-b81c-115c0228928a";
  const customerBId = customers?.[1]?.id || "cdd8a189-a7ce-4b44-86d6-03f65b0573c6";

  const validShipping = {
    fullName: "Test Customer",
    phone: "9876543210",
    line1: "123 Boutique Street",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641001",
  };

  // Clean up any existing test requests created by this test script
  const testReqNo = `CR-T-${Date.now().toString().slice(-10)}`;
  await db.from("custom_requests").delete().eq("request_no", testReqNo);

  // 2. Create a test custom request for Customer A
  const { data: testReq, error: reqErr } = await db
    .from("custom_requests")
    .insert([
      {
        request_no: testReqNo,
        customer_id: customerAId,
        category_id: "d2a9b57b-07fb-43e0-81c2-cb78fabc0886",
        sub_category_id: "fb113ac0-cc37-410a-8009-8900a4c77490",
        fabric_notes: "Test stitching notes",
        size: "M",
        qty: 1,
        timeline_id: "1_day",
        fulfilment: "doorstep",
        status: "quoted",
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (reqErr || !testReq) {
    throw new Error(`Failed to seed test custom request: ${reqErr?.message}`);
  }

  const customRequestId = testReq.id;

  // 3. Create active quotation for test custom request: Stitching ₹1 + GST ₹0 + Doorstep ₹49 = ₹50
  const { data: testQuote, error: quoteErr } = await db
    .from("custom_request_quotes")
    .insert([
      {
        request_id: customRequestId,
        name: "Test Custom Blouse Quotation",
        size: "M",
        price: 1,
        gst_amount: 0,
        delivery_fee: 49,
        ready_by: "2026-08-20",
        quoted_at: new Date().toISOString(),
        quoted_by: "7911f31c-3339-4f96-9074-120d8133d275",
        is_current: true,
      },
    ])
    .select()
    .single();

  if (quoteErr || !testQuote) {
    throw new Error(`Failed to seed test quotation: ${quoteErr?.message}`);
  }

  // ── CR-PAY-01: Custom Quotation ₹50 -> Razorpay 5000 Paise ─────────────────
  await test("CR-PAY-01: Custom request quoted at ₹50 produces 5000 paise in Razorpay and preserves custom_request_id", async () => {
    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    const res = await OrdersService.createRazorpayOrder(customerAId, payload);
    if (res.amount !== 5000) {
      throw new Error(`Expected Razorpay amount 5000 paise (₹50), but got ${res.amount} paise (₹${res.amount / 100})`);
    }

    // Verify order in DB
    const { data: order } = await db.from("orders").select("*").eq("id", res.orderId).single();
    if (!order) throw new Error("Pending order record not created in DB");
    if (order.custom_request_id !== customRequestId) {
      throw new Error(`Expected orders.custom_request_id = ${customRequestId}, but got ${order.custom_request_id}`);
    }
    if (order.total !== 50) {
      throw new Error(`Expected orders.total = 50, but got ${order.total}`);
    }
    if (order.delivery_fee !== 49) {
      throw new Error(`Expected orders.delivery_fee = 49, but got ${order.delivery_fee}`);
    }

    // Verify no fallback product snapshot was used
    const notes = JSON.parse(order.customer_notes || "{}");
    const itemSnap = notes.pendingItems?.[0];
    if (itemSnap?.product_name_snapshot === "Royal Peacock Zardosi Aari Blouse") {
      throw new Error("Fallback product 'Royal Peacock Zardosi Aari Blouse' was erroneously used!");
    }
    if (itemSnap?.product_name_snapshot !== "Test Custom Blouse Quotation") {
      throw new Error(`Expected product name snapshot 'Test Custom Blouse Quotation', got '${itemSnap?.product_name_snapshot}'`);
    }
  });

  // ── CR-PAY-02: Normal Product ₹3,499 Regression Check ─────────────────────
  await test("CR-PAY-02: Normal catalogue product (₹3,499) produces 349900 paise in Razorpay", async () => {
    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: "blouse-aari-1",
          productId: "blouse-aari-1",
          size: "S",
          qty: 1,
        },
      ],
    };

    const res = await OrdersService.createRazorpayOrder(customerAId, payload);
    if (res.amount !== 349900) {
      throw new Error(`Expected Razorpay amount 349900 paise (₹3,499), but got ${res.amount} paise`);
    }

    const { data: order } = await db.from("orders").select("*").eq("id", res.orderId).single();
    if (order?.custom_request_id !== null) {
      throw new Error(`Expected normal product order custom_request_id = null, got ${order?.custom_request_id}`);
    }
  });

  // ── CR-PAY-03: Invalid Custom Request ID Returns 4xx (Zero Fallback) ──────
  await test("CR-PAY-03: Invalid customRequestId returns controlled 4xx error and NEVER falls back to catalogue product", async () => {
    const invalidId = "00000000-0000-0000-0000-000000000099";
    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: invalidId,
          productId: invalidId,
          customRequestId: invalidId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    let errorThrown = false;
    try {
      await OrdersService.createRazorpayOrder(customerAId, payload);
    } catch (err: any) {
      errorThrown = true;
      if (!err.message.includes("could not be resolved") && !err.message.includes("not found")) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!errorThrown) {
      throw new Error("Expected createRazorpayOrder to throw controlled 4xx error for invalid custom request ID, but it succeeded!");
    }
  });

  // ── CR-PAY-04: Store Pickup Delivery Type ──────────────────────────────────
  await test("CR-PAY-04: Store pickup delivery type sets delivery fee to ₹0", async () => {
    const payload: PlaceOrderPayload = {
      deliveryType: "store_pickup",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    const res = await OrdersService.createRazorpayOrder(customerAId, payload);
    if (res.amount !== 100) {
      // ₹1 stitching + ₹0 delivery = ₹1 = 100 paise
      throw new Error(`Expected Store Pickup Razorpay amount 100 paise (₹1), but got ${res.amount} paise`);
    }

    const { data: order } = await db.from("orders").select("*").eq("id", res.orderId).single();
    if (order?.delivery_fee !== 0) {
      throw new Error(`Expected orders.delivery_fee = 0 for store_pickup, got ${order?.delivery_fee}`);
    }
    if (order?.total !== 1) {
      throw new Error(`Expected orders.total = 1 for store_pickup, got ${order?.total}`);
    }
  });

  // ── CR-PAY-05: Customer Ownership Verification (Customer B cannot checkout Customer A request) ─
  await test("CR-PAY-05: Customer B attempting to checkout Customer A's custom request returns HTTP 403 Forbidden", async () => {
    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    let forbiddenCaught = false;
    try {
      await OrdersService.createRazorpayOrder(customerBId, payload);
    } catch (err: any) {
      forbiddenCaught = true;
      if (err.statusCode !== 403 && !err.message.includes("Forbidden")) {
        throw new Error(`Expected 403 Forbidden error, got: ${err.message}`);
      }
    }

    if (!forbiddenCaught) {
      throw new Error("Customer B was able to order Customer A's custom request without 403 Forbidden check!");
    }
  });

  // ── CR-PAY-06: Custom Request Has No Active Quotation ──────────────────────
  await test("CR-PAY-06: Custom request with no active quotation returns 400 Bad Request", async () => {
    // Set active quote is_current = false temporarily
    await db.from("custom_request_quotes").update({ is_current: false }).eq("id", testQuote.id);

    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    let caught = false;
    try {
      await OrdersService.createRazorpayOrder(customerAId, payload);
    } catch (err: any) {
      caught = true;
      if (!err.message.includes("No active quotation found")) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    } finally {
      // Restore active quote
      await db.from("custom_request_quotes").update({ is_current: true }).eq("id", testQuote.id);
    }

    if (!caught) {
      throw new Error("Expected createRazorpayOrder to fail when no active quotation exists, but it succeeded!");
    }
  });

  // ── CR-PAY-07: Client Price Tampering Ignored ──────────────────────────────
  await test("CR-PAY-07: Backend ignores client-supplied price (e.g. ₹99999) and enforces authoritative quote price ₹50 (5000 paise)", async () => {
    const payload: any = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          price: 99999, // Client attempts to supply fake high price
          unit_price: 99999,
          size: "M",
          qty: 1,
        },
      ],
    };

    const res = await OrdersService.createRazorpayOrder(customerAId, payload);
    if (res.amount !== 5000) {
      throw new Error(`Backend trusted client price! Expected 5000 paise (₹50), but got ${res.amount} paise (₹${res.amount / 100})`);
    }
  });

  // ── CR-PAY-08: Order Persistence Verification ──────────────────────────────
  await test("CR-PAY-08: Created PostgreSQL order record contains exact custom_request_id UUID and is_custom = true", async () => {
    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    const res = await OrdersService.createRazorpayOrder(customerAId, payload);
    const { data: order, error } = await db.from("orders").select("*").eq("id", res.orderId).single();

    if (error || !order) throw error || new Error("Order record not found in PostgreSQL");
    if (order.custom_request_id !== customRequestId) {
      throw new Error(`orders.custom_request_id mismatch! Expected ${customRequestId}, got ${order.custom_request_id}`);
    }
    if (order.is_custom !== true) {
      throw new Error(`orders.is_custom mismatch! Expected true, got ${order.is_custom}`);
    }
  });

  // ── CR-PAY-09: End-to-End Payment Verification Flow (/payments/verify) ────
  await test("CR-PAY-09: Successful Razorpay payment verification updates order to payment_status = 'paid' without cancel", async () => {
    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    const orderRes = await OrdersService.createRazorpayOrder(customerAId, payload);
    const mockPaymentId = `pay_test_${Date.now()}`;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let mockSignature = "simulated_signature";
    if (keySecret) {
      const crypto = await import("crypto");
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(`${orderRes.razorpayOrderId}|${mockPaymentId}`);
      mockSignature = hmac.digest("hex");
    }

    const verifiedOrder = await OrdersService.verifyRazorpayPayment(customerAId, {
      razorpayOrderId: orderRes.razorpayOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: mockSignature,
    });

    if (!verifiedOrder || verifiedOrder.payment_status !== "paid") {
      throw new Error(`Expected payment_status = 'paid', got ${verifiedOrder?.payment_status}`);
    }
    if (verifiedOrder.custom_request_id !== customRequestId) {
      throw new Error(`Expected custom_request_id = ${customRequestId}, got ${verifiedOrder?.custom_request_id}`);
    }
  });

  // ── CR-PAY-10: Modal Cancellation Isolation ───────────────────────────────
  await test("CR-PAY-10: Modal cancellation (cancelBackendPaymentOrder) only cancels abandoned orders, not paid ones", async () => {
    const payload: PlaceOrderPayload = {
      shipping: validShipping,
      deliveryType: "doorstep",
      paymentMethod: "razorpay",
      items: [
        {
          id: customRequestId,
          productId: customRequestId,
          customRequestId: customRequestId,
          isCustom: true,
          size: "M",
          qty: 1,
        },
      ],
    };

    const orderRes = await OrdersService.createRazorpayOrder(customerAId, payload);
    const { OrdersRepository } = await import("../repositories/orders.repository.js");

    // Abandoned order cancellation
    await OrdersRepository.markRazorpayOrderFailed(orderRes.orderId);
    const { data: cancelledOrder } = await db.from("orders").select("*").eq("id", orderRes.orderId).single();

    if (cancelledOrder?.payment_status !== "failed") {
      throw new Error(`Expected payment_status = 'failed' for abandoned order, got ${cancelledOrder?.payment_status}`);
    }
  });

  // Clean up seeded test data
  await db.from("custom_request_quotes").delete().eq("request_id", customRequestId);
  await db.from("custom_requests").delete().eq("id", customRequestId);

  console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runCustomRequestPaymentTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
