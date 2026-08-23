import { db } from "../config/db.js";

export class MarketingRepository {
  /** Uses correct wa_campaigns table per production schema */
  static async createCampaign(payload: Record<string, unknown>) {
    const { data, error } = await db
      .from("wa_campaigns")           // ← correct table name (not marketing_broadcasts)
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateCampaignStatus(id: string, status: string) {
    const { data, error } = await db
      .from("wa_campaigns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getCampaigns() {
    const { data, error } = await db
      .from("wa_campaigns")
      .select("*, product:products(*), stats:v_campaign_stats(*)")
      .order("sent_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  static async getCampaignById(id: string) {
    const { data, error } = await db
      .from("wa_campaigns")
      .select("*, product:products(*), stats:v_campaign_stats(*), clicks:wa_campaign_clicks(*)")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  /** Real audience sizes from v_audience_sizes view */
  static async getAudienceSizes() {
    try {
      const { data, error } = await db
        .from("v_audience_sizes")
        .select("*");
      if (error || !data) {
        return [
          { ref: "all", kind: "all", size: 0, label: "All Customers" },
        ];
      }
      return data;
    } catch {
      return [{ ref: "all", kind: "all", size: 0, label: "All Customers" }];
    }
  }
}
