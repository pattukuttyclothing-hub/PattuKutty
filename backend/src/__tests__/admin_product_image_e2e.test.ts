import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { db, authClient } from "../config/db.js";

// Clean, unmutated service client specifically for test assertions
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

async function runAdminUploadLifecycleSuite() {
  console.log("==================================================");
  console.log(" ADMIN PRODUCT IMAGE UPLOAD REAL E2E TEST SUITE");
  console.log("==================================================");

  const API_BASE = "http://localhost:3001/api/v1";

  // 1. Log in as admin
  const loginRes = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
  });
  const loginJson: any = await loginRes.json();
  const adminToken = loginJson?.data?.token || "";

  // Get Customer Token via isolated authClient
  const { data: usersData } = await cleanDb.auth.admin.listUsers();
  const testCust = usersData?.users?.find((u) => !u.email?.includes("admin"));
  const testEmail = testCust?.email || "customer@gmail.com";
  if (testCust?.id) {
    await cleanDb.auth.admin.updateUserById(testCust.id, { password: "CustomerPassword123!" });
  }
  const custLogin = await authClient.auth.signInWithPassword({
    email: testEmail,
    password: "CustomerPassword123!",
  });
  const customerToken = custLogin.data.session?.access_token || "";

  // UPLOAD-01: Valid admin product image upload
  let uploadedUrl = "";
  let uploadedFilename = "";
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "e2e_product.jpg");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-File-Name": "e2e_product.jpg",
      },
      body: formData,
    });
    const json: any = await res.json();
    uploadedUrl = json?.url || json?.data?.url || "";

    // Verify object actually exists in Supabase Storage using cleanDb list query
    let storageExists = false;
    if (uploadedUrl) {
      const relativePath = uploadedUrl.split("/product-images/").pop() || "";
      uploadedFilename = relativePath.split("/").pop() || "";
      const { data: listData } = await cleanDb.storage.from("product-images").list("products", { search: uploadedFilename });
      storageExists = Array.isArray(listData) && listData.some((f) => f.name === uploadedFilename);
    }

    const passed = res.status === 200 && json.success === true && !!uploadedUrl && storageExists;
    record({
      id: "UPLOAD-01",
      name: "Valid admin product image upload",
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      notes: passed ? `Storage verified cleanly: ${uploadedUrl}` : "Upload or Storage verification failed",
    });
  } catch (err: any) {
    record({ id: "UPLOAD-01", name: "Valid admin product image upload", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // UPLOAD-02: No token
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "e2e_product.jpg");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      body: formData,
    });
    record({
      id: "UPLOAD-02",
      name: "Upload product image without token",
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      notes: "requireAuth middleware rejected missing token",
    });
  } catch (err: any) {
    record({ id: "UPLOAD-02", name: "Upload product image without token", expectedStatus: 401, actualStatus: 500, passed: false, notes: err.message });
  }

  // UPLOAD-03: Malformed token
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "e2e_product.jpg");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: "Bearer malformed.fake.token" },
      body: formData,
    });
    record({
      id: "UPLOAD-03",
      name: "Upload product image with malformed token",
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      notes: "requireAuth middleware rejected invalid token",
    });
  } catch (err: any) {
    record({ id: "UPLOAD-03", name: "Upload product image with malformed token", expectedStatus: 401, actualStatus: 500, passed: false, notes: err.message });
  }

  // UPLOAD-04: Customer token against admin upload endpoint
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "e2e_product.jpg");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: formData,
    });
    record({
      id: "UPLOAD-04",
      name: "Upload product image with customer token",
      expectedStatus: 403,
      actualStatus: res.status,
      passed: res.status === 403,
      notes: "requireAdmin middleware rejected customer role",
    });
  } catch (err: any) {
    record({ id: "UPLOAD-04", name: "Upload product image with customer token", expectedStatus: 403, actualStatus: 500, passed: false, notes: err.message });
  }

  // UPLOAD-05: Invalid MIME type (.txt)
  try {
    const sampleTxt = Buffer.from("Not an image file");
    const blob = new Blob([sampleTxt], { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", blob, "test.txt");

    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-File-Name": "test.txt",
      },
      body: formData,
    });
    record({
      id: "UPLOAD-05",
      name: "Upload product image with invalid MIME type",
      expectedStatus: 415,
      actualStatus: res.status,
      passed: res.status === 415 || res.status === 400,
      notes: "parseAndValidateUpload rejected invalid MIME format",
    });
  } catch (err: any) {
    record({ id: "UPLOAD-05", name: "Upload product image with invalid MIME type", expectedStatus: 415, actualStatus: 500, passed: false, notes: err.message });
  }

  // UPLOAD-06: Deletion of uploaded product image
  if (uploadedUrl && uploadedFilename) {
    try {
      const res = await fetch(`${API_BASE}/admin/delete/product-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ imageUrl: uploadedUrl }),
      });
      const json: any = await res.json();

      // Verify object no longer exists in Storage via direct storage list query
      const { data: listData } = await cleanDb.storage.from("product-images").list("products", { search: uploadedFilename });
      const isDeletedFromStorage = !Array.isArray(listData) || !listData.some((f) => f.name === uploadedFilename);

      const passed = res.status === 200 && json.success === true && isDeletedFromStorage;
      record({
        id: "UPLOAD-06",
        name: "Authenticated deletion of product image",
        expectedStatus: 200,
        actualStatus: res.status,
        passed,
        notes: passed ? "Storage object removed cleanly and verified via list query" : "Deletion failed",
      });
    } catch (err: any) {
      record({ id: "UPLOAD-06", name: "Authenticated deletion of product image", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
    }
  }

  console.log("\n==================================================");
  console.log(" UPLOAD E2E SUITE SUMMARY");
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

runAdminUploadLifecycleSuite().then(() => process.exit(0)).catch(() => process.exit(1));
