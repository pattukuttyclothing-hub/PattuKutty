import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "http://localhost:3001/api/v1";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  let token = typeof window !== "undefined" ? localStorage.getItem("butterflies_customer_token") : null;

  if (!token && typeof window !== "undefined") {
    try {
      const sbKey = Object.keys(localStorage).find((k) => k.endsWith("-auth-token"));
      if (sbKey) {
        const parsed = JSON.parse(localStorage.getItem(sbKey) || "{}");
        token = parsed?.access_token || null;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized — Refresh token or clear stale session and redirect to /auth
  if (response.status === 401 && !isRetry) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session?.access_token) {
        localStorage.setItem("butterflies_customer_token", data.session.access_token);
        return apiFetch<T>(endpoint, options, true);
      }
    } catch {
      /* refresh failed */
    }

    // Refresh failed or session revoked: clear stale customer credentials and redirect to /auth
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("butterflies_customer_token");
        localStorage.removeItem("butterflies-custom-requests");
        localStorage.removeItem("butterflies-cart");
        localStorage.removeItem("butterflies-phone");
        Object.keys(localStorage).forEach((key) => {
          if (key.endsWith("-auth-token")) localStorage.removeItem(key);
        });
        if (window.location.pathname !== "/auth") {
          window.location.href = "/auth";
        }
      } catch {
        /* ignore */
      }
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
