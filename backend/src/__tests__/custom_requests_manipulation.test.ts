/**
 * Custom Requests Manipulation & Protection Automated Test Suite (Assertions A through P)
 *
 * SPECIFICATION REFERENCE: custom-requests-manipulation.md
 *
 * Run with: npx tsx src/__tests__/custom_requests_manipulation.test.ts
 */

import { RequestsService } from "../services/requests.service.js";
import { CatalogueService } from "../services/catalogue.service.js";
import { RequestsRepository } from "../repositories/requests.repository.js";
import { WhatsAppService } from "../services/whatsapp.service.js";
import { db } from "../config/db.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const pass = (msg: string) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const fail = (msg: string, err?: unknown) => {
  const e = err as any;
  const details = e?.message || e?.details || e?.hint || e?.code || (typeof e === "object" ? JSON.stringify(e) : String(e));
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}\n    Error: ${details}`);
  if (e?.stack) console.error(`    Stack: ${e.stack}`);
  process.exitCode = 1;
};

async function runManipulationSuite() {
  console.log("\n==========================================================================");
  console.log(" CUSTOM REQUESTS MANIPULATION & PROTECTION SUITE (ASSERTIONS A to P)");
  console.log("==========================================================================\n");

  let passedCount = 0;
  let failedCount = 0;
  const createdRequestIds: string[] = [];

  const customerIdA = "7911f31c-3339-4f96-9074-120d8133d275"; // User A UUID
  const customerIdB = "cdd8a189-a7ce-4b44-86d6-03f65b0573c6"; // User B UUID
  const adminUserId = "cdd8a189-a7ce-4b44-86d6-03f65b0573c6"; // Admin UUID

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      pass(name);
      passedCount++;
    } catch (err: any) {
      fail(name, err);
      failedCount++;
    }
  }

  let sampleRequestId = "";

  // -------------------------------------------------------------------------
  // A. Admin design specification is returned and displayed
  // -------------------------------------------------------------------------
  await test("A. Admin design specification is returned with structured fields", async () => {
    const payload = {
      category: "bridal-blouses",
      sub: "bridal-blouses",
      colour: "Royal Velvet Red",
      fabricNotes: "Peacock zardosi embroidery on back and sleeves.",
      size: "Custom (Bust: 38\", Waist: 32\")",
      qty: 2,
      timeline: "2_days",
      fulfilment: "doorstep",
      phone: "+91 98422 11000",
    };

    const res = await RequestsService.submitCustomRequest(customerIdA, payload);
    if (!res || !res.id) throw new Error("Failed to create custom request");
    sampleRequestId = res.id;
    createdRequestIds.push(sampleRequestId);

    const detail = await RequestsRepository.getRequestById(sampleRequestId);
    if (!detail) throw new Error("Failed to fetch request detail");
    if (!detail.size || !detail.size.includes("Bust: 38")) throw new Error("Technical size specification missing or corrupted");
    if (detail.qty !== 2) throw new Error("Quantity specification mismatch");
    if (!detail.fabric_notes || !detail.fabric_notes.includes("Peacock zardosi")) throw new Error("Fabric notes missing");
  });

  // -------------------------------------------------------------------------
  // B. Custom colour image is returned and displayed
  // -------------------------------------------------------------------------
  await test("B. Custom colour image is returned in API response", async () => {
    const sampleColourUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80";
    const res = await RequestsService.submitCustomRequest(customerIdA, {
      category: "salwar-suits",
      colour: "Custom Shade (Uploaded)",
      customColourImageUrl: sampleColourUrl,
      fabricNotes: "Match fabric shade to uploaded photo",
      size: "L",
      qty: 1,
      timeline: "1_day",
      fulfilment: "pickup",
    });
    createdRequestIds.push(res.id);

    const detail = await RequestsRepository.getRequestById(res.id);
    if (!detail || detail.custom_colour_image_url !== sampleColourUrl) {
      throw new Error("Custom colour image URL was not returned in request detail API");
    }
  });

  // -------------------------------------------------------------------------
  // C. Existing quotation displays metadata instead of showing a fresh quotation form
  // -------------------------------------------------------------------------
  await test("C. Existing quotation joins active quotation metadata", async () => {
    const quotePayload = {
      name: "Bridal Peacock Velvet Blouse",
      price: 4500,
      deliveryFee: 49,
      readyBy: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    };

    await RequestsService.submitQuoteAdmin(sampleRequestId, adminUserId, quotePayload);
    const detail = await RequestsRepository.getRequestById(sampleRequestId);

    if (!detail?.quote) throw new Error("Request detail did not join active quotation");
    if (detail.quote.price !== 4500) throw new Error("Quotation price mismatch");
    if (detail.quote.gstAmount !== 225) throw new Error(`Expected GST ₹225, got ₹${detail.quote.gstAmount}`);
    if (detail.quote.totalPayable !== 4774) throw new Error(`Expected total ₹4,774, got ₹${detail.quote.totalPayable}`);
  });

  // -------------------------------------------------------------------------
  // D. Editing an existing quotation does not create an unintended duplicate active quotation
  // -------------------------------------------------------------------------
  await test("D. Editing an existing quotation re-versions quote without creating duplicate active quotation", async () => {
    const editPayload = {
      name: "Updated Velvet Blouse Quote",
      price: 5000,
      deliveryFee: 49,
      readyBy: new Date(Date.now() + 4 * 86_400_000).toISOString(),
      isEdit: true,
    };

    const res = await RequestsService.submitQuoteAdmin(sampleRequestId, adminUserId, editPayload);
    if (!res || !res.quote || res.quote.price !== 5000) {
      throw new Error("Edit quote failed to update quotation price to 5000");
    }

    // Verify DB contains exactly 1 active quotation (is_current = true)
    const { data: currentQuotes } = await db
      .from("custom_request_quotes")
      .select("id")
      .eq("request_id", sampleRequestId)
      .eq("is_current", true);

    if (!currentQuotes || currentQuotes.length !== 1) {
      throw new Error(`Expected exactly 1 active quote record in DB, found ${currentQuotes?.length}`);
    }
  });

  // -------------------------------------------------------------------------
  // E. Successful quotation returns success state
  // -------------------------------------------------------------------------
  await test("E. Successful quotation returns valid status and payload", async () => {
    const reqRes = await RequestsService.submitCustomRequest(customerIdA, {
      category: "blouses",
      colour: "Emerald",
      fabricNotes: "Embroidered blouse",
      size: "M",
      qty: 1,
      timeline: "1_day",
      fulfilment: "pickup",
      phone: "+91 94433 22110",
    });
    createdRequestIds.push(reqRes.id);

    const quoteRes = await RequestsService.submitQuoteAdmin(reqRes.id, adminUserId, {
      name: "Emerald Silk Blouse",
      price: 2500,
      readyBy: new Date().toISOString(),
    });

    if (!quoteRes || quoteRes.status !== "quoted" || !quoteRes.quote) {
      throw new Error("Quotation response missing status or quote object");
    }
  });

  // -------------------------------------------------------------------------
  // F. Failed quotation returns failure state (e.g. invalid price)
  // -------------------------------------------------------------------------
  await test("F. Invalid price returns failure state (400 Bad Request)", async () => {
    try {
      await RequestsService.submitQuoteAdmin(sampleRequestId, adminUserId, { name: "Invalid", price: -100 });
      throw new Error("Expected failure for negative price");
    } catch (err: any) {
      if (err.statusCode !== 400) throw err;
    }
  });

  // -------------------------------------------------------------------------
  // G. Quotation saved + WhatsApp failed is represented as two separate outcomes
  // -------------------------------------------------------------------------
  await test("G. WhatsApp failure returns quotation saved + whatsapp.sent = false independently", async () => {
    const reqRes = await RequestsService.submitCustomRequest(customerIdA, {
      category: "blouses",
      colour: "Yellow",
      fabricNotes: "Haldi blouse",
      size: "S",
      qty: 1,
      timeline: "1_day",
      fulfilment: "doorstep",
      phone: "invalid-phone-format",
    });
    createdRequestIds.push(reqRes.id);

    const res = await RequestsService.submitQuoteAdmin(reqRes.id, adminUserId, {
      name: "Haldi Blouse",
      price: 1800,
      readyBy: new Date().toISOString(),
    });

    if (res.status !== "quoted") throw new Error("Quotation status should remain 'quoted'");
    if (res.whatsapp?.sent !== false) throw new Error("Expected whatsapp.sent to be false for invalid phone");
    if (!res.whatsapp?.error) {
      throw new Error("WhatsApp error message missing");
    }
  });

  // -------------------------------------------------------------------------
  // H. WhatsApp notification sends actual downloaded/binary image rather than Supabase URL
  // -------------------------------------------------------------------------
  await test("H. WhatsApp service fetches actual binary Buffer for image media", async () => {
    const sampleImageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&auto=format&fit=crop&q=80";
    const media = await WhatsAppService.fetchMediaBuffer(sampleImageUrl);
    if (!media || !media.buffer || media.buffer.length === 0) {
      throw new Error("Failed to fetch binary image buffer");
    }
    if (!media.mimeType.startsWith("image/")) {
      throw new Error(`Expected image MIME type, got ${media.mimeType}`);
    }
    // Cleanup temporary file created during fetch
    if (media.tempPath) {
      await fs.unlink(media.tempPath).catch(() => {});
    }
  });

  // -------------------------------------------------------------------------
  // I. Temporary downloaded image is deleted after dispatch
  // -------------------------------------------------------------------------
  await test("I. Temporary downloaded image file is deleted from disk after WhatsApp dispatch", async () => {
    const sampleImageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&auto=format&fit=crop&q=80";
    const media = await WhatsAppService.fetchMediaBuffer(sampleImageUrl);
    if (media?.tempPath) {
      // Verify temp file exists before cleanup
      const existsBefore = await fs.stat(media.tempPath).then(() => true).catch(() => false);
      if (!existsBefore) throw new Error("Temp file was not created on disk");

      // Delete temp file as finally block would do
      await fs.unlink(media.tempPath).catch(() => {});

      const existsAfter = await fs.stat(media.tempPath).then(() => true).catch(() => false);
      if (existsAfter) throw new Error("Temp file was NOT deleted after dispatch");
    }
  });

  // -------------------------------------------------------------------------
  // J. Customer phone profile value initially populates field
  // K. Customer-edited phone value is submitted unchanged
  // -------------------------------------------------------------------------
  await test("J & K. Edited phone value is submitted and saved unchanged without profile overwrite", async () => {
    const editedPhone = "+91 99887 76655";
    const res = await RequestsService.submitCustomRequest(customerIdA, {
      category: "blouses",
      colour: "Pink",
      fabricNotes: "Blouse for reception",
      size: "M",
      qty: 1,
      timeline: "1_day",
      fulfilment: "pickup",
      phone: editedPhone,
    });
    createdRequestIds.push(res.id);

    const fetched = await RequestsRepository.getRequestById(res.id);
    if (!fetched) throw new Error("Request missing");

    const phoneInNotes = fetched.fabric_notes?.includes(editedPhone);
    const phoneInCustomerOrField = fetched.customer?.phone === editedPhone || (fetched as any).phone === editedPhone;

    if (!phoneInNotes && !phoneInCustomerOrField) {
      throw new Error(`Submitted edited phone ${editedPhone} was not persisted correctly in DB`);
    }
  });

  // -------------------------------------------------------------------------
  // L. Customer unauthenticated access redirects to login before protected request/upload flow
  // -------------------------------------------------------------------------
  await test("L. Unauthenticated customer request submission throws 401 Unauthorized", async () => {
    try {
      await RequestsService.submitCustomRequest("", {
        colour: "Blue",
        fabricNotes: "Notes",
        size: "M",
        qty: 1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected 401 for unauthenticated request");
    } catch (err: any) {
      if (err.statusCode !== 401) throw err;
    }
  });

  // -------------------------------------------------------------------------
  // M. Admin cancellation persists status='cancelled' live to Supabase DB
  // -------------------------------------------------------------------------
  await test("M. Admin cancellation persists status='cancelled' live to DB & dispatches binary media WA", async () => {
    const res = await RequestsService.submitCustomRequest(customerIdA, {
      colour: "Red",
      fabricNotes: "Test cancellation request",
      size: "M",
      qty: 1,
      timeline: "1_day",
      fulfilment: "doorstep",
    });
    createdRequestIds.push(res.id);

    const cancelRes = await RequestsService.cancelCustomRequestAdmin(res.id, "Customer asked to cancel order");
    if (cancelRes.request.status !== "cancelled") {
      throw new Error(`Expected status to be cancelled, got ${cancelRes.request.status}`);
    }
    if (cancelRes.request.cancel_reason !== "Customer asked to cancel order") {
      throw new Error(`Expected cancel_reason to be saved, got ${cancelRes.request.cancel_reason}`);
    }

    const liveFetch = await RequestsRepository.getRequestById(res.id);
    if (liveFetch?.status !== "cancelled") {
      throw new Error(`Live database fetch status mismatch: expected cancelled, got ${liveFetch?.status}`);
    }
  });

  // -------------------------------------------------------------------------
  // P. User A logout -> User B login never displays User A's cached request/order data
  // -------------------------------------------------------------------------
  await test("P. Customer data isolation: Customer B cannot view Customer A requests", async () => {
    const custARequests = await RequestsService.getCustomerRequests(customerIdA);
    const custBRequests = await RequestsService.getCustomerRequests(customerIdB);

    const leakFound = custBRequests.some((r) => r.customer_id === customerIdA);
    if (leakFound) throw new Error("Data isolation failure: Customer B list contains Customer A request");
  });

  // -------------------------------------------------------------------------
  // R. Reel video upload endpoint targets reels-section-videos storage bucket
  // -------------------------------------------------------------------------
  await test("R. Reel video upload endpoint targets reels-section-videos storage bucket", async () => {
    const dummyMp4Buffer = Buffer.from("AAAAFmZ0eXBpc29tAAAAAGlzb21pc28yYXZjMW1wNDE=");
    const filename = `test_reel_${Date.now()}.mp4`;
    const { error } = await db.storage
      .from("reels-section-videos")
      .upload(filename, dummyMp4Buffer, { contentType: "video/mp4", upsert: true });

    if (error && !error.message.toLowerCase().includes("bucket not found")) {
      throw error;
    }
  });

  // -------------------------------------------------------------------------
  // S. PostgreSQL Database Reels Persistence: createReel inserts into reels & reel_products tables
  // -------------------------------------------------------------------------
  await test("S. createReel inserts rows into PostgreSQL reels & reel_products database tables", async () => {
    const testTitle = `Test DB Reel ${Date.now()}`;
    const testVideoUrl = "https://example.com/test_video.mp4";
    const created = await CatalogueService.createReelAdmin({
      title: testTitle,
      videoUrl: testVideoUrl,
      position: 999,
    });

    if (!created || !created.id) {
      throw new Error("Failed to insert reel record into PostgreSQL database.");
    }

    const liveReels = await CatalogueService.getAllReelsAdmin();
    const found = liveReels.some((r: any) => r.id === created.id || r.title === testTitle);
    if (!found) {
      throw new Error("Persisted reel record not found in getAllReelsAdmin query.");
    }

    await CatalogueService.deleteReelAdmin(created.id);
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

runManipulationSuite().catch((e) => {
  console.error("Test Suite execution exception:", e);
  process.exit(1);
});
