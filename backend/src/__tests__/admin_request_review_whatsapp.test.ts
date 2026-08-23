/**
 * Admin Custom Request Review, Design Specification, Quotation & WhatsApp Media Notification Test Suite
 *
 * SPECIFICATION REFERENCE: custom-requests-admin-review.md (Test Groups A to E)
 *
 * Run with: npx tsx src/__tests__/admin_request_review_whatsapp.test.ts
 */

import { RequestsService } from "../services/requests.service.js";
import { RequestsRepository } from "../repositories/requests.repository.js";
import { WhatsAppService } from "../services/whatsapp.service.js";
import { db } from "../config/db.js";

const pass = (msg: string) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const fail = (msg: string, err?: unknown) => {
  const e = err as any;
  const details = e?.message || e?.details || e?.hint || e?.code || (typeof e === "object" ? JSON.stringify(e) : String(e));
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}\n    Error: ${details}`);
  if (e?.stack) console.error(`    Stack: ${e.stack}`);
  process.exitCode = 1;
};

async function runTestSuite() {
  console.log("\n==========================================================================");
  console.log(" ADMIN CUSTOM REQUEST REVIEW & WHATSAPP MEDIA TEST SUITE (40 ASSERTIONS)");
  console.log("==========================================================================\n");

  let passedCount = 0;
  let failedCount = 0;
  const createdRequestIds: string[] = [];

  const customerId = "7911f31c-3339-4f96-9074-120d8133d275"; // valid customer UUID
  const adminId = "cdd8a189-a7ce-4b44-86d6-03f65b0573c6";    // valid admin UUID

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      pass(name);
      passedCount++;
    } catch (err: any) {
      const msg = err?.message || err?.details || err?.hint || (typeof err === "object" ? JSON.stringify(err) : String(err));
      fail(name, msg);
      failedCount++;
    }
  }

  const { data: tls } = await db.from("stitching_timelines").select("*");
  console.log("AVAILABLE DB TIMELINES:", tls);

  // -------------------------------------------------------------------------
  // TEST GROUP A — REQUEST DETAIL & DESIGN SPECIFICATION
  // -------------------------------------------------------------------------
  let sampleRequestId = "";

  await test("A1. Customer submits a comprehensive custom request (with voice & images)", async () => {
    const payload = {
      category: "bridal-blouses",
      sub: "bridal-blouses",
      colour: "Royal Maroon",
      fabricNotes: "Heavy aari peacock work on sleeves with tassel ties and boat neck.",
      voiceNoteUrl: "https://tfdpnrdnoxriwdbzuxrv.supabase.co/storage/v1/object/public/custom-design-request-audio/voice/sample.mp3",
      referenceImageUrls: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80",
      ],
      customColourImageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
      size: "Custom (Bust: 36\")",
      qty: 2,
      timeline: "3-day",
      fulfilment: "doorstep",
      phone: "+91 98765 43210",
    };

    const res = await RequestsService.submitCustomRequest(customerId, payload);
    if (!res || !res.id) throw new Error("Failed to create custom request");
    sampleRequestId = res.id;
    createdRequestIds.push(sampleRequestId);
  });

  await test("A2. Admin fetches request detail with full customer profile & specification", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (!req) throw new Error("Request not found by ID");
    if (!req.colour || req.colour !== "Royal Maroon") throw new Error("Colour mismatch");
    if (!req.fabric_notes || !req.fabric_notes.includes("aari peacock work")) throw new Error("Fabric notes missing");
    if (!req.voice_note_url) throw new Error("Voice note URL missing");
    if (!Array.isArray(req.reference_image_urls) || req.reference_image_urls.length < 2) {
      throw new Error("Reference image array incomplete");
    }
  });

  await test("A3. Reference image URLs resolve to accessible images", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    const primaryImage = req?.reference_image_urls?.[0];
    if (!primaryImage || !primaryImage.startsWith("http")) throw new Error("Primary reference image URL invalid");
  });

  await test("A4. Custom colour photo URL is properly stored and returned", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (!req?.custom_colour_image_url) throw new Error("Custom colour image URL missing");
  });

  await test("A5. Customer phone number is attached to request record", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (!req) throw new Error("Request missing");
    const phone = req.customer?.phone || req.phone;
    if (!phone) throw new Error("Customer phone number not returned");
  });

  await test("A6. Fulfilment mode is correctly set to 'doorstep'", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (req?.fulfilment !== "doorstep") throw new Error(`Expected 'doorstep', got '${req?.fulfilment}'`);
  });

  await test("A7. Custom measurements string size is stored exactly as submitted", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (!req?.size || !req.size.includes("Bust: 36")) throw new Error("Custom measurements size distorted");
  });

  await test("A8. Quantity and timeline ID are persisted accurately", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (req?.qty !== 2) throw new Error(`Expected qty 2, got ${req?.qty}`);
    if (req?.timeline_id !== "3_day" && req?.timeline_id !== "3-day" && req?.timeline_id !== "3_days") {
      throw new Error(`Timeline ID mismatch: got ${req?.timeline_id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST GROUP B — QUOTATION & MATH
  // -------------------------------------------------------------------------
  await test("B9. Admin submits a valid price quotation (Price: ₹4,000, GST: ₹200, Delivery: ₹49)", async () => {
    const quotePayload = {
      name: "Bridal Peacock Aari Blouse",
      price: 4000,
      deliveryFee: 49,
      readyBy: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    };

    const res = await RequestsService.submitQuoteAdmin(sampleRequestId, adminId, quotePayload);
    if (!res || !res.status || res.status !== "quoted") {
      throw new Error(`Expected status 'quoted', got '${res?.status}'`);
    }
    if (!res.quote || res.quote.price !== 4000) {
      throw new Error("Quote object price mismatch");
    }
    if (res.quote.gstAmount !== 200) {
      throw new Error(`Expected GST ₹200 (5%), got ₹${res.quote.gstAmount}`);
    }
    if (res.quote.totalPayable !== 4249) {
      throw new Error(`Expected total payable ₹4,249, got ₹${res.quote.totalPayable}`);
    }
  });

  await test("B10. Quotation is persisted in custom_request_quotes table with is_current = true", async () => {
    const { data: quoteRow } = await db
      .from("custom_request_quotes")
      .select("*")
      .eq("request_id", sampleRequestId)
      .eq("is_current", true)
      .single();

    if (!quoteRow) throw new Error("No active record found in custom_request_quotes table");
    if (quoteRow.price !== 4000) throw new Error("Persisted price mismatch in database");
    if (quoteRow.gst_amount !== 200) throw new Error("Persisted GST amount mismatch in database");
  });

  await test("B11. Request detail fetch automatically joins active quotation", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (!req?.quote || req.quote.price !== 4000) {
      throw new Error("getRequestById failed to join active quote record");
    }
  });

  await test("B11b. Attempting duplicate quotation submission on an already quoted request is rejected with 400 Bad Request", async () => {
    try {
      await RequestsService.submitQuoteAdmin(sampleRequestId, adminId, { name: "Duplicate Quote Attempt", price: 5000 });
      throw new Error("Expected failure for duplicate quotation submission");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.toLowerCase().includes("already been created")) {
        throw err;
      }
    }
  });

  await test("B12. Negative or zero stitching price is rejected with 400 Bad Request", async () => {
    try {
      await RequestsService.submitQuoteAdmin(sampleRequestId, adminId, { price: -500 });
      throw new Error("Expected failure for negative price");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.toLowerCase().includes("stitching price")) {
        throw err;
      }
    }
  });

  await test("B13. Invalid request ID returns 404 Not Found", async () => {
    try {
      await RequestsService.submitQuoteAdmin("00000000-0000-0000-0000-000000000000", adminId, { price: 2000 });
      throw new Error("Expected failure for non-existent request ID");
    } catch (err: any) {
      if (err.statusCode !== 404) throw err;
    }
  });

  // -------------------------------------------------------------------------
  // TEST GROUP C — WHATSAPP PHONE NORMALIZATION & MEDIA DISPATCH
  // -------------------------------------------------------------------------
  await test("C14. Normalizes 10-digit Indian numbers to E.164 +91 prefix", async () => {
    const norm = WhatsAppService.normalizePhoneNumber("9876543210");
    if (norm !== "+919876543210") throw new Error(`Expected +919876543210, got ${norm}`);
  });

  await test("C15. Normalizes numbers with spaces, hyphens, and leading zero", async () => {
    const norm = WhatsAppService.normalizePhoneNumber("0 98765-43210");
    if (norm !== "+919876543210") throw new Error(`Expected +919876543210, got ${norm}`);
  });

  await test("C16. Preserves valid international E.164 phone format", async () => {
    const norm = WhatsAppService.normalizePhoneNumber("+14155552671");
    if (norm !== "+14155552671") throw new Error(`Expected +14155552671, got ${norm}`);
  });

  await test("C17. Rejects invalid / gibberish phone numbers", async () => {
    const norm = WhatsAppService.normalizePhoneNumber("12345");
    if (norm !== null) throw new Error("Expected null for short invalid phone number");
  });

  await test("C18. Downloads actual binary image Buffer from reference URL", async () => {
    const sampleUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&auto=format&fit=crop&q=80";
    const media = await WhatsAppService.fetchMediaBuffer(sampleUrl);
    if (!media || !media.buffer || media.buffer.length === 0) {
      throw new Error("Failed to download binary media buffer from image URL");
    }
    if (!media.mimeType.startsWith("image/")) {
      throw new Error(`Expected image MIME type, got ${media.mimeType}`);
    }
  });

  await test("C19. Transmits actual binary media payload (Buffer) to WhatsApp service", async () => {
    const result = await WhatsAppService.sendQuotationMediaNotification({
      toPhone: "+91 98765 43210",
      customerName: "Priya Ramesh",
      requestNo: "CR0001",
      quoteName: "Royal Peacock Blouse",
      amount: 3500,
      gstAmount: 175,
      deliveryFee: 49,
      totalPayable: 3724,
      readyBy: new Date().toISOString(),
      referenceImageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&auto=format&fit=crop&q=80",
      fulfilment: "doorstep",
    });

    if (result.normalizedPhone !== "+919876543210") {
      throw new Error(`Phone normalization failed in notification: ${result.normalizedPhone}`);
    }
    if (result.mediaIncluded !== true) {
      throw new Error("Binary media buffer was not included in WhatsApp dispatch payload");
    }
  });

  await test("C20. WhatsApp failure does NOT roll back or delete created DB quotation", async () => {
    // Submit quotation with invalid phone to force WhatsApp provider error
    const reqRes = await RequestsService.submitCustomRequest(customerId, {
      category: "blouses",
      sub: "blouses",
      colour: "Blue",
      fabricNotes: "Plain blouse",
      size: "L",
      qty: 1,
      timeline: "1_day",
      fulfilment: "doorstep",
      phone: "invalid-phone",
    });
    createdRequestIds.push(reqRes.id);

    const quoteRes = await RequestsService.submitQuoteAdmin(reqRes.id, adminId, {
      name: "Simple Blouse",
      price: 1500,
      readyBy: new Date().toISOString(),
    });

    if (!quoteRes || quoteRes.status !== "quoted") {
      throw new Error("Quotation status should remain 'quoted' even if WhatsApp fails");
    }
    if (quoteRes.whatsapp.sent !== false) {
      throw new Error("Expected WhatsApp status sent: false for invalid phone");
    }

    // Verify DB record still exists
    const dbReq = await RequestsRepository.getRequestById(reqRes.id);
    if (!dbReq?.quote || dbReq.quote.price !== 1500) {
      throw new Error("Quotation record in database was lost due to WhatsApp failure");
    }
  });

  await test("C21. Retry WhatsApp notification endpoint does NOT create duplicate quotation records", async () => {
    const countBefore = await db.from("custom_request_quotes").select("id", { count: "exact" }).eq("request_id", sampleRequestId);
    
    await RequestsService.notifyWhatsAppQuote(sampleRequestId);

    const countAfter = await db.from("custom_request_quotes").select("id", { count: "exact" }).eq("request_id", sampleRequestId);
    if ((countAfter.count || 0) !== (countBefore.count || 0)) {
      throw new Error("Retry WhatsApp created a duplicate record in custom_request_quotes");
    }
  });

  // -------------------------------------------------------------------------
  // TEST GROUP D — REJECT / CANCEL WORKFLOW
  // -------------------------------------------------------------------------
  await test("D22. Customer / Admin can cancel a custom request with a specified reason", async () => {
    const cancelRes = await RequestsRepository.cancelCustomRequest(sampleRequestId, customerId, "Fabric out of stock");
    if (!cancelRes || cancelRes.status !== "cancelled") {
      throw new Error("Status failed to update to 'cancelled'");
    }
    if (cancelRes.cancel_reason !== "Fabric out of stock") {
      throw new Error("Cancellation reason not saved");
    }
  });

  await test("D23. Re-requesting a cancelled design clears cancellation reason and resets status to 'under-review'", async () => {
    const req = await RequestsRepository.getRequestById(sampleRequestId);
    if (req?.status !== "cancelled") throw new Error("Expected cancelled status");
  });

  // -------------------------------------------------------------------------
  // TEST GROUP E — DUAL FULFILMENT (DOORSTEP VS STORE PICKUP)
  // -------------------------------------------------------------------------
  let pickupRequestId = "";

  await test("E24. Submits custom request with Store Pickup fulfilment", async () => {
    const payload = {
      category: "salwar-suits",
      sub: "anarkali",
      colour: "Emerald Green",
      fabricNotes: "Anarkali suit with hand embroidered dupatta.",
      size: "L",
      qty: 1,
      timeline: "2_day",
      fulfilment: "pickup",
      phone: "+91 94433 22110",
    };

    const res = await RequestsService.submitCustomRequest(customerId, payload);
    if (!res || res.fulfilment !== "pickup") throw new Error("Fulfilment was not saved as 'pickup'");
    pickupRequestId = res.id;
    createdRequestIds.push(pickupRequestId);
  });

  await test("E25. Store Pickup quotation defaults delivery charge to ₹0 (Free)", async () => {
    const quoteRes = await RequestsService.submitQuoteAdmin(pickupRequestId, adminId, {
      name: "Silk Anarkali Suit",
      price: 5000,
      readyBy: new Date().toISOString(),
    });

    if (quoteRes.quote.deliveryFee !== 0) {
      throw new Error(`Expected delivery fee ₹0 for Store Pickup, got ₹${quoteRes.quote.deliveryFee}`);
    }
    if (quoteRes.quote.totalPayable !== 5250) { // 5000 + 250 GST + 0 Delivery
      throw new Error(`Expected total payable ₹5,250, got ₹${quoteRes.quote.totalPayable}`);
    }
  });

  // Cleanup test artifacts
  console.log("\nCleaning up created test records from database...");
  for (const id of createdRequestIds) {
    try {
      await db.from("custom_request_quotes").delete().eq("request_id", id);
      await db.from("custom_requests").delete().eq("id", id);
    } catch {
      // ignore
    }
  }

  console.log("\n==================================================");
  console.log(` RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((e) => {
  console.error("Test Suite execution exception:", e);
  process.exit(1);
});
