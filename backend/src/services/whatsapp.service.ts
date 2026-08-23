import { env } from "../config/env.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export interface SendWhatsAppMediaQuotationParams {
  toPhone: string;
  customerName: string;
  requestNo: string;
  quoteName: string;
  amount: number;
  gstAmount: number;
  deliveryFee: number;
  totalPayable: number;
  readyBy: string;
  referenceImageUrl?: string | null;
  fulfilment?: string | null;
}

export interface WhatsAppSendResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  normalizedPhone?: string;
  mediaIncluded?: boolean;
  waLink?: string;
}

export class WhatsAppService {
  /**
   * Normalizes customer phone numbers into international E.164 format.
   * Special handling for 10-digit Indian numbers (+91 prefix).
   */
  static normalizePhoneNumber(rawPhone: string): string | null {
    if (!rawPhone || typeof rawPhone !== "string") return null;

    // Strip spaces, dashes, parentheses, non-digits (keep leading + if present)
    const cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, "");
    if (!cleaned) return null;

    // Handle leading '+'
    let digitsOnly = cleaned;
    if (cleaned.startsWith("+")) {
      digitsOnly = cleaned.slice(1);
    }

    // Indian 10-digit number without country code
    if (/^[6-9]\d{9}$/.test(digitsOnly)) {
      return `+91${digitsOnly}`;
    }

    // Indian 10-digit with 0 prefix (e.g. 09876543210)
    if (/^0[6-9]\d{9}$/.test(digitsOnly)) {
      return `+91${digitsOnly.slice(1)}`;
    }

    // Already includes country code (e.g. 919876543210)
    if (/^91[6-9]\d{9}$/.test(digitsOnly)) {
      return `+${digitsOnly}`;
    }

    // Standard E.164 international format (between 10 and 15 digits)
    if (/^\d{10,15}$/.test(digitsOnly)) {
      return `+${digitsOnly}`;
    }

    return null;
  }

  /**
   * Generates a pre-formatted wa.me link with complete quotation message AND embedded image URL.
   */
  static generateQuotationWaLink(params: SendWhatsAppMediaQuotationParams): string | null {
    const normalized = this.normalizePhoneNumber(params.toPhone);
    const cleanPhone = normalized ? normalized.replace(/[^0-9]/g, "") : "";
    if (!cleanPhone) return null;

    let formattedReadyBy = params.readyBy;
    try {
      const dateObj = new Date(params.readyBy);
      if (!isNaN(dateObj.getTime())) {
        formattedReadyBy = dateObj.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {}

    const deliveryNote =
      params.fulfilment === "pickup" || params.deliveryFee === 0
        ? "Store Pickup — Free"
        : `₹${params.deliveryFee} (Doorstep Delivery)`;

    const imgText = params.referenceImageUrl && typeof params.referenceImageUrl === "string" && params.referenceImageUrl.startsWith("http")
      ? `\n\n📷 *Design Reference Photo*:\n${params.referenceImageUrl}`
      : "";

    const messageText = [
      `*Butterflies Tailoring — Quotation for ${params.requestNo}*`,
      ``,
      `Hello ${params.customerName || "Valued Customer"},`,
      `Our designer has reviewed your design specification and prepared a quotation:`,
      ``,
      `📌 *Design Name*: ${params.quoteName}`,
      `✂️ *Stitching Price*: ₹${params.amount.toLocaleString("en-IN")}`,
      `🧾 *GST (5%)*: ₹${params.gstAmount.toLocaleString("en-IN")}`,
      `🚚 *Delivery*: ${deliveryNote}`,
      `💰 *Total Payable*: ₹${params.totalPayable.toLocaleString("en-IN")}`,
      `📅 *Handover Ready By*: ${formattedReadyBy}${imgText}`,
      ``,
      `Please review and confirm your order at Butterflies Tailoring.`,
      `Thank you for styling with us! ✨`,
    ].join("\n");

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  }

  /**
   * Downloads actual binary media (Buffer) from Supabase Storage / HTTP URL.
   * Ensures actual image data is transmitted, NEVER plain Supabase text URLs.
   */
  static async fetchMediaBuffer(imageUrl: string): Promise<{ buffer: Buffer; mimeType: string; tempPath?: string } | null> {
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
      return null;
    }

    try {
      const response = await fetch(imageUrl, { method: "GET" });
      if (!response.ok) {
        console.warn(`[WhatsAppService] Failed to download media image: HTTP ${response.status}`);
        return null;
      }

      const mimeType = response.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!buffer || buffer.length === 0) {
        console.warn(`[WhatsAppService] Downloaded media buffer is empty.`);
        return null;
      }

      // Write to a temporary file on local disk to verify binary write & immediate cleanup
      const tempPath = path.join(os.tmpdir(), `wa_quotation_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`);
      await fs.writeFile(tempPath, buffer);

      return { buffer, mimeType, tempPath };
    } catch (err: any) {
      console.error(`[WhatsAppService] Error downloading media image:`, err.message);
      return null;
    }
  }

  /**
   * Sends formatted quotation message with actual attached image media to customer via WhatsApp.
   * Quotation persistence in DB is INDEPENDENT of WhatsApp delivery status.
   */
  static async sendQuotationMediaNotification(params: SendWhatsAppMediaQuotationParams): Promise<WhatsAppSendResult> {
    const normalizedPhone = this.normalizePhoneNumber(params.toPhone);
    const waLink = this.generateQuotationWaLink(params) ?? undefined;

    if (!normalizedPhone) {
      console.warn(`[WhatsAppService] Cannot send WhatsApp: Invalid customer phone number format.`);
      return {
        sent: false,
        error: `Invalid customer phone number format. Must be a valid 10-digit or international number.`,
        waLink,
      };
    }

    // Format ready date string cleanly (e.g. Aug 20, 2026)
    let formattedReadyBy = params.readyBy;
    try {
      const dateObj = new Date(params.readyBy);
      if (!isNaN(dateObj.getTime())) {
        formattedReadyBy = dateObj.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      // fallback to raw string
    }

    const deliveryNote =
      params.fulfilment === "pickup" || params.deliveryFee === 0
        ? "Store Pickup — Free"
        : `₹${params.deliveryFee} (Doorstep Delivery)`;

    const imgText = params.referenceImageUrl && typeof params.referenceImageUrl === "string" && params.referenceImageUrl.startsWith("http")
      ? `\n\n📷 *Design Reference Photo*:\n${params.referenceImageUrl}`
      : "";

    const messageText = [
      `*Butterflies Tailoring — Quotation for ${params.requestNo}*`,
      ``,
      `Hello ${params.customerName || "Valued Customer"},`,
      `Our designer has reviewed your design specification and prepared a quotation:`,
      ``,
      `📌 *Design Name*: ${params.quoteName}`,
      `✂️ *Stitching Price*: ₹${params.amount.toLocaleString("en-IN")}`,
      `🧾 *GST (5%)*: ₹${params.gstAmount.toLocaleString("en-IN")}`,
      `🚚 *Delivery*: ${deliveryNote}`,
      `💰 *Total Payable*: ₹${params.totalPayable.toLocaleString("en-IN")}`,
      `📅 *Handover Ready By*: ${formattedReadyBy}${imgText}`,
      ``,
      `Please open your Butterflies Tailoring app to review and confirm your order.`,
      `Thank you for styling with us! ✨`,
    ].join("\n");

    let mediaData: { buffer: Buffer; mimeType: string; tempPath?: string } | null = null;
    if (params.referenceImageUrl) {
      mediaData = await this.fetchMediaBuffer(params.referenceImageUrl);
    }

    let tempFilePathToDelete: string | null = mediaData?.tempPath ?? null;

    // Dispatch payload to WhatsApp Provider / n8n Webhook
    try {
      const webhookUrl = `${env.N8N_WEBHOOK_URL}/wa-media-quotation`;
      const base64Media = mediaData ? mediaData.buffer.toString("base64") : null;

      const payload = {
        phone: normalizedPhone,
        requestNo: params.requestNo,
        customerName: params.customerName,
        message: messageText,
        quoteName: params.quoteName,
        totalPayable: params.totalPayable,
        readyBy: formattedReadyBy,
        secret: env.N8N_WEBHOOK_SECRET,
        hasMedia: Boolean(mediaData),
        media: mediaData
          ? {
              mimeType: mediaData.mimeType,
              bufferLength: mediaData.buffer.length,
              base64Data: base64Media,
            }
          : null,
      };

      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!webhookRes.ok) {
        console.warn(
          `[WhatsAppService] Webhook notification returned HTTP ${webhookRes.status} (Provider unconfigured or offline)`
        );
        return {
          sent: false,
          normalizedPhone,
          mediaIncluded: Boolean(mediaData),
          waLink,
          error: "Quotation saved, but WhatsApp notification could not be sent. Please try again.",
        };
      }

      const resData = (await webhookRes.json().catch(() => ({}))) as Record<string, unknown>;
      return {
        sent: true,
        normalizedPhone,
        mediaIncluded: Boolean(mediaData),
        waLink,
        messageId: (resData.messageId as string) || `wa-${Date.now()}`,
      };
    } catch (dispatchErr: any) {
      console.warn(`[WhatsAppService] WhatsApp dispatch fallback (Provider offline/dev mode):`, dispatchErr.message);
      return {
        sent: false,
        normalizedPhone,
        mediaIncluded: Boolean(mediaData),
        waLink,
        error: "Quotation saved, but WhatsApp notification could not be sent. Please try again.",
      };
    } finally {
      // Immediately delete temporary downloaded image file from disk
      if (tempFilePathToDelete) {
        try {
          await fs.unlink(tempFilePathToDelete);
        } catch {
          // ignore cleanup failure if file didn't exist
        }
      }
    }
  }

  /**
   * Sends formatted cancellation notification with actual attached binary image media to customer via WhatsApp.
   */
  static async sendCancellationMediaNotification(params: {
    toPhone: string;
    customerName: string;
    requestNo: string;
    cancelReason: string;
    referenceImageUrl?: string | null;
  }): Promise<WhatsAppSendResult> {
    const normalizedPhone = this.normalizePhoneNumber(params.toPhone);
    if (!normalizedPhone) {
      console.warn(`[WhatsAppService] Cannot send WhatsApp: Invalid customer phone number format.`);
      return {
        sent: false,
        error: `Invalid customer phone number format. Must be a valid 10-digit or international number.`,
      };
    }

    const messageText = [
      `*Butterflies Tailoring — Request Update (${params.requestNo})*`,
      ``,
      `Hello ${params.customerName || "Valued Customer"},`,
      `Your custom design request (${params.requestNo}) has been cancelled.`,
      ``,
      `📌 *Reason*: ${params.cancelReason || "Cancelled by studio/customer"}`,
      ``,
      `If you have any questions or would like to submit a new design, please contact our studio on WhatsApp.`,
      `Thank you for choosing Butterflies Tailoring! ✨`,
    ].join("\n");

    let mediaData: { buffer: Buffer; mimeType: string; tempPath?: string } | null = null;
    if (params.referenceImageUrl) {
      mediaData = await this.fetchMediaBuffer(params.referenceImageUrl);
    }

    let tempFilePathToDelete: string | null = mediaData?.tempPath ?? null;

    try {
      const webhookUrl = `${env.N8N_WEBHOOK_URL}/wa-media-cancellation`;
      const base64Media = mediaData ? mediaData.buffer.toString("base64") : null;

      const payload = {
        phone: normalizedPhone,
        requestNo: params.requestNo,
        customerName: params.customerName,
        message: messageText,
        cancelReason: params.cancelReason,
        secret: env.N8N_WEBHOOK_SECRET,
        hasMedia: Boolean(mediaData),
        media: mediaData
          ? {
              mimeType: mediaData.mimeType,
              bufferLength: mediaData.buffer.length,
              base64Data: base64Media,
            }
          : null,
      };

      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!webhookRes.ok) {
        console.warn(`[WhatsAppService] Cancellation Webhook returned HTTP ${webhookRes.status} (Provider unconfigured or offline)`);
        return {
          sent: false,
          normalizedPhone,
          mediaIncluded: Boolean(mediaData),
          error: "Cancellation recorded, but WhatsApp notification could not be sent. Please try again.",
        };
      }

      const resData = (await webhookRes.json().catch(() => ({}))) as Record<string, unknown>;
      return {
        sent: true,
        normalizedPhone,
        mediaIncluded: Boolean(mediaData),
        messageId: (resData.messageId as string) || `wa-${Date.now()}`,
      };
    } catch (dispatchErr: any) {
      console.warn(`[WhatsAppService] WhatsApp cancellation dispatch fallback (Provider offline/dev mode):`, dispatchErr.message);
      return {
        sent: false,
        normalizedPhone,
        mediaIncluded: Boolean(mediaData),
        error: "Cancellation recorded, but WhatsApp notification could not be sent. Please try again.",
      };
    } finally {
      if (tempFilePathToDelete) {
        try {
          await fs.unlink(tempFilePathToDelete);
        } catch {
          // ignore cleanup failure
        }
      }
    }
  }
}
