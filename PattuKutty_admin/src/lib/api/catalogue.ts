import { apiFetch, API_BASE_URL } from "./client";
import type { AdminProduct, Variant } from "@/lib/admin-store";
import type { Category } from "@/data/boutique";
import { supabase } from "@/lib/supabase";

export interface CreateProductPayload {
  id?: string;
  slug?: string;
  name: string;
  categoryId: string;
  subCategoryId?: string;
  description?: string;
  blurb?: string;
  badge?: string;
  basePrice: number;
  mrp: number;
  expressFromPrice?: number;
  deliveryCharge?: number;
  soldOut?: boolean;
  isActive?: boolean;
  images?: string[];
  variants?: Variant[];
}

export interface UpdateProductPayload {
  id?: string;
  name?: string;
  description?: string;
  blurb?: string;
  badge?: string;
  category?: string;
  categoryId?: string;
  sub?: string;
  subCategoryId?: string;
  basePrice?: number;
  mrp?: number;
  expressFromPrice?: number;
  deliveryCharge?: number;
  soldOut?: boolean;
  isActive?: boolean;
  images?: string[];
  variants?: Variant[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await apiFetch<ApiResponse<Category[]> | Category[]>("/storefront/categories");
  return Array.isArray(res) ? res : res.data;
}

export async function fetchProducts(filters?: { category?: string; sub?: string; search?: string }): Promise<AdminProduct[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append("categorySlug", filters.category);
  if (filters?.sub) params.append("subSlug", filters.sub);
  if (filters?.search) params.append("search", filters.search);

  const queryStr = params.toString();
  const res = await apiFetch<ApiResponse<AdminProduct[]> | AdminProduct[]>(`/admin/products${queryStr ? `?${queryStr}` : ""}`);
  return Array.isArray(res) ? res : (res.data ?? []);
}

export async function fetchProductById(id: string): Promise<AdminProduct> {
  const res = await apiFetch<ApiResponse<AdminProduct> | AdminProduct>(`/admin/products/${id}`);
  return "data" in res ? res.data : res;
}

export async function createProduct(payload: CreateProductPayload): Promise<AdminProduct> {
  const res = await apiFetch<ApiResponse<AdminProduct> | AdminProduct>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return "data" in res ? res.data : res;
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<AdminProduct> {
  const res = await apiFetch<ApiResponse<AdminProduct> | AdminProduct>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...payload, id }),
  });
  return "data" in res ? res.data : res;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await apiFetch<ApiResponse<{ message: string }> | { message: string }>(`/admin/products/${id}`, {
    method: "DELETE",
  });
  return true;
}

export async function toggleSizeAvailability(productId: string, size: string, available: boolean): Promise<AdminProduct> {
  const res = await apiFetch<ApiResponse<AdminProduct> | AdminProduct>(`/admin/products/${productId}/variants/${size}`, {
    method: "PATCH",
    body: JSON.stringify({ available }),
  });
  return "data" in res ? res.data : res;
}

export async function uploadProductImageToStorage(file: File): Promise<{ url: string }> {
  if (!file || file.size === 0) {
    throw new Error("Empty or invalid image payload. Please select a valid file to upload.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size exceeds maximum allowed limit of 10 MB.");
  }

  const token = localStorage.getItem("butterflies_admin_token");
  if (!token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-File-Name": encodeURIComponent(file.name),
  };

  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(`${API_BASE_URL}/admin/upload/product-image`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errObj = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: { message?: string; statusCode?: number };
    };

    const serverMsg = errObj.error?.message || errObj.message;

    if (response.status === 401) {
      throw new Error(serverMsg || "Your admin session has expired. Please sign in again.");
    }
    if (response.status === 403) {
      throw new Error(serverMsg || "You do not have permission to modify product images.");
    }
    if (response.status === 413) {
      throw new Error("File size exceeds maximum allowed limit of 10 MB.");
    }

    throw new Error(serverMsg || `Image upload failed. Please try again. (${response.status})`);
  }

  const result = (await response.json()) as { success: boolean; url?: string; data?: { url?: string }; message?: string };
  const url = result.url || result.data?.url;

  if (!result.success || !url) {
    throw new Error(result.message || "Failed to retrieve public product image URL from server.");
  }

  return { url };
}

export async function deleteProductImage(imageUrl: string, productId?: string): Promise<{ success: boolean; message: string }> {
  if (!imageUrl || !imageUrl.trim()) {
    throw new Error("Image URL is required for deletion.");
  }

  const token = localStorage.getItem("butterflies_admin_token");
  if (!token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/delete/product-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageUrl: imageUrl.trim(), productId }),
  });

  if (!response.ok) {
    const errObj = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: { message?: string };
    };

    const serverMsg = errObj.error?.message || errObj.message;

    if (response.status === 401) {
      throw new Error(serverMsg || "Your admin session has expired. Please sign in again.");
    }
    if (response.status === 403) {
      throw new Error(serverMsg || "You do not have permission to modify product images.");
    }

    throw new Error(serverMsg || `Failed to delete product image (${response.status})`);
  }

  const result = (await response.json()) as { success: boolean; message?: string };
  return { success: true, message: result.message || "Product image deleted successfully." };
}

export const uploadProductImage = uploadProductImageToStorage;

export async function uploadReelVideo(file: File): Promise<{ url: string; message?: string }> {
  if (!file) {
    throw new Error("No video file selected for upload.");
  }

  const token = localStorage.getItem("butterflies_admin_token");
  if (!token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/upload/reel-video`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "video/mp4",
      "x-file-name": encodeURIComponent(file.name),
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });

  if (!response.ok) {
    const errObj = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: { message?: string };
    };
    const serverMsg = errObj.error?.message || errObj.message;
    throw new Error(serverMsg || `Failed to upload reel video (${response.status})`);
  }

  const resData = (await response.json()) as { success: boolean; url: string; message?: string };
  return resData.message ? { url: resData.url, message: resData.message } : { url: resData.url };
}

export async function fetchAdminReels(): Promise<any[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>("/admin/reels");
  if (!res || !res.success || !Array.isArray(res.data)) {
    return [];
  }
  return res.data;
}

export async function createAdminReel(payload: { title: string; videoUrl: string; productId?: string; position?: number }): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>("/admin/reels", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res || !res.success || !res.data) {
    throw new Error("Failed to create reel in database.");
  }
  return res.data;
}

export async function updateAdminReel(id: string, payload: { title?: string; videoUrl?: string; productId?: string; position?: number }): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/admin/reels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res || !res.success) {
    throw new Error("Failed to update reel in database.");
  }
  return res.data;
}

export async function deleteAdminReel(id: string): Promise<boolean> {
  const res = await apiFetch<{ success: boolean }>(`/admin/reels/${id}`, {
    method: "DELETE",
  });
  return Boolean(res && res.success);
}

export async function fetchAdminFeatured(): Promise<string[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>("/admin/featured");
  if (!res || !res.success || !Array.isArray(res.data)) {
    return [];
  }
  return res.data
    .map((row: any) => row.product_id || row.product?.id || (typeof row === "string" ? row : undefined))
    .filter((id): id is string => typeof id === "string" && Boolean(id));
}

export async function updateAdminFeatured(productIds: string[]): Promise<boolean> {
  const res = await apiFetch<{ success: boolean; message?: string }>("/admin/featured", {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds }),
  });
  return Boolean(res && res.success);
}

