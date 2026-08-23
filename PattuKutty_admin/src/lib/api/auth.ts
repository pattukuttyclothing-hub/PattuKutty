import { apiFetch } from "./client";

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AdminLoginResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken?: string;
    user: AdminUser;
  };
  message?: string;
}

export async function adminLogin(payload: AdminLoginPayload): Promise<AdminLoginResponse> {
  return apiFetch<AdminLoginResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
