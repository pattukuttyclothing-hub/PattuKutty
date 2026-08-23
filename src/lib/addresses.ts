import { supabase } from "@/integrations/supabase/client";
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

export async function saveAddress(
  userId: string,
  address: ShippingAddress,
  makeDefault = false,
): Promise<SavedAddress | null> {
  if (makeDefault) await supabase.from("addresses").update({ is_default: false }).eq("customer_id", userId);
  const { data, error } = await supabase
    .from("addresses")
    .insert({
      customer_id: userId,
      full_name: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? null,
      landmark: address.landmark ?? null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      address_type: address.addressType ?? "home",
      is_default: makeDefault,
    })
    .select("*")
    .single();
  if (error || !data) {
    console.error("saveAddress error:", error);
    return null;
  }
  return map(data as Row);
}

export async function deleteAddress(id: string) {
  await supabase.from("addresses").delete().eq("id", id);
}
