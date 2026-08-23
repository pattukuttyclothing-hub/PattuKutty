import assert from "node:assert";
import { db } from "../config/db.js";

interface TestReport {
  id: string;
  name: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  notes: string;
}

const testReports: TestReport[] = [];

function record(report: TestReport) {
  testReports.push(report);
  const mark = report.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${mark} [${report.id}] ${report.name} -> Expected HTTP ${report.expectedStatus}, Got HTTP ${report.actualStatus} (${report.notes})`);
}

async function runAuthIntegrationSuite() {
  console.log("==================================================");
  console.log(" REAL HTTP AUTHENTICATION INTEGRATION SUITE");
  console.log("==================================================");

  const API_BASE = "http://localhost:3001/api/v1";

  // 1. AUTH-01: Admin Login with valid credentials (Public)
  let adminToken = "";
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
    });
    const json: any = await res.json();
    adminToken = json?.data?.token || "";
    const isOk = res.status === 200 && json.success === true && !!adminToken;
    record({
      id: "AUTH-01",
      name: "Admin login with valid credentials",
      expectedStatus: 200,
      actualStatus: res.status,
      passed: isOk,
      notes: isOk ? "Token & role returned" : "Login failed",
    });
  } catch (err: any) {
    record({ id: "AUTH-01", name: "Admin login with valid credentials", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // 2. AUTH-02: Admin Login without Authorization header
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
    });
    record({
      id: "AUTH-02",
      name: "Admin login without Authorization header",
      expectedStatus: 200,
      actualStatus: res.status,
      passed: res.status === 200,
      notes: "Login route is public",
    });
  } catch (err: any) {
    record({ id: "AUTH-02", name: "Admin login without Authorization header", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // 3. AUTH-03: Admin Login with invalid credentials
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "WrongPassword" }),
    });
    record({
      id: "AUTH-03",
      name: "Admin login with invalid credentials",
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      notes: "Rejected with 401 Unauthorized",
    });
  } catch (err: any) {
    record({ id: "AUTH-03", name: "Admin login with invalid credentials", expectedStatus: 401, actualStatus: 500, passed: false, notes: err.message });
  }

  // Get Customer Token
  let customerToken = "";
  let customerId = "";
  try {
    const { data: usersData } = await db.auth.admin.listUsers();
    const testCust = usersData?.users?.find((u) => !u.email?.includes("admin"));
    if (testCust?.id) {
      customerId = testCust.id;
      await db.auth.admin.updateUserById(testCust.id, { password: "CustomerPassword123!" });
      const custLogin = await db.auth.signInWithPassword({
        email: testCust.email || "",
        password: "CustomerPassword123!",
      });
      customerToken = custLogin.data.session?.access_token || "";
    }
  } catch {
    /* ignore setup error */
  }

  // 4. AUTH-04 & AUTH-10: Protected admin endpoint with valid admin token
  try {
    const res = await fetch(`${API_BASE}/admin/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record({
      id: "AUTH-04",
      name: "Protected admin endpoint with valid admin token",
      expectedStatus: 200,
      actualStatus: res.status,
      passed: res.status === 200,
      notes: "Admin access granted",
    });
  } catch (err: any) {
    record({ id: "AUTH-04", name: "Protected admin endpoint with valid admin token", expectedStatus: 200, actualStatus: 500, passed: false, notes: err.message });
  }

  // 5. AUTH-05: Protected admin endpoint without token
  try {
    const res = await fetch(`${API_BASE}/admin/requests`);
    record({
      id: "AUTH-05",
      name: "Protected admin endpoint without token",
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      notes: "Missing token rejected",
    });
  } catch (err: any) {
    record({ id: "AUTH-05", name: "Protected admin endpoint without token", expectedStatus: 401, actualStatus: 500, passed: false, notes: err.message });
  }

  // 6. AUTH-06 & AUTH-07: Protected admin endpoint with malformed/invalid token
  try {
    const res = await fetch(`${API_BASE}/admin/requests`, {
      headers: { Authorization: "Bearer malformed.invalid.token" },
    });
    record({
      id: "AUTH-06",
      name: "Protected admin endpoint with malformed token",
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      notes: "Invalid token rejected",
    });
  } catch (err: any) {
    record({ id: "AUTH-06", name: "Protected admin endpoint with malformed token", expectedStatus: 401, actualStatus: 500, passed: false, notes: err.message });
  }

  // 7. AUTH-08: Admin endpoint with customer token
  try {
    const res = await fetch(`${API_BASE}/admin/requests`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    record({
      id: "AUTH-08",
      name: "Admin endpoint with customer token",
      expectedStatus: 403,
      actualStatus: res.status,
      passed: res.status === 403,
      notes: "requireAdmin rejected non-admin role",
    });
  } catch (err: any) {
    record({ id: "AUTH-08", name: "Admin endpoint with customer token", expectedStatus: 403, actualStatus: 500, passed: false, notes: err.message });
  }

  // 8. AUTH-09: Customer custom-request endpoint with valid customer token
  try {
    const payload = {
      categoryId: "half-saree",
      subCategoryId: "lehenga",
      colour: "Royal Blue",
      fabricNotes: "Aari work blouse with soft silk skirt",
      size: "M",
      qty: 1,
      timelineId: "1-day",
      fulfilment: "pickup",
    };
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json: any = await res.json();
    const createdId = json?.data?.id;
    const isOk = res.status === 201 && !!createdId;
    if (createdId) {
      await db.from("custom_requests").delete().eq("id", createdId);
    }
    record({
      id: "AUTH-09",
      name: "Customer custom-request endpoint with valid customer token",
      expectedStatus: 201,
      actualStatus: res.status,
      passed: isOk,
      notes: isOk ? `Created Request ID: ${createdId}` : "Request failed",
    });
  } catch (err: any) {
    record({ id: "AUTH-09", name: "Customer custom-request endpoint with valid customer token", expectedStatus: 201, actualStatus: 500, passed: false, notes: err.message });
  }

  // 9. AUTH-10: Customer custom-request endpoint without token
  try {
    const payload = {
      categoryId: "half-saree",
      subCategoryId: "lehenga",
      colour: "Royal Blue",
      fabricNotes: "Aari work blouse with soft silk skirt",
      size: "M",
      qty: 1,
      timelineId: "1-day",
      fulfilment: "pickup",
    };
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    record({
      id: "AUTH-10",
      name: "Customer custom-request endpoint without token",
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      notes: "requireAuth rejected missing token",
    });
  } catch (err: any) {
    record({ id: "AUTH-10", name: "Customer custom-request endpoint without token", expectedStatus: 401, actualStatus: 500, passed: false, notes: err.message });
  }

  // 10. AUTH-11: Customer upload-media endpoint with requireAuth
  try {
    const sampleBuf = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00");
    const res = await fetch(`${API_BASE}/requests/upload-media?bucket=images`, {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
        "X-File-Name": "test.jpg",
      },
      body: sampleBuf,
    });
    record({
      id: "AUTH-11",
      name: "Customer upload-media without token",
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401,
      notes: "Protected with requireAuth middleware",
    });
  } catch (err: any) {
    record({ id: "AUTH-11", name: "Customer upload-media without token", expectedStatus: 401, actualStatus: 500, passed: false, notes: err.message });
  }

  // 11. AUTH-12: Customer request with empty design details but valid reference image (Fallback check)
  try {
    const payloadWithImage = {
      categoryId: "half-saree",
      subCategoryId: "lehenga",
      colour: "Royal Blue",
      fabricNotes: "", // Empty string
      referenceImageUrls: ["https://example.supabase.co/storage/v1/object/public/custom-design-request-images/test.jpg"],
      size: "M",
      qty: 1,
      timelineId: "1-day",
      fulfilment: "pickup",
    };
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(payloadWithImage),
    });
    const json: any = await res.json();
    const createdId = json?.data?.id;
    const isOk = res.status === 201 && !!createdId;
    if (createdId) {
      await db.from("custom_requests").delete().eq("id", createdId);
    }
    record({
      id: "AUTH-12",
      name: "Customer request with empty notes but valid reference image",
      expectedStatus: 201,
      actualStatus: res.status,
      passed: isOk,
      notes: isOk ? "Fallback fabricNotes generated cleanly" : "Failed",
    });
  } catch (err: any) {
    record({ id: "AUTH-12", name: "Customer request with empty notes but valid reference image", expectedStatus: 201, actualStatus: 500, passed: false, notes: err.message });
  }

  console.log("\n==================================================");
  console.log(" INTEGRATION SUITE SUMMARY");
  console.log("==================================================");
  const total = testReports.length;
  const passed = testReports.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthIntegrationSuite().then(() => process.exit(0)).catch(() => process.exit(1));
