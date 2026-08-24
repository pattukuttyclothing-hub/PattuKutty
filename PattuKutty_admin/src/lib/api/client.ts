/**
 * Base API Client for Butterflies Admin Frontend.
 * Sends standard REST requests (GET, POST, PATCH, DELETE) to the backend API Server.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("butterflies_admin_token") : null;

  // Public routes check — /admin/login and /admin/refresh are public
  const isPublicAuthRoute = endpoint === "/admin/login" || endpoint === "/admin/refresh";

  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  if (endpoint.startsWith("/admin/") && !isPublicAuthRoute && !token && !isDev) {
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
    }
    throw new Error("Admin authentication token missing. Please log in.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (isDev) {
    headers["Authorization"] = `Bearer dev-token`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Helper to purge admin credentials and force redirect to login
  const handleSessionExpired = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("butterflies_admin_token");
      localStorage.removeItem("butterflies_admin_refresh_token");
      localStorage.removeItem("butterflies_admin_user");
      if (window.location.pathname !== "/login") {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
      }
    }
  };

  // Intercept HTTP 401 Unauthorized for automatic token refresh (except public auth routes)
  if (response.status === 401 && !isPublicAuthRoute) {
    if (!isRetry) {
      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("butterflies_admin_refresh_token") : null;

      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/admin/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.success && refreshData.data?.token) {
              localStorage.setItem("butterflies_admin_token", refreshData.data.token);
              if (refreshData.data.refreshToken) {
                localStorage.setItem("butterflies_admin_refresh_token", refreshData.data.refreshToken);
              }
              // Retry original request with new access token
              return apiFetch<T>(endpoint, options, true);
            }
          }
        } catch {
          /* refresh network error fallback */
        }
      }
    }

    // Refresh failed, no refresh token, or retried request returned 401 again: clear stale credentials & redirect
    handleSessionExpired();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
