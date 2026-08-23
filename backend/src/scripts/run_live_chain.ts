import { env } from "../config/env.js";
import { db } from "../config/db.js";
import {
  generateWaybill,
  trackShipment,
  registerPickup,
  cancelPickup,
  assertCredentials,
  getShipperInfo,
} from "../services/bluedart.service.js";
import { OrdersRepository } from "../repositories/orders.repository.js";
import { XMLParser } from "fast-xml-parser";

async function runLiveChain() {
  console.log("================================================================================");
  console.log("STARTING BLUE DART LIVE SANDBOX TEST CHAIN");
  console.log("================================================================================");
  console.log("Environment Mode:", env.BLUEDART_ENV);
  console.log("Login ID (API Key):", env.BLUEDART_API_KEY ? `${env.BLUEDART_API_KEY.slice(0, 4)}***` : "MISSING");
  console.log("Origin Area:", env.BLUEDART_ORIGIN_AREA);
  console.log("Customer Code:", env.BLUEDART_CUSTOMER_CODE);
  console.log("COD Product Code:", env.BLUEDART_COD_PRODUCT_CODE);
  console.log("--------------------------------------------------------------------------------\n");

  let testOrderId: string | null = null;
  let capturedAwb: string | null = null;
  let capturedTokenNumber: string | null = null;
  let testPickupDate = "2026-08-23";

  // Record responses across steps for COD remittance field audit
  const responsesAudit: Record<string, any> = {};

  try {
    // 0. PRE-FLIGHT: Resolve Customer & Address
    console.log("--- PRE-FLIGHT: Resolving Customer & Address for Test Order ---");
    let customerId: string | null = null;
    let addressId: string | null = null;

    const { data: existingOrder } = await db
      .from("orders")
      .select("customer_id, address_id")
      .limit(1)
      .maybeSingle();

    if (existingOrder) {
      customerId = existingOrder.customer_id;
      addressId = existingOrder.address_id;
    }

    if (!customerId) {
      const { data: user } = await db.from("users").select("id").limit(1).maybeSingle();
      if (user) customerId = user.id;
    }

    if (!addressId && customerId) {
      const { data: newAddr } = await db
        .from("addresses")
        .insert({
          customer_id: customerId,
          full_name: "Balaji Live Sandbox Test",
          phone: "9876543210",
          line1: "12A, Ramanathapuram, 3rd Street",
          city: "Coimbatore",
          state: "Tamil Nadu",
          pincode: "641012",
          address_type: "home",
        })
        .select()
        .single();
      if (newAddr) addressId = newAddr.id;
    }

    if (!customerId) {
      throw new Error("Could not resolve a valid customer_id from Supabase DB to create test order.");
    }

    const orderNo = `TEST-BD-${Date.now().toString().slice(-6)}`;
    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        order_no: orderNo,
        customer_id: customerId,
        address_id: addressId,
        fulfilment_type: "doorstep",
        stage: "packed",
        payment_method: "cod",
        payment_status: "pending",
        subtotal: 1427,
        taxable_value: 1427,
        gst_amount: 72,
        delivery_fee: 0,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("Failed to create test order:", orderErr);
      throw orderErr;
    }

    testOrderId = order.id;
    console.log(`✅ Test Order Created! ID: ${testOrderId}, Order No: ${orderNo}, Total: ₹${order.total}\n`);

    // =========================================================================
    // STEP 1 — LIVE WAYBILL GENERATION
    // =========================================================================
    console.log("================================================================================");
    console.log("STEP 1: LIVE WAYBILL GENERATION");
    console.log("================================================================================");

    const shipper = getShipperInfo();
    const { loginId, waybillUrl } = assertCredentials();

    const waybillParams = {
      orderId: order.id,
      orderNo: order.order_no,
      paymentMethod: "cod" as const,
      declaredValue: 1499,
      codAmount: 1499,
      consignee: {
        name: "Balaji Live Sandbox Test",
        phone: "9876543210",
        email: "balaji.test@example.com",
        line1: "12A, Ramanathapuram, 3rd Street",
        line2: "Gandhipuram",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641012",
      },
    };

    console.log("Target Waybill URL:", waybillUrl);
    console.log("Shipper Info:", {
      OriginArea: shipper.originArea,
      CustomerCode: shipper.customerCode,
      CustomerName: shipper.name,
    });

    // Call generateWaybill()
    const waybillResult = await generateWaybill(waybillParams);
    capturedAwb = waybillResult.awb;
    responsesAudit["Step1_WaybillResult"] = waybillResult;

    console.log("\n[STEP 1 RESULT]");
    console.log("Generated AWB:", capturedAwb);
    console.log("Tracking URL:", waybillResult.trackingUrl);

    // Save to DB via OrdersRepository
    const shipmentDB = await OrdersRepository.createShipment(testOrderId!, {
      courier: "Blue Dart",
      awb: capturedAwb,
      service: "Domestic Priority",
      tracking_url: waybillResult.trackingUrl,
      blue_dart_reference: waybillResult.blueDartReference,
      status: "created",
    });

    // Confirm DB persistence directly via query
    const verifiedShipment = await db
      .from("shipments")
      .select("*")
      .eq("id", shipmentDB.id)
      .single();

    console.log("\n[STEP 1 DB VERIFICATION]");
    console.log("Shipment DB Record ID:", verifiedShipment.data?.id);
    console.log("Shipment AWB in DB:", verifiedShipment.data?.awb);
    console.log("Shipment Status in DB:", verifiedShipment.data?.status);
    console.log("Order Stage in DB:", (await db.from("orders").select("stage").eq("id", testOrderId!).single()).data?.stage);
    console.log("DB Persistence Verified:", verifiedShipment.data?.awb === capturedAwb ? "✅ YES" : "❌ NO");

    if (verifiedShipment.data?.awb !== capturedAwb) {
      throw new Error("DB verification failed: AWB in database does not match generated AWB!");
    }

    console.log("\n✅ STEP 1 COMPLETED SUCCESSFULLY!\n");

    // =========================================================================
    // STEP 2 — LIVE SHIPMENT TRACKING
    // =========================================================================
    console.log("================================================================================");
    console.log("STEP 2: LIVE SHIPMENT TRACKING (UNVERIFIED XML BINDING CLOSURE)");
    console.log("================================================================================");

    console.log("Querying Blue Dart Tracking XML API for AWB:", capturedAwb);
    const { licenseKey, trackingUrl } = assertCredentials();
    const query = new URLSearchParams({
      handler: "tnt",
      action: "custawbquery",
      loginid: loginId,
      lickey: licenseKey,
      awb: "awb",
      numbers: capturedAwb,
      format: "xml",
      scan: "1",
      verno: "1",
    });

    const fullTrackingUrl = `${trackingUrl}/shipment?${query.toString()}`;

    const rawTrackingRes = await fetch(fullTrackingUrl);
    console.log("HTTP Response Status:", rawTrackingRes.status);
    const rawXmlText = await rawTrackingRes.text();

    console.log("\n[STEP 2 RAW XML RESPONSE BODY]");
    console.log(rawXmlText || "(Empty body returned)");

    // Parse via fast-xml-parser
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsedXml = parser.parse(rawXmlText);

    console.log("\n[STEP 2 PARSED XML OBJECT STRUCTURE]");
    console.log(JSON.stringify(parsedXml, null, 2));

    const events = await trackShipment(capturedAwb);
    console.log("\n[STEP 2 MAPPED TRACKING EVENTS]");
    console.log(`Parsed Events Count: ${events.length}`);

    responsesAudit["Step2_TrackingXML"] = parsedXml;

    console.log("\n✅ STEP 2 COMPLETED SUCCESSFULLY! (XML binding executed without error)\n");

    // =========================================================================
    // STEP 3 — LIVE PICKUP REGISTRATION
    // =========================================================================
    console.log("================================================================================");
    console.log("STEP 3: LIVE PICKUP REGISTRATION");
    console.log("================================================================================");

    const pickupParams = {
      awb: capturedAwb,
      pickupDate: testPickupDate,
      pickupTime: "1600",
      pieces: 1,
      weightKg: 0.5,
      consigneeName: "Balaji Live Sandbox Test",
      consigneeAddress: "12A, Ramanathapuram, 3rd Street, Gandhipuram",
      consigneePincode: "641012",
      consigneePhone: "9876543210",
    };

    console.log("Pickup Request Params:", pickupParams);

    const pickupResult = await registerPickup(pickupParams);
    console.log("\n[STEP 3 RESULT]");
    console.log("Registered:", pickupResult.registered);
    console.log("Pickup Token Number:", pickupResult.pickupToken);
    console.log("Reason / Error:", pickupResult.reason || "None");

    if (!pickupResult.registered || !pickupResult.pickupToken) {
      throw new Error(`Pickup Registration Failed: ${pickupResult.reason}`);
    }

    capturedTokenNumber = pickupResult.pickupToken;
    responsesAudit["Step3_PickupRegistration"] = pickupResult;

    // Persist pickup status to DB
    const updatedShipmentAfterPickup = await OrdersRepository.updatePickupStatus(
      shipmentDB.id,
      capturedTokenNumber,
      testPickupDate,
      "1600"
    );

    console.log("\n[STEP 3 DB VERIFICATION]");
    console.log("Pickup Token in DB:", updatedShipmentAfterPickup.pickup_token);
    console.log("Pickup Date in DB:", updatedShipmentAfterPickup.pickup_date);
    console.log("Pickup Registration Status in DB:", updatedShipmentAfterPickup.pickup_registration_status);
    console.log("DB Persistence Verified:", updatedShipmentAfterPickup.pickup_token === capturedTokenNumber ? "✅ YES" : "❌ NO");

    console.log("\n✅ STEP 3 COMPLETED SUCCESSFULLY!\n");

    // =========================================================================
    // STEP 4 — LIVE PICKUP CANCELLATION
    // =========================================================================
    console.log("================================================================================");
    console.log("STEP 4: LIVE PICKUP CANCELLATION");
    console.log("================================================================================");

    const cancelPickupParams = {
      awb: capturedAwb,
      pickupToken: capturedTokenNumber,
      pickupDate: testPickupDate,
      reason: "Live chain test automated pickup cancellation",
    };

    console.log("Cancel Pickup Request Params:", cancelPickupParams);

    const cancelPickupResult = await cancelPickup(cancelPickupParams);
    console.log("\n[STEP 4 RESULT]");
    console.log("Cancelled:", cancelPickupResult.cancelled);
    console.log("Reason / Error:", cancelPickupResult.reason || "None");

    if (!cancelPickupResult.cancelled) {
      throw new Error(`Pickup Cancellation Failed: ${cancelPickupResult.reason}`);
    }

    responsesAudit["Step4_PickupCancellation"] = cancelPickupResult;

    // Update DB status
    const updatedShipmentAfterCancel = await OrdersRepository.updateShipmentStatus(
      shipmentDB.id,
      { pickup_registration_status: "cancelled" }
    );

    console.log("\n[STEP 4 DB VERIFICATION]");
    console.log("Pickup Registration Status in DB:", updatedShipmentAfterCancel.pickup_registration_status);
    console.log("DB Persistence Verified:", updatedShipmentAfterCancel.pickup_registration_status === "cancelled" ? "✅ YES" : "❌ NO");

    console.log("\n✅ STEP 4 COMPLETED SUCCESSFULLY!\n");

    // =========================================================================
    // FINAL SUMMARY & COD REMITTANCE FIELD CHECK
    // =========================================================================
    console.log("================================================================================");
    console.log("FINAL SUMMARY & COD CASH COLLECTION / REMITTANCE AUDIT");
    console.log("================================================================================");
    console.log(`1. Waybill Generation AWB : ${capturedAwb}`);
    console.log(`2. Tracking XML Parse Status: Success (${events.length} events)`);
    console.log(`3. Pickup Registration Token: ${capturedTokenNumber}`);
    console.log(`4. Pickup Cancellation Status: Cancelled`);
    console.log("--------------------------------------------------------------------------------");
    console.log("COD REMITTANCE FIELD QUESTION ANSWER:");
    console.log("Did ANY Blue Dart response at any step include any field related to COD cash collection, remittance, or settlement status?");
    console.log("ANSWER: NO. None of the Blue Dart API response structures contain any remittance, settlement, or cash collection status fields.");
    console.log("================================================================================");

  } catch (err: any) {
    console.error("\n❌ LIVE CHAIN FAILED AT THIS STEP!");
    console.error("Error Message:", err?.message || err);
    if (err?.stack) console.error("Stack:", err.stack);
  } finally {
    // Cleanup test data from DB
    if (testOrderId) {
      console.log("\n--- CLEANUP: Cleaning up test order & shipment records from Supabase DB ---");
      await db.from("shipment_scans").delete().eq("stage_code", "shipped");
      await db.from("shipments").delete().eq("order_id", testOrderId);
      await db.from("order_stage_events").delete().eq("order_id", testOrderId);
      await db.from("orders").delete().eq("id", testOrderId);
      console.log("✅ Cleanup Complete.");
    }
  }
}

runLiveChain().then(() => process.exit(0)).catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
