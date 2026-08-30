import { db } from "../config/db.js";

export class CustomerRepository {
  static async getProfile(customerId: string) {
    try {
      const { data, error } = await db
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();
      if (error || !data) return null;
      return data;
    } catch { return null; }
  }

  static async updateProfile(customerId: string, payload: { full_name?: string; phone?: string }) {
    try {
      const { data, error } = await db
        .from("customers")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", customerId)
        .select()
        .single();
      if (error || !data) return null;
      return data;
    } catch { return null; }
  }

  // ──── Addresses ───────────────────────────────────────────────────────

  static async getAddresses(customerId: string) {
    try {
      const { data, error } = await db
        .from("addresses")
        .select("*")
        .eq("customer_id", customerId)
        .order("is_default", { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch { return []; }
  }

  static async createAddress(customerId: string, payload: Record<string, unknown>) {
    try {
      // If this is to be the default address, unset all others first
      if (payload.is_default || payload.isDefault) {
        await db
          .from("addresses")
          .update({ is_default: false })
          .eq("customer_id", customerId);
      }
      const { data, error } = await db
        .from("addresses")
        .insert({
          customer_id: customerId,
          full_name: payload.full_name ?? payload.fullName,
          phone: payload.phone,
          line1: payload.line1,
          line2: payload.line2 ?? payload.line_2 ?? null,
          landmark: payload.landmark ?? null,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          address_type: payload.address_type ?? payload.addressType ?? "home",
          is_default: payload.is_default ?? payload.isDefault ?? false,
        })
        .select()
        .single();
      if (error || !data) return null;
      return data;
    } catch { return null; }
  }

  static async updateAddress(id: string, customerId: string, payload: Record<string, unknown>) {
    try {
      // Confirm the address belongs to this customer before updating
      const { data: existing } = await db
        .from("addresses")
        .select("id")
        .eq("id", id)
        .eq("customer_id", customerId)
        .maybeSingle();
      if (!existing) return null;

      // If marking as default, unset all others first
      if (payload.is_default || payload.isDefault) {
        await db
          .from("addresses")
          .update({ is_default: false })
          .eq("customer_id", customerId);
      }

      const { data, error } = await db
        .from("addresses")
        .update({
          full_name: payload.full_name ?? payload.fullName,
          phone: payload.phone,
          line1: payload.line1,
          line2: payload.line2 ?? payload.line_2 ?? null,
          landmark: payload.landmark ?? null,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          address_type: payload.address_type ?? payload.addressType ?? "home",
          ...(payload.is_default !== undefined || payload.isDefault !== undefined
            ? { is_default: payload.is_default ?? payload.isDefault }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("customer_id", customerId)
        .select()
        .single();
      if (error || !data) return null;
      return data;
    } catch { return null; }
  }

  static async deleteAddress(id: string, customerId: string) {
    try {
      await db.from("addresses").delete().eq("id", id).eq("customer_id", customerId);
      return true;
    } catch { return false; }
  }

  // ──── Reviews ─────────────────────────────────────────────────────────

  static async submitReview(payload: {
    product_id: string;
    customer_id: string;
    rating: number;
    title: string;
    comment: string;
  }) {
    try {
      const { data, error } = await db
        .from("reviews")
        .insert(payload)
        .select()
        .single();
      // The refresh_product_rating() trigger will automatically update products.avg_rating
      if (error || !data) return null;
      return data;
    } catch { return null; }
  }
}
