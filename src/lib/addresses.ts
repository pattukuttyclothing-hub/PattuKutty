import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api/client";
import type { ShippingAddress } from "./orders";

export type SavedAddress = ShippingAddress & { id: string; isDefault: boolean };

type Row = Record<string, unknown>;

const map = (row: Row): SavedAddress => ({
  id: String(row["id"]),
  fullName: String(row["full_name"] ?? ""),
  phone: String(row["phone"] ?? ""),
  line1: String(row["line1"] ?? ""),
  line2: (row["line2"] as string | null) ?? undefined,
  landmark: (row["landmark"] as string | null) ?? undefined,
  city: String(row["city"] ?? ""),
  state: String(row["state"] ?? ""),
  pincode: String(row["pincode"] ?? ""),
  addressType: String(row["address_type"] ?? "home"),
  isDefault: Boolean(row["is_default"]),
});

// Read is kept as a direct Supabase query — RLS enforces ownership, and
// no write logic happens here. Only writes are routed through the backend.
export async function listAddresses(): Promise<SavedAddress[]> {
  try {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[Addresses] Unable to fetch addresses:", error.message);
      return [];
    }
    return ((data ?? []) as Row[]).map(map);
  } catch (err) {
    console.warn("[Addresses] Network or connection error fetching addresses:", err);
    return [];
  }
}

// Fix 3: Consolidated — all writes go through backend (POST /customer/addresses).
// The backend uses service_role and handles is_default reset atomically.
// `userId` param is kept for call-site compatibility but is not forwarded
// in the body — the backend derives it from the JWT via requireAuth.
export async function saveAddress(
  _userId: string,
  address: ShippingAddress,
  makeDefault = false,
): Promise<SavedAddress | null> {
  try {
    const result = await apiFetch<{ success: boolean; data: Row }>(
      "/customer/addresses",
      {
        method: "POST",
        body: JSON.stringify({
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 ?? null,
          landmark: address.landmark ?? null,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          addressType: address.addressType ?? "home",
          isDefault: makeDefault,
        }),
      },
    );
    if (!result?.data) return null;
    return map(result.data);
  } catch (err) {
    console.error("[saveAddress] error:", err);
    return null;
  }
}

// Fix 4: New export — calls PATCH /customer/addresses/:id.
// Backend validates ownership (customer_id must match JWT) before updating.
export async function updateAddress(
  id: string,
  address: ShippingAddress,
): Promise<SavedAddress | null> {
  try {
    const result = await apiFetch<{ success: boolean; data: Row }>(
      `/customer/addresses/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 ?? null,
          landmark: address.landmark ?? null,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          addressType: address.addressType ?? "home",
        }),
      },
    );
    if (!result?.data) return null;
    return map(result.data);
  } catch (err) {
    console.error("[updateAddress] error:", err);
    return null;
  }
}

// Fix 5: Wired — calls DELETE /customer/addresses/:id.
// Backend validates ownership before deletion.
// `userId` param is kept for call-site compatibility but not forwarded.
export async function deleteAddress(_userId: string, id: string): Promise<boolean> {
  try {
    await apiFetch<{ success: boolean }>(
      `/customer/addresses/${id}`,
      { method: "DELETE" },
    );
    return true;
  } catch (err) {
    console.error("[deleteAddress] error:", err);
    return false;
  }
}
