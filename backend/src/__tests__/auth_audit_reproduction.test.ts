import { db } from "../config/db.js";

async function runReproductionSuite() {
  console.log("==================================================");
  console.log(" REPRODUCTION TEST SUITE (A - H)");
  console.log("==================================================");

  const API_BASE = "http://localhost:3001/api/v1";

  // TEST A: Admin Login without Authorization header
  console.log("\n--- TEST A: Admin Login Without Authorization Header ---");
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
    });
    const json: any = await res.json();
    console.log(`[TEST A] Status: ${res.status} | Token Received: ${!!json?.data?.token}`);
  } catch (err: any) {
    console.log(`[TEST A] Error: ${err.message}`);
  }

  // TEST B: Customer Login without Authorization header
  console.log("\n--- TEST B: Customer Login Without Authorization Header ---");
  try {
    const { data: usersData } = await db.auth.admin.listUsers();
    const testCust = usersData?.users?.find((u) => !u.email?.includes("admin"));
    const testEmail = testCust?.email || "testcustomer@gmail.com";
    if (testCust?.id) {
      await db.auth.admin.updateUserById(testCust.id, { password: "CustomerPassword123!" });
    }
    const { data: custData, error: custErr } = await db.auth.signInWithPassword({
      email: testEmail,
      password: "CustomerPassword123!",
    });
    console.log(`[TEST B] Customer Login Status: ${custErr ? "Failed" : "Success"} | Token Received: ${!!custData.session?.access_token}`);
  } catch (err: any) {
    console.log(`[TEST B] Error: ${err.message}`);
  }

  // Get Admin Token for Test D & G
  const adminLoginRes = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
  });
  const adminJson: any = await adminLoginRes.json();
  const adminToken = adminJson?.data?.token;

  // Get Customer Token for Test C & F
  const { data: usersData } = await db.auth.admin.listUsers();
  const testCust = usersData?.users?.find((u) => !u.email?.includes("admin"));
  const testEmail = testCust?.email || "testcustomer@gmail.com";
  const custLogin = await db.auth.signInWithPassword({
    email: testEmail,
    password: "CustomerPassword123!",
  });
  const customerToken = custLogin.data.session?.access_token;

  // TEST C: Authenticated Customer -> POST /api/v1/requests
  console.log("\n--- TEST C: Authenticated Customer POST /api/v1/requests ---");
  try {
    const samplePayload = {
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
      body: JSON.stringify(samplePayload),
    });
    const json: any = await res.json();
    console.log(`[TEST C] Status: ${res.status} | Success: ${json.success} | Created Request ID: ${json.data?.id}`);

    if (json.data?.id) {
      await db.from("custom_requests").delete().eq("id", json.data.id);
    }
  } catch (err: any) {
    console.log(`[TEST C] Error: ${err.message}`);
  }

  // TEST D: Authenticated Admin -> Existing Admin API
  console.log("\n--- TEST D: Authenticated Admin Existing Admin API ---");
  try {
    const res = await fetch(`${API_BASE}/admin/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`[TEST D] GET /admin/requests Status: ${res.status}`);
  } catch (err: any) {
    console.log(`[TEST D] Error: ${err.message}`);
  }

  // TEST E: No Token -> Protected Customer Endpoint (Must return 401)
  console.log("\n--- TEST E: No Token Protected Customer Endpoint ---");
  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colour: "Blue" }),
    });
    const json: any = await res.json();
    console.log(`[TEST E] Status: ${res.status} (Expected 401) | Error: ${JSON.stringify(json.error || json.message)}`);
  } catch (err: any) {
    console.log(`[TEST E] Error: ${err.message}`);
  }

  // TEST F: Customer Token -> Admin Endpoint (Must return 403)
  console.log("\n--- TEST F: Customer Token Admin Endpoint ---");
  try {
    const res = await fetch(`${API_BASE}/admin/requests`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const json: any = await res.json();
    console.log(`[TEST F] Status: ${res.status} (Expected 403) | Error: ${JSON.stringify(json.error || json.message)}`);
  } catch (err: any) {
    console.log(`[TEST F] Error: ${err.message}`);
  }

  // TEST G: Admin Token -> Admin Endpoint (Must succeed)
  console.log("\n--- TEST G: Admin Token Admin Endpoint ---");
  try {
    const res = await fetch(`${API_BASE}/admin/requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`[TEST G] Status: ${res.status} (Expected 200)`);
  } catch (err: any) {
    console.log(`[TEST G] Error: ${err.message}`);
  }

  // TEST H: Expired / Invalid Token -> Protected Endpoint (Must return 401)
  console.log("\n--- TEST H: Expired / Invalid Token Protected Endpoint ---");
  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.fake.jwt.token",
      },
      body: JSON.stringify({ colour: "Blue" }),
    });
    const json: any = await res.json();
    console.log(`[TEST H] Status: ${res.status} (Expected 401) | Error: ${JSON.stringify(json.error || json.message)}`);
  } catch (err: any) {
    console.log(`[TEST H] Error: ${err.message}`);
  }

  console.log("\n==================================================");
  console.log(" REPRODUCTION TEST SUITE COMPLETED");
  console.log("==================================================");
}

runReproductionSuite().then(() => process.exit(0));
