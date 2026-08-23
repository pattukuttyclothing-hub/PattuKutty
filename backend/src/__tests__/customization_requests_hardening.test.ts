/**
 * Customization Request / Design Studio Hardening Automated Test Suite
 *
 * SPECIFICATION REFERENCE: customization-request-page-customer.md (§20 Test Scenarios 1 to 25)
 *
 * Run with: npx tsx src/__tests__/customization_requests_hardening.test.ts
 */

import { RequestsService } from "../services/requests.service.js";
import { RequestsRepository } from "../repositories/requests.repository.js";
import { db } from "../config/db.js";

const pass = (msg: string) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const fail = (msg: string, err?: unknown) => {
  const e = err as any;
  const details = e?.message || e?.details || e?.hint || e?.code || (typeof e === "object" ? JSON.stringify(e) : String(e));
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}\n    Error: ${details}`);
  if (e?.stack) console.error(`    Stack: ${e.stack}`);
  process.exitCode = 1;
};

async function runCustomizationTests() {
  console.log("\n==================================================");
  console.log(" CUSTOMIZATION REQUEST HARDENING TEST SUITE (30/30)");
  console.log("==================================================\n");

  let passedCount = 0;
  let failedCount = 0;
  const createdIds: string[] = [];

  // Helper customer IDs (valid auth.users UUIDs)
  const customerA = "7911f31c-3339-4f96-9074-120d8133d275";
  const customerB = "cdd8a189-a7ce-4b44-86d6-03f65b0573c6";

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      pass(name);
      passedCount++;
    } catch (err) {
      fail(name, err instanceof Error ? err.message : String(err));
      failedCount++;
    }
  }

  // 1. Valid customization request
  await test("1. Valid customization request (DB insertion & returned fields)", async () => {
    const payload = {
      category: "half-saree",
      sub: "lehenga",
      colour: "Rani Pink",
      description: "Custom bridal lehenga with gold thread embroidery and dupion silk lining.",
      size: "M",
      qty: 1,
      timeline: "1_day",
      fulfilment: "doorstep",
      images: ["https://example.com/reference1.jpg"],
    };

    const res = await RequestsService.submitCustomRequest(customerA, payload);
    if (!res || !res.id || !res.request_no) {
      throw new Error("Response missing ID or request_no");
    }
    if (res.status !== "submitted") {
      throw new Error(`Expected status 'submitted', got '${res.status}'`);
    }
    if (res.customer_id !== customerA) {
      throw new Error("Customer ID mismatch");
    }
    createdIds.push(res.id);
  });

  // 2. Missing colour
  await test("2. Missing colour (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "   ",
        fabricNotes: "Notes",
        size: "M",
        qty: 1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for missing colour");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("colour")) {
        throw err;
      }
    }
  });

  // 3. Missing fabric notes
  await test("3. Missing fabric notes (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "",
        size: "M",
        qty: 1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for missing fabric notes");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.toLowerCase().includes("fabric")) {
        throw err;
      }
    }
  });

  // 4. Missing size
  await test("4. Missing size (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "Some details",
        size: "  ",
        qty: 1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for missing size");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("size")) {
        throw err;
      }
    }
  });

  // 5. Qty = 0
  await test("5. Qty = 0 (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 0,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for qty=0");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("Quantity")) {
        throw err;
      }
    }
  });

  // 6. Qty = -1
  await test("6. Qty = -1 (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: -1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for qty=-1");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("Quantity")) {
        throw err;
      }
    }
  });

  // 7. Non-integer qty
  await test("7. Non-integer qty (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 2.5,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for float qty");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("Quantity")) {
        throw err;
      }
    }
  });

  // 8. Missing timeline
  await test("8. Missing timeline (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 1,
        timeline: "",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for missing timeline");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("timeline")) {
        throw err;
      }
    }
  });

  // 9. Invalid timeline
  await test("9. Invalid timeline (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 1,
        timeline: "invalid-timeline-xyz",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for invalid timeline");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("timeline")) {
        throw err;
      }
    }
  });

  // 10. Invalid fulfilment
  await test("10. Invalid fulfilment (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 1,
        timeline: "1_day",
        fulfilment: "express_delivery",
      });
      throw new Error("Expected failure for invalid fulfilment");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("Fulfilment")) {
        throw err;
      }
    }
  });

  // 11. Missing reference_image_urls
  await test("11. Missing reference_image_urls (defaulted to [])", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      colour: "Gold",
      fabricNotes: "Plain gold blouse with boat neck",
      size: "L",
      qty: 1,
      timeline: "1_day",
      fulfilment: "pickup",
    });
    if (!Array.isArray(res.reference_image_urls) || res.reference_image_urls.length !== 0) {
      throw new Error("Expected reference_image_urls to default to []");
    }
    createdIds.push(res.id);
  });

  // 12. Null reference_image_urls
  await test("12. Null reference_image_urls (handled safely as [])", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      colour: "Gold",
      fabricNotes: "Blouse notes",
      size: "L",
      qty: 1,
      timeline: "1_day",
      fulfilment: "pickup",
      referenceImageUrls: null,
    });
    if (!Array.isArray(res.reference_image_urls)) {
      throw new Error("Expected reference_image_urls to be array");
    }
    createdIds.push(res.id);
  });

  // 13. Invalid category slug
  await test("13. Invalid category slug (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        category: "non-existent-category-slug-123",
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for invalid category slug");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("category")) {
        throw err;
      }
    }
  });

  // 14. Valid category slug -> UUID resolution
  await test("14. Valid category slug (resolves slug to category UUID in DB)", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      category: "half-saree",
      colour: "Emerald Green",
      fabricNotes: "Half saree with silver zari border",
      size: "S",
      qty: 1,
      timeline: "2_days",
      fulfilment: "doorstep",
    });
    if (!res.category_id || typeof res.category_id !== "string") {
      throw new Error("Expected category_id to be resolved UUID string");
    }
    // Verify it matches the UUID of category slug 'half-saree'
    const catUuid = await RequestsRepository.resolveCategoryUuid("half-saree");
    if (res.category_id !== catUuid) {
      throw new Error(`Resolved category UUID mismatch: expected ${catUuid}, got ${res.category_id}`);
    }
    createdIds.push(res.id);
  });

  // 15. Invalid subcategory slug
  await test("15. Invalid subcategory slug (returns 400 error)", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, {
        category: "half-saree",
        sub: "invalid-sub-slug-abc",
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected failure for invalid subcategory slug");
    } catch (err: any) {
      if (err.statusCode !== 400 || !err.message.includes("subcategory")) {
        throw err;
      }
    }
  });

  // 16. Unauthenticated submission
  await test("16. Unauthenticated submission (returns 401 error)", async () => {
    try {
      await RequestsService.submitCustomRequest("", {
        colour: "Red",
        fabricNotes: "Details",
        size: "M",
        qty: 1,
        timeline: "1_day",
        fulfilment: "doorstep",
      });
      throw new Error("Expected 401 for unauthenticated submission");
    } catch (err: any) {
      if (err.statusCode !== 401) {
        throw err;
      }
    }
  });

  // 17. Customer A cannot create request for customer B
  await test("17. Customer A cannot create request for customer B (enforces authenticated user identity)", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      customerId: customerB, // Browser payload attempts to inject customerB
      colour: "Navy",
      fabricNotes: "Details for customer A",
      size: "M",
      qty: 1,
      timeline: "1_day",
      fulfilment: "doorstep",
    });
    if (res.customer_id !== customerA) {
      throw new Error("Failed: Customer ID was taken from payload instead of authenticated user");
    }
    createdIds.push(res.id);
  });

  // 18. Database Row Integrity Check
  await test("18. DB Row Integrity Verification (NOT NULL fields, status='submitted')", async () => {
    const lastId = createdIds[createdIds.length - 1]!;
    const { data, error } = await db.from("custom_requests").select("*").eq("id", lastId).single();
    if (error || !data) {
      throw new Error("Database query failed to retrieve inserted request");
    }
    if (data.status !== "submitted") {
      throw new Error(`DB status mismatch: expected 'submitted', got '${data.status}'`);
    }
    if (!data.customer_id || (!data.colour_id && !data.custom_colour_image_url) || !data.fabric_notes || !data.size || !data.qty || !data.timeline_id || !data.fulfilment) {
      throw new Error("One or more required fields are missing in DB row");
    }
  });

  // 19. DB Error Handling / Invalid payload type
  await test("19. Invalid payload type handling", async () => {
    try {
      await RequestsService.submitCustomRequest(customerA, null as any);
      throw new Error("Expected failure for null payload");
    } catch (err: any) {
      if (err.statusCode !== 400) {
        throw err;
      }
    }
  });

  // 20. GET /requests filters by customer ownership
  await test("20. GET /requests filters by authenticated customer ownership", async () => {
    const custARequests = await RequestsService.getCustomerRequests(customerA);
    const custBRequests = await RequestsService.getCustomerRequests(customerB);

    if (!Array.isArray(custARequests) || custARequests.length === 0) {
      throw new Error("Expected customer A requests");
    }
    const hasCustBInCustA = custARequests.some((r) => r.customer_id === customerB);
    if (hasCustBInCustA) {
      throw new Error("Customer A list contains Customer B requests");
    }
  });

  // 21. Request detail accessible by owner
  await test("21. Request detail GET /requests/:id accessible by owner", async () => {
    const lastId = createdIds[createdIds.length - 1]!;
    const res = await RequestsService.getRequestById(lastId, customerA);
    if (!res || res.id !== lastId) {
      throw new Error("Failed to fetch request detail for owner");
    }
  });

  // 22. Request detail inaccessible by another customer (403 Forbidden)
  await test("22. Request detail GET /requests/:id returns 403 Forbidden for non-owner", async () => {
    const lastId = createdIds[createdIds.length - 1]!;
    try {
      await RequestsService.getRequestById(lastId, customerB);
      throw new Error("Expected 403 Forbidden when customer B attempts to access customer A request");
    } catch (err: any) {
      if (err.statusCode !== 403) {
        throw err;
      }
    }
  });

  // 23. Request changes PATCH /requests/:id/request-changes by owner
  await test("23. Request changes by owner (requestChanges)", async () => {
    const lastId = createdIds[createdIds.length - 1]!;
    const updated = await RequestsService.requestChanges(lastId, customerA, "Please change sleeve length to 10 inches");
    if (!updated || updated.update_request_note !== "Please change sleeve length to 10 inches") {
      throw new Error("Failed to record request changes");
    }
  });

  // 24. Request cancellation PATCH /requests/:id/cancel by owner
  await test("24. Request cancellation by owner (cancelCustomRequest)", async () => {
    const lastId = createdIds[createdIds.length - 1]!;
    const cancelled = await RequestsService.cancelCustomRequest(lastId, customerA, "Function date postponed");
    if (!cancelled || cancelled.status !== "cancelled" || cancelled.cancel_reason !== "Function date postponed") {
      throw new Error("Failed to cancel request");
    }
  });

  // 25. Request cancellation denied for non-owner (403 Forbidden)
  await test("25. Request cancellation denied for non-owner", async () => {
    const targetId = createdIds[0]!;
    try {
      await RequestsService.cancelCustomRequest(targetId, customerB, "Malicious cancel");
      throw new Error("Expected 403 Forbidden when Customer B attempts to cancel Customer A request");
    } catch (err: any) {
      if (err.statusCode !== 403) {
        throw err;
      }
    }
  });

  // 26. Size Flexibility — XXL size label without body measurements
  await test("26. Size Flexibility — XXL size label without body measurements", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      colour: "Emerald",
      fabricNotes: "Heavy silk lehenga in XXL size",
      size: "XXL",
      qty: 1,
      timeline: "2_days",
      fulfilment: "doorstep",
    });
    if (!res || res.size !== "XXL") {
      throw new Error("Expected size to be saved as XXL");
    }
    createdIds.push(res.id);
  });

  // 27. Size Flexibility — XXXL size label without body measurements
  await test("27. Size Flexibility — XXXL size label without body measurements", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      colour: "Gold",
      fabricNotes: "Patterned saree blouse in XXXL size",
      size: "XXXL",
      qty: 1,
      timeline: "1_day",
      fulfilment: "pickup",
    });
    if (!res || res.size !== "XXXL") {
      throw new Error("Expected size to be saved as XXXL");
    }
    createdIds.push(res.id);
  });

  // 28. Size + Partial Measurements — Unknown measurements omitted (No fake 0/N/A values)
  await test("28. Size + Known Measurements — Unknown measurements omitted", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      colour: "Maroon",
      fabricNotes: "Designer frock",
      size: "XL",
      measurements: {
        waist_round: 36,
        bust_round: 40,
        // hip_round is omitted intentionally
      },
      qty: 1,
      timeline: "3_days",
      fulfilment: "doorstep",
    });
    if (!res || !res.fabric_notes.includes("waist round: 36\"") || !res.fabric_notes.includes("bust round: 40\"")) {
      throw new Error("Expected provided measurements in fabric_notes");
    }
    if (res.fabric_notes.includes("hip_round") || res.fabric_notes.includes("N/A") || res.fabric_notes.includes(": 0\"")) {
      throw new Error("Found fake measurement or unprovided key in fabric_notes");
    }
    createdIds.push(res.id);
  });

  // 29. Phone prefilled & final edited value persisted
  await test("29. Phone prefilled & edited value persisted", async () => {
    const res = await RequestsService.submitCustomRequest(customerA, {
      colour: "Ivory",
      fabricNotes: "Custom embroidery blouse",
      phone: "+91 93455 20768",
      size: "L",
      qty: 1,
      timeline: "1_day",
      fulfilment: "pickup",
    });
    if (!res || !res.fabric_notes.includes("+91 93455 20768")) {
      throw new Error("Expected contact phone to be persisted in request notes");
    }
    createdIds.push(res.id);
  });

  // 30. Supabase Storage URLs persisted (Images & Voice Note)
  await test("30. Supabase Storage URLs persisted in DB", async () => {
    const storageImgUrl = "https://tfdpnrdnoxriwdbzuxrv.supabase.co/storage/v1/object/public/custom-design-request-images/sample.jpg";
    const storageAudioUrl = "https://tfdpnrdnoxriwdbzuxrv.supabase.co/storage/v1/object/public/custom-design-request-audio/sample.webm";
    const res = await RequestsService.submitCustomRequest(customerA, {
      colour: "Navy",
      customColourImageUrl: storageImgUrl,
      voiceNoteUrl: storageAudioUrl,
      referenceImageUrls: [storageImgUrl],
      fabricNotes: "Audio and image uploaded to Supabase Storage",
      size: "M",
      qty: 1,
      timeline: "1_day",
      fulfilment: "doorstep",
    });
    if (!res || res.custom_colour_image_url !== storageImgUrl || res.voice_note_url !== storageAudioUrl || !res.reference_image_urls.includes(storageImgUrl)) {
      throw new Error("Storage URLs were not persisted correctly in DB");
    }
    createdIds.push(res.id);
  });

  // Cleanup created test rows
  console.log("\nCleaning up test rows...");
  if (createdIds.length > 0) {
    await db.from("custom_requests").delete().in("id", createdIds);
    console.log(`Cleaned up ${createdIds.length} test rows from database.`);
  }

  console.log("\n==================================================");
  console.log(` RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runCustomizationTests().catch((err) => {
  console.error("Test suite execution failed:", err);
  process.exit(1);
});
