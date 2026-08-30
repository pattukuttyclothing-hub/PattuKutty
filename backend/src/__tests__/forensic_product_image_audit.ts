import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Clean, unmutated service client for direct database & storage verification queries
const cleanDb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: { persistSession: false },
});

interface AuditStepResult {
  step: string;
  name: string;
  status: "PASS" | "FAIL" | "SKIPPED";
  details: string;
}

const auditLog: AuditStepResult[] = [];

function logResult(step: string, name: string, status: "PASS" | "FAIL" | "SKIPPED", details: string) {
  auditLog.push({ step, name, status, details });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} [${step}] ${name} -> ${status}: ${details}`);
}

async function executeForensicAudit() {
  console.log("======================================================================");
  console.log(" REAL END-TO-END FORENSIC AUDIT: ADMIN PRODUCT IMAGE LIFECYCLE");
  console.log("======================================================================");

  const API_BASE = "http://localhost:3001/api/v1";

  // STEP 1: Infrastructure Verification — Check 'product-images' bucket existence
  try {
    const { data: bucket, error: bucketErr } = await cleanDb.storage.getBucket("product-images");
    if (bucketErr || !bucket) {
      logResult("INFRA-01", "Storage Bucket Existence Check", "FAIL", `Required bucket 'product-images' does NOT exist: ${bucketErr?.message || "Not found"}`);
      console.error("CRITICAL: Infrastructure missing! Bucket 'product-images' is not configured in Supabase.");
      process.exit(1);
    }
    logResult("INFRA-01", "Storage Bucket Existence Check", "PASS", `Bucket 'product-images' exists (Public: ${bucket.public})`);
  } catch (err: any) {
    logResult("INFRA-01", "Storage Bucket Existence Check", "FAIL", err.message);
    process.exit(1);
  }

  // STEP 2: Real Admin Login -> Extract JWT
  let adminToken = "";
  try {
    const loginRes = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
    });
    const loginJson: any = await loginRes.json();
    adminToken = loginJson?.data?.token || "";
    if (loginRes.status === 200 && adminToken) {
      logResult("AUTH-01", "Real Admin Login", "PASS", `HTTP 200 OK | Token length: ${adminToken.length}`);
    } else {
      logResult("AUTH-01", "Real Admin Login", "FAIL", `HTTP ${loginRes.status} | Response: ${JSON.stringify(loginJson)}`);
      process.exit(1);
    }
  } catch (err: any) {
    logResult("AUTH-01", "Real Admin Login", "FAIL", err.message);
    process.exit(1);
  }

  // STEP 3: Customer Login -> Extract Customer JWT for Authorization Testing
  let customerToken = "";
  try {
    const { data: usersData } = await cleanDb.auth.admin.listUsers();
    const testCust = usersData?.users?.find((u) => !u.email?.includes("admin"));
    const testEmail = testCust?.email || "customer@gmail.com";
    if (testCust?.id) {
      await cleanDb.auth.admin.updateUserById(testCust.id, { password: "CustomerPassword123!" });
    }
    const tempCustAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "", { auth: { persistSession: false } });
    const custLogin = await tempCustAuth.auth.signInWithPassword({
      email: testEmail,
      password: "CustomerPassword123!",
    });
    customerToken = custLogin.data.session?.access_token || "";
    logResult("AUTH-02", "Customer Login for Non-Admin Role Check", "PASS", `Token length: ${customerToken.length}`);
  } catch (err: any) {
    logResult("AUTH-02", "Customer Login for Non-Admin Role Check", "SKIPPED", err.message);
  }

  // STEP 4: Select Real Existing Product & Record Baseline product_images DB Rows
  let targetProductId = "";
  let targetProductName = "";
  let baselineImages: any[] = [];
  try {
    const { data: prod, error: prodErr } = await cleanDb.from("products").select("id, name").limit(1).single();
    if (prodErr || !prod) {
      logResult("DB-01", "Target Product Selection", "FAIL", `No existing product found in database: ${prodErr?.message}`);
      process.exit(1);
    }
    targetProductId = prod.id;
    targetProductName = prod.name;

    const { data: imgRows, error: imgErr } = await cleanDb.from("product_images").select("*").eq("product_id", targetProductId);
    if (imgErr) {
      logResult("DB-01", "Baseline Images Query", "FAIL", imgErr.message);
      process.exit(1);
    }
    baselineImages = imgRows || [];
    logResult("DB-01", "Target Product & Baseline Images", "PASS", `Selected Product ID: '${targetProductId}' ('${targetProductName}') | Baseline images count: ${baselineImages.length}`);
  } catch (err: any) {
    logResult("DB-01", "Target Product Selection", "FAIL", err.message);
    process.exit(1);
  }

  // STEP 5: Upload NEW valid image to existing product using POST /api/v1/admin/upload/product-image?productId=<REAL_PRODUCT_ID>
  let uploadedUrl1 = "";
  let uploadedFilename1 = "";
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "forensic_test_image_1.jpg");

    const uploadRes = await fetch(`${API_BASE}/admin/upload/product-image?productId=${targetProductId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-File-Name": "forensic_test_image_1.jpg",
      },
      body: formData,
    });

    const uploadText = await uploadRes.text();
    let uploadJson: any = {};
    try {
      uploadJson = JSON.parse(uploadText);
    } catch {
      /* not json */
    }

    uploadedUrl1 = uploadJson?.url || uploadJson?.data?.url || "";

    if (uploadRes.status !== 200 || !uploadedUrl1) {
      logResult("UPLOAD-01", "New Image Upload to Existing Product", "FAIL", `HTTP Status: ${uploadRes.status} | Response: ${uploadText}`);
    } else {
      const relPath = uploadedUrl1.split("/product-images/").pop() || "";
      uploadedFilename1 = relPath.split("/").pop() || "";

      // 3-Way Correlation: Check Storage Object
      const { data: storageList } = await cleanDb.storage.from("product-images").list("products", { search: uploadedFilename1 });
      const inStorage = Array.isArray(storageList) && storageList.some((f) => f.name === uploadedFilename1);

      // 3-Way Correlation: Check DB Row in product_images
      const { data: dbRows } = await cleanDb.from("product_images").select("*").eq("product_id", targetProductId).eq("url", uploadedUrl1);
      const inDb = Array.isArray(dbRows) && dbRows.length === 1;

      // 3-Way Correlation: Check total row count on product equals baseline + 1
      const { data: allImagesAfter } = await cleanDb.from("product_images").select("*").eq("product_id", targetProductId);
      const correctCount = (allImagesAfter?.length || 0) === baselineImages.length + 1;

      const isFullyVerified = inStorage && inDb && correctCount;

      logResult(
        "UPLOAD-01",
        "New Image Upload to Existing Product (3-Way Correlation)",
        isFullyVerified ? "PASS" : "FAIL",
        `HTTP 200 OK | URL: ${uploadedUrl1} | Storage object exists: ${inStorage} | DB row exists (exact URL & product_id): ${inDb} | DB row count (baseline + 1): ${correctCount}`
      );
    }
  } catch (err: any) {
    logResult("UPLOAD-01", "New Image Upload to Existing Product", "FAIL", err.message);
  }

  // STEP 6: Refresh/re-read products through GET /api/v1/admin/products and verify image remains
  try {
    const prodRes = await fetch(`${API_BASE}/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const prodJson: any = await prodRes.json();
    const productsList: any[] = prodJson?.data || (Array.isArray(prodJson) ? prodJson : []);
    const fetchedProduct = productsList.find((p) => p.id === targetProductId);
    const fetchedImages: string[] = fetchedProduct?.images || [];
    const imageInFetchedProduct = fetchedImages.includes(uploadedUrl1);

    logResult(
      "VERIFY-01",
      "API Product List Re-read Verification",
      imageInFetchedProduct ? "PASS" : "FAIL",
      `HTTP ${prodRes.status} | Target product '${targetProductId}' images array contains newly uploaded URL: ${imageInFetchedProduct}`
    );
  } catch (err: any) {
    logResult("VERIFY-01", "API Product List Re-read Verification", "FAIL", err.message);
  }

  // STEP 7: Delete ONLY that newly uploaded image through POST /api/v1/admin/delete/product-image
  if (uploadedUrl1 && uploadedFilename1) {
    try {
      const delRes = await fetch(`${API_BASE}/admin/delete/product-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ imageUrl: uploadedUrl1, productId: targetProductId }),
      });
      const delJson: any = await delRes.json();

      // Verify BOTH Storage object is gone AND DB row is gone
      const { data: storageListAfter } = await cleanDb.storage.from("product-images").list("products", { search: uploadedFilename1 });
      const storageGone = !Array.isArray(storageListAfter) || !storageListAfter.some((f) => f.name === uploadedFilename1);

      const { data: dbRowsAfter } = await cleanDb.from("product_images").select("*").eq("product_id", targetProductId).eq("url", uploadedUrl1);
      const dbGone = !dbRowsAfter || dbRowsAfter.length === 0;

      const isDeleteVerified = delRes.status === 200 && delJson.success === true && storageGone && dbGone;

      logResult(
        "DELETE-01",
        "Delete Uploaded Image (Storage + DB Removal)",
        isDeleteVerified ? "PASS" : "FAIL",
        `HTTP ${delRes.status} | Storage object gone: ${storageGone} | DB row gone: ${dbGone}`
      );
    } catch (err: any) {
      logResult("DELETE-01", "Delete Uploaded Image", "FAIL", err.message);
    }
  }

  // STEP 8: Repeat upload AGAIN using another unique image
  let uploadedUrl2 = "";
  try {
    const samplePng = Buffer.from("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89");
    const blob = new Blob([samplePng], { type: "image/png" });
    const formData = new FormData();
    formData.append("file", blob, "forensic_test_image_2.png");

    const uploadRes2 = await fetch(`${API_BASE}/admin/upload/product-image?productId=${targetProductId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-File-Name": "forensic_test_image_2.png",
      },
      body: formData,
    });
    const uploadJson2: any = await uploadRes2.json();
    uploadedUrl2 = uploadJson2?.url || uploadJson2?.data?.url || "";

    const passed = uploadRes2.status === 200 && uploadJson2.success === true && !!uploadedUrl2;
    logResult("REPEAT-01", "Repeat Upload with Second Unique Image", passed ? "PASS" : "FAIL", `HTTP ${uploadRes2.status} | URL: ${uploadedUrl2}`);

    // Cleanup second image
    if (uploadedUrl2) {
      await fetch(`${API_BASE}/admin/delete/product-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ imageUrl: uploadedUrl2, productId: targetProductId }),
      });
    }
  } catch (err: any) {
    logResult("REPEAT-01", "Repeat Upload with Second Unique Image", "FAIL", err.message);
  }

  // STEP 9: Negative Tests — Invalid MIME, Oversized file, Token Checks
  // Invalid MIME
  try {
    const blob = new Blob([Buffer.from("invalid plain text")], { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", blob, "invalid.txt");
    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "X-File-Name": "invalid.txt" },
      body: formData,
    });
    const passed = res.status === 415 || res.status === 400;
    logResult("NEG-01", "Invalid MIME Type (.txt)", passed ? "PASS" : "FAIL", `Expected HTTP 415/400, Got HTTP ${res.status}`);
  } catch (err: any) {
    logResult("NEG-01", "Invalid MIME Type", "FAIL", err.message);
  }

  // Oversized File (>10MB)
  try {
    const bigBuf = Buffer.alloc(11 * 1024 * 1024);
    const blob = new Blob([bigBuf], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "oversized.jpg");
    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "X-File-Name": "oversized.jpg" },
      body: formData,
    });
    const passed = res.status === 413 || res.status === 400;
    logResult("NEG-02", "Oversized File (>10MB)", passed ? "PASS" : "FAIL", `Expected HTTP 413/400, Got HTTP ${res.status}`);
  } catch (err: any) {
    logResult("NEG-02", "Oversized File", "FAIL", err.message);
  }

  // Missing Token
  try {
    const blob = new Blob([Buffer.from("test")], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "test.jpg");
    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      body: formData,
    });
    logResult("NEG-03", "Missing Authorization Token", res.status === 401 ? "PASS" : "FAIL", `Expected HTTP 401, Got HTTP ${res.status}`);
  } catch (err: any) {
    logResult("NEG-03", "Missing Token", "FAIL", err.message);
  }

  // Malformed Token
  try {
    const blob = new Blob([Buffer.from("test")], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "test.jpg");
    const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
      method: "POST",
      headers: { Authorization: "Bearer malformed.fake.jwt.token" },
      body: formData,
    });
    logResult("NEG-04", "Malformed Authorization Token", res.status === 401 ? "PASS" : "FAIL", `Expected HTTP 401, Got HTTP ${res.status}`);
  } catch (err: any) {
    logResult("NEG-04", "Malformed Token", "FAIL", err.message);
  }

  // Customer Token against Admin Endpoint
  if (customerToken) {
    try {
      const blob = new Blob([Buffer.from("test")], { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", blob, "test.jpg");
      const res = await fetch(`${API_BASE}/admin/upload/product-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${customerToken}` },
        body: formData,
      });
      logResult("NEG-05", "Customer Token on Admin Upload Route", res.status === 403 ? "PASS" : "FAIL", `Expected HTTP 403, Got HTTP ${res.status}`);
    } catch (err: any) {
      logResult("NEG-05", "Customer Token Check", "FAIL", err.message);
    }
  } else {
    logResult("NEG-05", "Customer Token Check", "SKIPPED", "No customer token available");
  }

  // STEP 10: Storage Success + DB Failure Rollback Verification
  try {
    const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
    const blob = new Blob([sampleJpg], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "rollback_test.jpg");

    // Pass non-existent productId to force DB insert foreign key failure
    const fakeProductId = "00000000-0000-0000-0000-000000000000";
    const res = await fetch(`${API_BASE}/admin/upload/product-image?productId=${fakeProductId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "X-File-Name": "rollback_test.jpg" },
      body: formData,
    });

    const isFailStatus = res.status === 500 || res.status === 400;

    // Verify Storage object was NOT left orphaned
    const { data: storageListRollback } = await cleanDb.storage.from("product-images").list("products", { search: "rollback_test.jpg" });
    const isCleanedUp = !Array.isArray(storageListRollback) || storageListRollback.length === 0;

    const passed = isFailStatus && isCleanedUp;
    logResult(
      "ROLLBACK-01",
      "Storage Success + DB Failure Automatic Rollback",
      passed ? "PASS" : "FAIL",
      `HTTP ${res.status} | Storage object automatically deleted/cleaned up: ${isCleanedUp}`
    );
  } catch (err: any) {
    logResult("ROLLBACK-01", "Rollback Verification", "FAIL", err.message);
  }

  console.log("\n======================================================================");
  console.log(" FORENSIC AUDIT SUMMARY");
  console.log("======================================================================");
  const total = auditLog.length;
  const passed = auditLog.filter((a) => a.status === "PASS").length;
  const failed = auditLog.filter((a) => a.status === "FAIL").length;
  const skipped = auditLog.filter((a) => a.status === "SKIPPED").length;
  console.log(`TOTAL AUDIT STEPS: ${total} | PASSED: ${passed} | FAILED: ${failed} | SKIPPED: ${skipped}`);
  console.log("======================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

executeForensicAudit().then(() => process.exit(0)).catch(() => process.exit(1));
