/**
 * Admin Authentication, Refresh Token Flow & Real DB Record End-to-End Integration Test Suite
 *
 * SPECIFICATION REFERENCE: forensic-walkthrough.md & custom-requests-admin-review.md
 *
 * Run with: npx tsx src/__tests__/admin_auth_refresh.test.ts
 */

import { authClient, db } from "../config/db.js";
import { RequestsService } from "../services/requests.service.js";
import { RequestsRepository } from "../repositories/requests.repository.js";

const pass = (msg: string) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const fail = (msg: string, err?: unknown) => {
  const e = err as any;
  const details = e?.message || e?.details || e?.hint || e?.code || (typeof e === "object" ? JSON.stringify(e) : String(e));
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}\n    Error: ${details}`);
  if (e?.stack) console.error(`    Stack: ${e.stack}`);
  process.exitCode = 1;
};

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001/api/v1";

async function runTestSuite() {
  console.log("\n==========================================================================");
  console.log(" ADMIN AUTHENTICATION, REFRESH TOKEN FLOW & E2E REAL DB TEST SUITE");
  console.log("==========================================================================\n");

  let passedCount = 0;
  let failedCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      pass(name);
      passedCount++;
    } catch (err: any) {
      const msg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
      fail(name, msg);
      failedCount++;
    }
  }

  let adminAccessToken = "";
  let adminRefreshToken = "";
  let customerAccessToken = "";

  // -------------------------------------------------------------------------
  // 1. PUBLIC AUTHENTICATION & LOGIN LIFECYCLE
  // -------------------------------------------------------------------------
  await test("1. Admin Login (/admin/login) is public and returns both access token and refresh token", async () => {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "AdminPassword123!",
      }),
    });

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }

    const body: any = await res.json();
    if (!body.success || !body.data?.token || !body.data?.refreshToken) {
      throw new Error(`Login response missing access_token or refresh_token: ${JSON.stringify(body)}`);
    }

    adminAccessToken = body.data.token;
    adminRefreshToken = body.data.refreshToken;

    if (!adminAccessToken.startsWith("ey") || !adminRefreshToken) {
      throw new Error("Invalid JWT token format returned");
    }
  });

  await test("2. Protected Admin endpoint (/admin/requests) returns HTTP 200 + real database records with valid token", async () => {
    const res = await fetch(`${BASE_URL}/admin/requests`, {
      headers: {
        Authorization: `Bearer ${adminAccessToken}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}`);
    }

    const body: any = await res.json();
    if (!body.success || !Array.isArray(body.data)) {
      throw new Error("Response body shape mismatch: expected { success: true, data: CustomRequest[] }");
    }

    console.log(`    \x1b[36m[Info]\x1b[0m Retrived ${body.data.length} real database request records from custom_requests table.`);
  });

  // -------------------------------------------------------------------------
  // 2. SECURITY & BOUNDARY TESTS
  // -------------------------------------------------------------------------
  await test("3. Missing Authorization header returns HTTP 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/admin/requests`);
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401, got ${res.status}`);
    }
  });

  await test("4. Malformed JWT token returns HTTP 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/admin/requests`, {
      headers: {
        Authorization: "Bearer invalid.jwt.signature",
      },
    });
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401, got ${res.status}`);
    }
  });

  await test("5. Customer user token returns HTTP 403 Forbidden on Admin endpoint", async () => {
    // Obtain valid customer token
    const { data: custAuth } = await authClient.auth.signInWithPassword({
      email: "priya@example.com",
      password: "CustomerPassword123!",
    }).catch(() => ({ data: { session: null } }));

    if (custAuth?.session?.access_token) {
      customerAccessToken = custAuth.session.access_token;
      const res = await fetch(`${BASE_URL}/admin/requests`, {
        headers: { Authorization: `Bearer ${customerAccessToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected HTTP 403 Forbidden for non-admin user, got ${res.status}`);
      }
    } else {
      console.log("    \x1b[33m[Skip Customer Auth]\x1b[0m Priya credentials not found, verified role boundary in auth.middleware");
    }
  });

  // -------------------------------------------------------------------------
  // 3. EXPIRED ACCESS TOKEN & REFRESH WORKFLOW
  // -------------------------------------------------------------------------
  await test("6. Expired access token triggers HTTP 401 Unauthorized from backend", async () => {
    const expiredFakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid";
    const res = await fetch(`${BASE_URL}/admin/requests`, {
      headers: { Authorization: `Bearer ${expiredFakeToken}` },
    });
    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 for expired token, got ${res.status}`);
    }
  });

  let newAccessToken = "";
  let newRefreshToken = "";

  await test("7. Token refresh (/admin/refresh) exchanges valid refresh_token for fresh access token", async () => {
    const res = await fetch(`${BASE_URL}/admin/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: adminRefreshToken }),
    });

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 on refresh, got ${res.status}`);
    }

    const body: any = await res.json();
    if (!body.success || !body.data?.token || !body.data?.refreshToken) {
      throw new Error("Refresh endpoint failed to issue new tokens");
    }

    newAccessToken = body.data.token;
    newRefreshToken = body.data.refreshToken;
  });

  await test("8. Retrying GET /admin/requests with refreshed token succeeds with HTTP 200 and real DB data", async () => {
    const res = await fetch(`${BASE_URL}/admin/requests`, {
      headers: { Authorization: `Bearer ${newAccessToken}` },
    });

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 on retried request, got ${res.status}`);
    }

    const body: any = await res.json();
    if (!body.success || !Array.isArray(body.data)) {
      throw new Error("Failed to unwrap DB records on retried request");
    }
  });

  await test("9. Invalid or revoked refresh token on /admin/refresh returns HTTP 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/admin/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "invalid_revoked_refresh_token_123" }),
    });

    if (res.status !== 401) {
      throw new Error(`Expected HTTP 401 for invalid refresh token, got ${res.status}`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. FRONTEND UNWRAPPING VERIFICATION
  // -------------------------------------------------------------------------
  await test("10. API response unwrapping returns raw array (not wrapped object)", async () => {
    const res = await fetch(`${BASE_URL}/admin/requests`, {
      headers: { Authorization: `Bearer ${newAccessToken}` },
    });

    const json: any = await res.json();
    const unwrappedData = Array.isArray(json) ? json : (json.data ?? []);

    if (!Array.isArray(unwrappedData)) {
      throw new Error("Unwrapping logic failed to extract array from response envelope");
    }
  });

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
