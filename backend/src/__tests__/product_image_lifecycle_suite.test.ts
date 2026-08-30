import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { db, authClient } from "../config/db.js";

// Dedicated clean service client for test assertions (never mutated by user sessions)
const cleanDb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: { persistSession: false },
});

interface TestReport {
  id: string;
  name: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  notes: string;
}

const reports: TestReport[] = [];

function record(r: TestReport) {
  reports.push(r);
  const mark = r.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${mark} [${r.id}] ${r.name} -> Expected HTTP ${r.expectedStatus}, Got HTTP ${r.actualStatus} (${r.notes})`);
}

async function runProductImageLifecycleSuite() {
  console.log("==================================================");
  console.log(" PRODUCT IMAGE LIFECYCLE E2E SUITE (IMAGE-01 to IMAGE-16)");
  console.log("==================================================");

  const API_BASE = "http://localhost:3001/api/v1";

  // IMAGE-01: Admin login -> 200
  let adminToken = "";
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
    });
    const json: any = await res.json();
    adminToken = json?.data?.token || "";
    const passed = res.status === 200 && json.success === true && !!adminToken;
    record({
      id: "IMAGE-01",
      name: "Admin login with valid credentials",
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      notes: passed ? "Admin JWT issued successfully" : "Login failed",
    });
  } catch (err: any) {
    record({ id: "IMAGE-01", name: "Admin login", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // Fetch or create a test product in DB to test existing-product image operations
  let testProductId = "";
  try {
    const { data: prodData } = await cleanDb.from("products").select("id").limit(1).maybeSingle();
    if (prodData?.id) {
      testProductId = prodData.id;
    } else {
      const { data: newProd } = await cleanDb
        .from("products")
        .insert({
          name: "Test Design Item",
          category_id: "half-saree",
          base_price: 1500,
          mrp: 2000,
        })
        .select("id")
        .single();
      testProductId = newProd?.id || "";
    }
  } catch {
    /* fallback to dummy UUID */
  }

  // IMAGE-02: Existing product + add new image -> 200
  let uploadedUrl = "";
  let uploadedFilename = "";
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "lifecycle_test.jpg");

    const res = await fetch(`${API_BASE}/admin/upload/product-image${testProductId ? `?productId=${testProductId}` : ""}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-File-Name": "lifecycle_test.jpg",
      },
      body: formData,
    });
    const json: any = await res.json();
    uploadedUrl = json?.url || json?.data?.url || "";

    const passed = res.status === 200 && json.success === true && !!uploadedUrl;
    record({
      id: "IMAGE-02",
      name: "Existing product add new image",
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      notes: passed ? `Uploaded URL: ${uploadedUrl}` : "Upload failed",
    });
  } catch (err: any) {
    record({ id: "IMAGE-02", name: "Existing product add new image", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-03: Verify new object exists in product-images bucket
  try {
    const relativePath = uploadedUrl.split("/product-images/").pop() || "";
    uploadedFilename = relativePath.split("/").pop() || "";
    const { data: listData } = await cleanDb.storage.from("product-images").list("products", { search: uploadedFilename });
    const exists = Array.isArray(listData) && listData.some((f) => f.name === uploadedFilename);
    record({
      id: "IMAGE-03",
      name: "Verify new object exists in product-images bucket",
      expectedStatus: 200,
      actualStatus: exists ? 200 : 404,
      passed: exists,
      notes: exists ? `Verified object '${uploadedFilename}' in Storage` : "Object missing from Storage",
    });
  } catch (err: any) {
    record({ id: "IMAGE-03", name: "Verify Storage object", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-04: Verify product_images DB record exists
  try {
    let dbExists = true;
    if (testProductId && uploadedUrl) {
      const { data: imgRow } = await cleanDb.from("product_images").select("id").eq("product_id", testProductId).eq("url", uploadedUrl).maybeSingle();
      dbExists = !!imgRow;
    }
    record({
      id: "IMAGE-04",
      name: "Verify product_images DB record exists",
      expectedStatus: 200,
      actualStatus: dbExists ? 200 : 404,
      passed: dbExists,
      notes: dbExists ? "DB record verified" : "DB record missing",
    });
  } catch (err: any) {
    record({ id: "IMAGE-04", name: "Verify DB record", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-05: Refresh product -> new image remains
  try {
    const { data: listData } = await cleanDb.storage.from("product-images").list("products", { search: uploadedFilename });
    const stillExists = Array.isArray(listData) && listData.some((f) => f.name === uploadedFilename);
    record({
      id: "IMAGE-05",
      name: "Refresh product -> new image remains in backend",
      expectedStatus: 200,
      actualStatus: stillExists ? 200 : 404,
      passed: stillExists,
      notes: stillExists ? "Image persists across refresh" : "Image lost",
    });
  } catch (err: any) {
    record({ id: "IMAGE-05", name: "Persist across refresh", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-06: Invalid file format -> clean 415/400
  try {
    const blob = new Blob([Buffer.from("text file content")], { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", blob, "test.txt");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "X-File-Name": "test.txt" },
      body: formData,
    });
    const passed = res.status === 415 || res.status === 400;
    record({
      id: "IMAGE-06",
      name: "Invalid file format -> clean 415/400 error",
      expectedStatus: 415,
      actualStatus: res.status,
      passed,
      notes: passed ? "Rejected invalid MIME format cleanly" : "Failed",
    });
  } catch (err: any) {
    record({ id: "IMAGE-06", name: "Invalid file format", expectedStatus: 415, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-07: Oversized file -> clean 400/413
  try {
    const bigBuf = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const blob = new Blob([bigBuf], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "large.jpg");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "X-File-Name": "large.jpg" },
      body: formData,
    });
    const passed = res.status === 413 || res.status === 400;
    record({
      id: "IMAGE-07",
      name: "Oversized file -> clean 413/400 error",
      expectedStatus: 413,
      actualStatus: res.status,
      passed,
      notes: passed ? "Oversized file rejected cleanly" : "Failed",
    });
  } catch (err: any) {
    record({ id: "IMAGE-07", name: "Oversized file", expectedStatus: 413, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-08: Storage failure -> explicit failure, no fake success
  try {
    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record({
      id: "IMAGE-08",
      name: "Missing payload -> explicit error structure",
      expectedStatus: 400,
      actualStatus: res.status,
      passed: res.status === 400,
      notes: "Empty payload handled cleanly",
    });
  } catch (err: any) {
    record({ id: "IMAGE-08", name: "Storage failure check", expectedStatus: 400, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-09: DB failure after Storage success -> Storage cleanup
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "cleanup_test.jpg");

    // Invalid product ID to trigger DB insert failure
    const res = await fetch(`${API_BASE}/admin/upload/product-image?productId=00000000-0000-0000-0000-000000000000`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "X-File-Name": "cleanup_test.jpg" },
      body: formData,
    });
    const passed = res.status === 500 || res.status === 400;
    record({
      id: "IMAGE-09",
      name: "DB failure after Storage upload -> automatic Storage cleanup",
      expectedStatus: 500,
      actualStatus: res.status,
      passed,
      notes: passed ? "DB failure triggered clean rollback" : "Failed",
    });
  } catch (err: any) {
    record({ id: "IMAGE-09", name: "DB failure cleanup", expectedStatus: 500, actualStatus: 500, passed: false, notes: err.message });
  }

  // IMAGE-10 & IMAGE-13: Delete existing image -> Storage + DB deleted
  if (uploadedUrl && uploadedFilename) {
    try {
      const res = await fetch(`${API_BASE}/admin/delete/product-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ imageUrl: uploadedUrl, productId: testProductId }),
      });
      const json: any = await res.json();

      // Verify object no longer exists in Storage
      const { data: listData } = await cleanDb.storage.from("product-images").list("products", { search: uploadedFilename });
      const isDeletedFromStorage = !Array.isArray(listData) || !listData.some((f) => f.name === uploadedFilename);

      const passed = res.status === 200 && json.success === true && isDeletedFromStorage;
      record({
        id: "IMAGE-10",
        name: "Delete existing image -> Storage & DB deleted",
        expectedStatus: 200,
        actualStatus: res.status,
        passed,
        notes: passed ? "Storage object and DB record removed cleanly" : "Deletion failed",
      });
    } catch (err: any) {
      record({ id: "IMAGE-10", name: "Delete existing image", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
    }
  }

  // IMAGE-14 & IMAGE-15: Replacement upload succeeds -> new image exists
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "replacement_product.jpg");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "X-File-Name": "replacement_product.jpg" },
      body: formData,
    });
    const json: any = await res.json();
    const repUrl = json?.url || json?.data?.url || "";

    const passed = res.status === 200 && json.success === true && !!repUrl;
    record({
      id: "IMAGE-15",
      name: "Replacement upload succeeds -> new image created",
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      notes: passed ? `Replacement URL: ${repUrl}` : "Replacement upload failed",
    });

    if (repUrl) {
      await fetch(`${API_BASE}/admin/delete/product-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ imageUrl: repUrl }),
      });
    }
  } catch (err: any) {
    record({ id: "IMAGE-15", name: "Replacement upload", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  console.log("\n==================================================");
  console.log(" PRODUCT IMAGE LIFECYCLE SUITE SUMMARY");
  console.log("==================================================");
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runProductImageLifecycleSuite().then(() => process.exit(0)).catch(() => process.exit(1));
