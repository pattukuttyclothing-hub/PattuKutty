import { apiFetch } from "./client";
import type { Campaign } from "@/lib/whatsapp-notify";

export interface SendBroadcastPayload {
  name: string;
  imageUrl?: string;
  message: string;
  audienceKind: string;
  audienceLabel: string;
  audienceSize: number;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  return apiFetch<Campaign[]>("/marketing/campaigns");
}

export async function fetchCampaignById(id: string): Promise<Campaign> {
  return apiFetch<Campaign>(`/marketing/campaigns/${id}`);
}

export async function sendBroadcast(payload: SendBroadcastPayload): Promise<Campaign> {
  return apiFetch<Campaign>("/marketing/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
