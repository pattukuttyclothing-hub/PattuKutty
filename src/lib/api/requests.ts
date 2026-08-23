import { apiFetch } from "./client";

export interface SubmitCustomRequestPayload {
  categoryId: string;
  subCategoryId?: string | undefined;
  colour: string;
  customColourImageUrl?: string | undefined;
  fabricNotes: string;
  voiceNoteUrl?: string | undefined;
  referenceImageUrls?: string[] | undefined;
  size: string;
  measurements?: Record<string, number | undefined> | undefined;
  qty: number;
  timelineId: string;
  fulfilment?: "pickup" | "doorstep" | undefined;
  phone?: string | undefined;
  sourceProductId?: string | undefined;
}

export async function fetchCustomerRequests(): Promise<any[]> {
  const res = await apiFetch<{ success: boolean; data: any[] }>("/requests");
  if (!res || !res.success || !Array.isArray(res.data)) {
    throw new Error("Failed to fetch customer design requests.");
  }
  return res.data;
}

export async function fetchCustomerRequestById(id: string): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/requests/${id}`);
  if (!res || !res.success || !res.data || !res.data.id) {
    throw new Error("Failed to fetch design request detail.");
  }
  return res.data;
}

export async function submitCustomRequest(payload: SubmitCustomRequestPayload): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>("/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res || !res.success || !res.data || !res.data.id) {
    throw new Error("Invalid response received from server for design request.");
  }

  return res.data;
}

export async function requestChanges(requestId: string, note: string): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/requests/${requestId}/request-changes`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });

  if (!res || !res.success || !res.data) {
    throw new Error("Failed to submit request modification.");
  }

  return res.data;
}

export async function cancelCustomRequest(requestId: string, reason: string): Promise<any> {
  const res = await apiFetch<{ success: boolean; data: any }>(`/requests/${requestId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });

  if (!res || !res.success || !res.data) {
    throw new Error("Failed to cancel design request.");
  }

  return res.data;
}

