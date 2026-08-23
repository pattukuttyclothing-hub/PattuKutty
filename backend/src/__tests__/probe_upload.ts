import { db } from "../config/db.js";

async function probeUpload() {
  console.log("==================================================");
  console.log(" DIAGNOSTIC PROBE: POST /api/v1/admin/upload/product-image");
  console.log("==================================================");

  // 1. Authenticate Admin
  const API_BASE = "http://localhost:3001/api/v1";
  const loginRes = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "AdminPassword123!" }),
  });
  const loginJson: any = await loginRes.json();
  const token = loginJson?.data?.token;
  console.log(`[PROBE] Login status: ${loginRes.status} | Token present: ${!!token}`);

  // 2. Prepare sample image FormData
  const sampleJpg = Buffer.from("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xFF\xD9");
  const blob = new Blob([sampleJpg], { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("file", blob, "test_admin_upload.jpg");

  // 3. Send upload request
  console.log("[PROBE] Sending multipart/form-data POST /api/v1/admin/upload/product-image...");
  const uploadRes = await fetch(`${API_BASE}/admin/upload/product-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-File-Name": "test_admin_upload.jpg",
    },
    body: formData,
  });

  console.log(`[PROBE] Response HTTP Status: ${uploadRes.status}`);
  const text = await uploadRes.text();
  console.log(`[PROBE] Response Body: ${text}`);

  try {
    const json = JSON.parse(text);
    console.log(`[PROBE] Parsed JSON:`, json);
  } catch {
    console.log(`[PROBE] Body is not JSON`);
  }

  console.log("==================================================");
}

probeUpload().then(() => process.exit(0)).catch((err) => {
  console.error("[PROBE ERROR]", err);
  process.exit(1);
});
