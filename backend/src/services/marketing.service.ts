import { MarketingRepository } from "../repositories/marketing.repository.js";
import { env } from "../config/env.js";

export class MarketingService {
  static async getCampaigns() {
    return await MarketingRepository.getCampaigns();
  }

  static async getCampaignById(id: string) {
    return await MarketingRepository.getCampaignById(id);
  }

  static async getAudienceSizes() {
    return await MarketingRepository.getAudienceSizes();
  }

  static async createBroadcastCampaign(payload: {
    name?: string;
    image_url?: string;
    message?: string;
    audience_kind: "all" | "sub_category" | "category";
    audience_ref?: string;
    audience_label: string;
    audience_size: number;
    product_id?: string;
    note?: string;
    sent_by: string;
  }) {
    // Determine if product campaign or custom broadcast
    const campaignPayload: Record<string, unknown> = {
      product_id: payload.product_id ?? null,
      custom_name: payload.name ?? null,
      custom_image: payload.image_url ?? null,
      custom_message: payload.message ?? null,
      audience_kind: payload.audience_kind,
      audience_ref: payload.audience_ref ?? null,
      audience_label: payload.audience_label,
      audience_size: payload.audience_size,
      note: payload.note ?? null,
      sent_by: payload.sent_by,
      status: "queued",
      sent_at: new Date().toISOString(),
    };

    const campaign = await MarketingRepository.createCampaign(campaignPayload);

    // Invoke n8n webhook for batch dispatch
    try {
      await fetch(`${env.N8N_WEBHOOK_URL}/wa-broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, secret: env.N8N_WEBHOOK_SECRET }),
      });
      await MarketingRepository.updateCampaignStatus(campaign.id, "sending");
    } catch {
      // n8n not configured yet — leave status as queued
    }

    return campaign;
  }
}
