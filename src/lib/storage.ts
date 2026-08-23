function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("butterflies_customer_token");
  if (!token) {
    try {
      const sbKey = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
      if (sbKey) {
        const parsed = JSON.parse(localStorage.getItem(sbKey) || "{}");
        token = parsed.access_token || null;
      }
    } catch {
      /* ignore */
    }
  }
  return token;
}

/**
 * Authoritative Backend-Driven Customer Design Studio Image Upload.
 * Uploads file via Backend API server directly into dedicated Supabase Storage bucket 'custom-design-request-images'.
 * Zero base64, zero localStorage, zero frontend-direct fallback.
 */
export async function uploadDesignImage(file: File | Blob): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Invalid or empty file selected.");
  }

  const token = getCustomerToken();
  const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string) || "http://localhost:3001/api/v1";

  const formData = new FormData();
  const fileName = (file as File).name || `design_${Date.now()}.jpg`;
  formData.append("file", file, fileName);

  const response = await fetch(`${API_BASE_URL}/requests/upload-media?bucket=images`, {
    method: "POST",
    headers: {
      "X-File-Name": encodeURIComponent(fileName),
      "X-Bucket-Name": "custom-design-request-images",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errObj = (await response.json().catch(() => ({ message: `HTTP ${response.status}` }))) as {
      message?: string;
    };
    throw new Error(errObj.message || `Failed to upload image (${response.status})`);
  }

  const result = (await response.json()) as { success: boolean; url?: string; publicUrl?: string; message?: string };
  const url = result.url || result.publicUrl;

  if (!result.success || !url) {
    throw new Error(result.message || "Failed to retrieve public storage URL from server.");
  }

  return url;
}

/**
 * Authoritative Backend-Driven Customer Voice Note Audio Upload.
 * Uploads recorded audio via Backend API server directly into dedicated Supabase Storage bucket 'custom-design-request-audio'.
 * Zero base64, zero localStorage, zero frontend-direct fallback.
 */
export async function uploadVoiceAudio(file: Blob): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Invalid or empty audio recorded.");
  }

  const token = getCustomerToken();
  const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string) || "http://localhost:3001/api/v1";

  const formData = new FormData();
  const ext = file.type.includes("wav") ? "wav" : file.type.includes("mp3") ? "mp3" : "webm";
  const fileName = `voice_${Date.now()}.${ext}`;
  formData.append("file", file, fileName);

  const response = await fetch(`${API_BASE_URL}/requests/upload-media?bucket=audio`, {
    method: "POST",
    headers: {
      "X-File-Name": encodeURIComponent(fileName),
      "X-Bucket-Name": "custom-design-request-audio",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errObj = (await response.json().catch(() => ({ message: `HTTP ${response.status}` }))) as {
      message?: string;
    };
    throw new Error(errObj.message || `Failed to upload voice note (${response.status})`);
  }

  const result = (await response.json()) as { success: boolean; url?: string; publicUrl?: string; message?: string };
  const url = result.url || result.publicUrl;

  if (!result.success || !url) {
    throw new Error(result.message || "Failed to retrieve public storage URL for voice note.");
  }

  return url;
}
