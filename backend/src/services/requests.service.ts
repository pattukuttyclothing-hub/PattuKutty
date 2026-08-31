import { RequestsRepository } from "../repositories/requests.repository.js";
import { WhatsAppService } from "./whatsapp.service.js";
import { db } from "../config/db.js";
import { randomUUID } from "crypto";

function createError(message: string, statusCode: number): Error {
  const err = new Error(message);
  (err as unknown as { statusCode: number }).statusCode = statusCode;
  return err;
}

export class RequestsService {
  static async submitCustomRequest(customerId: string, payload: Record<string, unknown>) {
    if (!customerId || typeof customerId !== "string" || !customerId.trim()) {
      throw createError("Authentication required. Please log in to submit your design request.", 401);
    }

    if (!payload || typeof payload !== "object") {
      throw createError("Invalid customization request payload.", 400);
    }

    // 1. Required Colour Validation
    const rawColour = payload.colour;
    const colour = typeof rawColour === "string" ? rawColour.trim() : "";
    if (!colour) {
      throw createError("Please select or specify a fabric colour.", 400);
    }

    // 2. Required Fabric Notes / Description Validation & Optional Formatting
    const rawFabricNotes = payload.fabricNotes ?? payload.description;
    let fabricNotes = typeof rawFabricNotes === "string" ? rawFabricNotes.trim() : "";

    // Format optional measurements if provided (omit unprovided measurements)
    const rawMeasurements = payload.measurements;
    if (rawMeasurements && typeof rawMeasurements === "object") {
      const validEntries = Object.entries(rawMeasurements)
        .filter(([_, v]) => typeof v === "number" && !isNaN(v) && v > 0);
      if (validEntries.length > 0) {
        const measString = validEntries
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}"`)
          .join(", ");
        fabricNotes = fabricNotes
          ? `${fabricNotes}\n\n[Measurements]: ${measString}`
          : `[Measurements]: ${measString}`;
      }
    }

    // Format optional edited phone number if provided
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    if (phone) {
      fabricNotes = fabricNotes
        ? `${fabricNotes}\n[Contact Phone]: ${phone}`
        : `[Contact Phone]: ${phone}`;
    }

    // Format optional source product ID if provided & bind source product metadata
    const sourceProductId = payload.sourceProductId ?? payload.source_product_id;
    let sourceProductObj: { id: string; name: string; category_id?: string; sub_category_id?: string; images?: any } | null = null;
    if (sourceProductId && typeof sourceProductId === "string" && sourceProductId.trim()) {
      const cleanSourceId = sourceProductId.trim();
      try {
        const { data: pData } = await db
          .from("products")
          .select("id, name, category_id, sub_category_id, images")
          .eq("id", cleanSourceId)
          .maybeSingle();
        if (pData) {
          sourceProductObj = pData;
        }
      } catch {
        // ignore lookup failure
      }

      if (!fabricNotes.includes("[Source Product ID]:")) {
        fabricNotes = fabricNotes
          ? `${fabricNotes}\n[Source Product ID]: ${cleanSourceId}`
          : `[Source Product ID]: ${cleanSourceId}`;
      }
      if (sourceProductObj?.name && !fabricNotes.includes("[Source Product Name]:")) {
        fabricNotes = `${fabricNotes}\n[Source Product Name]: ${sourceProductObj.name}`;
      }
    }

    // Extract reference images and voice note early for validation fallback
    const rawImages = payload.referenceImageUrls ?? payload.images;
    let referenceImageUrls = Array.isArray(rawImages)
      ? rawImages.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      : [];

    if (referenceImageUrls.length === 0 && sourceProductObj?.images && Array.isArray(sourceProductObj.images)) {
      referenceImageUrls = sourceProductObj.images.map((img: any) => typeof img === "string" ? img : img?.url).filter(Boolean);
    }

    const rawVoiceNote = payload.voiceNoteUrl ?? payload.voiceNote;
    const voiceNoteUrl = typeof rawVoiceNote === "string" && rawVoiceNote.trim() ? rawVoiceNote.trim() : null;

    if (!fabricNotes) {
      if (referenceImageUrls.length > 0) {
        fabricNotes = "Custom design request specified via reference images.";
      } else if (voiceNoteUrl) {
        fabricNotes = "Custom design request specified via voice note recording.";
      } else {
        throw createError("Fabric notes or design details are required.", 400);
      }
    }

    // 3. Required Size Validation
    const rawSize = payload.size;
    const size = (typeof rawSize === "string" ? rawSize.trim() : "").slice(0, 20);
    if (!size) {
      throw createError("Please select an outfit size.", 400);
    }

    // 4. Required Qty Validation
    const qty = Number(payload.qty);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      throw createError("Quantity must be a positive whole number greater than 0.", 400);
    }

    // 5. Required Timeline Resolution & Validation
    const rawTimeline = payload.timelineId ?? payload.timeline;
    const timelineInput = typeof rawTimeline === "string" ? rawTimeline.trim() : "";
    if (!timelineInput) {
      throw createError("Stitching timeline selection is required.", 400);
    }
    const resolvedTimelineId = await RequestsRepository.resolveTimelineId(timelineInput);
    if (!resolvedTimelineId) {
      throw createError("Selected stitching timeline is unavailable.", 400);
    }

    // 6. Required Fulfilment Validation
    const rawFulfilment = payload.fulfilment ?? payload.fulfillment;
    let fulfilment = typeof rawFulfilment === "string" ? rawFulfilment.trim().toLowerCase() : "";
    if (fulfilment === "store_pickup" || fulfilment === "store-pickup") {
      fulfilment = "pickup";
    }
    if (fulfilment !== "pickup" && fulfilment !== "doorstep") {
      throw createError("Fulfilment method must be either 'pickup' or 'doorstep'.", 400);
    }

    // 7. Contact Phone Number Validation (Mandatory for customer communication)
    const rawPhone = payload.phone ?? payload.customerPhone ?? payload.contactPhone;
    let cleanPhone = typeof rawPhone === "string" ? rawPhone.trim() : "";

    if (!cleanPhone && customerId) {
      const { data: cust } = await db.from("customers").select("phone").eq("id", customerId).maybeSingle();
      if (cust && typeof cust.phone === "string" && cust.phone.trim()) {
        cleanPhone = cust.phone.trim();
      }
    }

    if (!cleanPhone) {
      throw createError("Contact phone number is mandatory to submit a custom stitching request.", 400);
    }
    if (!fabricNotes.includes("[Contact Phone]:")) {
      fabricNotes = `[Contact Phone]: ${cleanPhone}\n${fabricNotes}`;
    }

    // 8. Category Resolution (UUID or Slug)
    const rawCategory = payload.categoryId ?? payload.category;
    let categoryUuid: string | null = null;
    if (rawCategory && typeof rawCategory === "string" && rawCategory.trim()) {
      categoryUuid = await RequestsRepository.resolveCategoryUuid(rawCategory.trim());
    }
    if (!categoryUuid && sourceProductObj?.category_id) {
      categoryUuid = sourceProductObj.category_id;
    }
    if (!categoryUuid) {
      categoryUuid = await RequestsRepository.resolveCategoryUuid();
    }
    if (!categoryUuid) {
      throw createError("Selected design category is required.", 400);
    }

    // 9. SubCategory Resolution (UUID or Slug)
    const rawSubCategory = payload.subCategoryId ?? payload.sub;
    let subCategoryUuid: string | null = null;
    if (rawSubCategory && typeof rawSubCategory === "string" && rawSubCategory.trim()) {
      subCategoryUuid = await RequestsRepository.resolveSubCategoryUuid(rawSubCategory.trim());
    }
    if (!subCategoryUuid && sourceProductObj?.sub_category_id) {
      subCategoryUuid = sourceProductObj.sub_category_id;
    }

    // 10. Optional Fields & Colour ID Resolution
    const colourId = await RequestsRepository.resolveColourId(colour);
    const rawColourImage = payload.customColourImageUrl ?? payload.colourImage;
    const customColourImageUrl = typeof rawColourImage === "string" && rawColourImage.trim() ? rawColourImage.trim() : null;

    // Format optional colour into fabricNotes
    if (colour && !fabricNotes.includes("[Colour]:")) {
      fabricNotes = `[Colour]: ${colour}\n${fabricNotes}`;
    }

    // Explicit DB Payload (Explicit Casing & Fields Only)
    const dbPayload = {
      customer_id: customerId,
      category_id: categoryUuid,
      sub_category_id: subCategoryUuid,
      colour_id: colourId,
      custom_colour_image_url: customColourImageUrl,
      fabric_notes: fabricNotes,
      voice_note_url: voiceNoteUrl,
      reference_image_urls: referenceImageUrls,
      size,
      qty,
      timeline_id: resolvedTimelineId,
      fulfilment,
      status: "submitted",
    };

    return await RequestsRepository.createCustomRequest(dbPayload);
  }

  static async getCustomerRequests(customerId: string) {
    if (!customerId) {
      throw createError("Authentication required.", 401);
    }
    return await RequestsRepository.getRequestsByCustomer(customerId);
  }

  static async getAllRequestsAdmin() {
    return await RequestsRepository.getAllRequests();
  }

  static async getRequestById(id: string, customerId?: string) {
    const req = await RequestsRepository.getRequestById(id);
    if (!req) {
      throw createError("Custom stitching request not found.", 404);
    }

    if (customerId && req.customer_id !== customerId) {
      throw createError("Access denied: You do not have permission to view this request.", 403);
    }

    return req;
  }

  static async submitQuoteAdmin(
    id: string,
    adminUserId: string,
    payload: {
      name?: string;
      price?: number;
      quote_amount?: number;
      deliveryFee?: number;
      delivery_fee?: number;
      readyBy?: string;
      estimated_days?: number;
      size?: string;
      isEdit?: boolean;
      updateReason?: string;
      update_reason?: string;
    }
  ) {
    const req = await RequestsRepository.getRequestById(id);
    if (!req) {
      throw createError("Custom stitching request not found.", 404);
    }

    const price = Number(payload.price ?? payload.quote_amount ?? 0);
    if (isNaN(price) || price <= 0) {
      throw createError("Stitching price must be a positive number greater than 0.", 400);
    }

    const isEdit = Boolean(payload.isEdit);
    if ((req.quote || req.status === "quoted" || req.status === "accepted" || req.status === "ordered") && !isEdit) {
      throw createError("A quotation has already been created and sent for this custom design request.", 400);
    }

    const name = (payload.name || "Custom Design Stitching").trim();
    const size = (payload.size || req.size || "Custom").trim();
    const deliveryFee = Math.max(
      0,
      Number(payload.deliveryFee ?? payload.delivery_fee ?? (req.fulfilment === "doorstep" ? 49 : 0))
    );

    let readyByDateStr: string;
    if (payload.readyBy) {
      readyByDateStr = new Date(payload.readyBy).toISOString();
    } else if (payload.estimated_days && !isNaN(Number(payload.estimated_days))) {
      readyByDateStr = new Date(Date.now() + Number(payload.estimated_days) * 24 * 60 * 60 * 1000).toISOString();
    } else {
      readyByDateStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    }

    const gstAmount = Math.round(price * 0.05);
    const totalPayable = price + gstAmount + deliveryFee;
    const updateReason = (payload.updateReason || payload.update_reason || "").trim() || undefined;

    // Partial Quotation Field Diffing when editing existing quotation
    const changedFields: string[] = [];
    if (isEdit && req.quote) {
      if (name !== req.quote.name) {
        changedFields.push(`Design Name: "${req.quote.name}" -> "${name}"`);
      }
      if (price !== req.quote.price) {
        changedFields.push(`Stitching Price: ₹${req.quote.price.toLocaleString("en-IN")} -> ₹${price.toLocaleString("en-IN")}`);
      }
      if (size !== req.quote.size) {
        changedFields.push(`Size: "${req.quote.size}" -> "${size}"`);
      }
      if (deliveryFee !== (req.quote.deliveryFee ?? 0)) {
        changedFields.push(`Delivery Fee: ₹${(req.quote.deliveryFee ?? 0).toLocaleString("en-IN")} -> ₹${deliveryFee.toLocaleString("en-IN")}`);
      }
      const oldReadyByStr = (req.quote.readyBy || "").slice(0, 10);
      const newReadyByStr = readyByDateStr.slice(0, 10);
      if (oldReadyByStr && newReadyByStr && oldReadyByStr !== newReadyByStr) {
        changedFields.push(`Ready By Date: ${oldReadyByStr} -> ${newReadyByStr}`);
      }

      if (changedFields.length === 0 && !updateReason) {
        throw createError("No quotation fields were modified.", 400);
      }
    }

    const changedFieldsSummary = changedFields.length > 0 ? changedFields.join("; ") : undefined;

    // 1. Persist quotation in DB (Quotation persistence MUST succeed before WhatsApp dispatch)
    const quoteResult = await RequestsRepository.submitQuoteAdmin(id, adminUserId, {
      name,
      size,
      price,
      gstAmount,
      deliveryFee,
      readyBy: readyByDateStr,
      updateReason,
      changedFieldsSummary,
    });

    // 2. Fetch reference image for WhatsApp binary media attachment
    const referenceImages: string[] = Array.isArray(req.reference_image_urls)
      ? req.reference_image_urls
      : Array.isArray(req.images)
      ? req.images
      : [];
    const primaryImageUrl =
      referenceImages.find((u: string) => typeof u === "string" && u.trim().startsWith("http")) || null;

    // 3. Attempt WhatsApp Notification with binary image media
    const { WhatsAppService } = await import("./whatsapp.service.js");
    const customerPhone = req.customer?.phone || req.phone || "";
    const customerName = req.customer?.full_name || "";

    const whatsappResult = await WhatsAppService.sendQuotationMediaNotification({
      toPhone: customerPhone,
      customerName,
      requestNo: req.request_no || `CR-${id.slice(0, 6).toUpperCase()}`,
      quoteName: name,
      amount: price,
      gstAmount,
      deliveryFee,
      totalPayable,
      readyBy: readyByDateStr,
      referenceImageUrl: primaryImageUrl,
      fulfilment: req.fulfilment,
    });

    return {
      ...quoteResult.request,
      quote: {
        name,
        size,
        price,
        gstAmount,
        deliveryFee,
        totalPayable,
        readyBy: readyByDateStr,
        quotedAt: new Date().toISOString(),
      },
      whatsapp: whatsappResult,
    };
  }

  static async notifyWhatsAppQuote(id: string) {
    const req = await RequestsRepository.getRequestById(id);
    if (!req) {
      throw createError("Custom stitching request not found.", 404);
    }
    if (!req.quote) {
      throw createError("Quotation has not been created for this request yet.", 400);
    }

    const { WhatsAppService } = await import("./whatsapp.service.js");
    const referenceImages: string[] = Array.isArray(req.reference_image_urls)
      ? req.reference_image_urls
      : Array.isArray(req.images)
      ? req.images
      : [];
    const primaryImageUrl =
      referenceImages.find((u: string) => typeof u === "string" && u.trim().startsWith("http")) || null;

    const customerPhone = req.customer?.phone || req.phone || "";
    const customerName = req.customer?.full_name || "";

    const whatsappResult = await WhatsAppService.sendQuotationMediaNotification({
      toPhone: customerPhone,
      customerName,
      requestNo: req.request_no || `CR-${id.slice(0, 6).toUpperCase()}`,
      quoteName: req.quote.name || "Custom Design Stitching",
      amount: req.quote.price || 0,
      gstAmount: req.quote.gstAmount || Math.round((req.quote.price || 0) * 0.05),
      deliveryFee: req.quote.deliveryFee || 0,
      totalPayable: req.quote.totalPayable || req.quote.price || 0,
      readyBy: req.quote.readyBy || new Date().toISOString(),
      referenceImageUrl: primaryImageUrl,
      fulfilment: req.fulfilment,
    });

    return { success: true, whatsapp: whatsappResult };
  }

  static async updateStatus(id: string, status: string, notes?: string) {
    return await RequestsRepository.updateRequestStatus(id, status, { notes });
  }

  static async requestChanges(id: string, customerId: string, note: string) {
    if (!note || typeof note !== "string" || !note.trim()) {
      throw createError("Modification note is required.", 400);
    }
    await this.getRequestById(id, customerId);
    return await RequestsRepository.requestChanges(id, customerId, note.trim());
  }

  static async cancelCustomRequest(id: string, customerId: string, reason: string) {
    if (!reason || typeof reason !== "string" || !reason.trim() || reason.trim().length < 3) {
      throw createError("Cancellation reason is required (minimum 3 characters).", 400);
    }
    await this.getRequestById(id, customerId);
    return await RequestsRepository.cancelCustomRequest(id, customerId, reason.trim());
  }

  static async cancelCustomRequestAdmin(id: string, reason: string) {
    if (!reason || typeof reason !== "string" || !reason.trim() || reason.trim().length < 3) {
      throw createError("Cancellation reason is required (minimum 3 characters).", 400);
    }

    const updated = await RequestsRepository.cancelCustomRequestAdmin(id, reason.trim());
    let whatsappResult: any = { sent: false, error: "WhatsApp provider unconfigured" };

    try {
      const fullReq = await RequestsRepository.getRequestById(id);
      const customerPhone = fullReq?.customer?.phone || (fullReq?.fabric_notes ? (fullReq.fabric_notes.match(/\[Contact Phone\]:\s*([^\n]+)/)?.[1]?.trim()) : null) || "";
      const customerName = fullReq?.customer?.full_name || "";
      const requestNo = fullReq?.request_no || "CR-0000";
      const referenceImageUrl = Array.isArray(fullReq?.reference_image_urls) ? fullReq.reference_image_urls[0] : fullReq?.custom_colour_image_url;

      if (customerPhone) {
        whatsappResult = await WhatsAppService.sendCancellationMediaNotification({
          toPhone: customerPhone,
          customerName,
          requestNo,
          cancelReason: reason.trim(),
          referenceImageUrl,
        });
      }
    } catch (waErr: any) {
      console.warn(`[RequestsService] WhatsApp cancellation dispatch error:`, waErr.message);
    }

    return { request: updated, whatsapp: whatsappResult };
  }

  static async convertToOrder(requestId: string, adminUserId: string) {
    return await RequestsRepository.convertRequestToOrderRpc(requestId, adminUserId);
  }

  static async uploadMediaPayload(
    filePayload: { buffer: Buffer; fileName: string; mimeType: string },
    bucketType: "image" | "audio" = "image"
  ): Promise<string> {
    const bucketName = bucketType === "audio" ? "custom-design-request-audio" : "custom-design-request-images";
    let finalMime = (filePayload.mimeType || "").split(";")[0].trim().toLowerCase();
    if (bucketType === "audio" || finalMime.startsWith("audio/")) {
      if (finalMime.includes("mp4") || finalMime.includes("m4a") || finalMime.includes("aac")) {
        finalMime = "audio/mp4";
      } else if (finalMime.includes("mp3") || finalMime.includes("mpeg")) {
        finalMime = "audio/mpeg";
      } else if (finalMime.includes("wav")) {
        finalMime = "audio/wav";
      } else if (finalMime.includes("ogg")) {
        finalMime = "audio/ogg";
      } else {
        finalMime = "audio/webm";
      }
    }

    const extMatch = filePayload.fileName.match(/\.(png|jpe?g|webp|gif|svg|webm|mp3|wav|ogg|m4a|mp4)$/i);
    const ext = extMatch
      ? extMatch[0].toLowerCase()
      : bucketType === "audio"
      ? (finalMime.includes("mp4") ? ".m4a" : finalMime.includes("mpeg") ? ".mp3" : finalMime.includes("wav") ? ".wav" : ".webm")
      : filePayload.mimeType.includes("png")
      ? ".png"
      : filePayload.mimeType.includes("webp")
      ? ".webp"
      : ".jpg";

    const pathInBucket = `${bucketType === "audio" ? "voice" : "designs"}/${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;

    const { error } = await db.storage.from(bucketName).upload(pathInBucket, filePayload.buffer, {
      contentType: finalMime,
      upsert: true,
    });

    if (error) {
      console.error(`Supabase Storage Upload Error (${bucketName}):`, error.message);
      throw createError(`Storage upload to ${bucketName} failed: ${error.message}`, 500);
    }

    const { data: pubData } = db.storage.from(bucketName).getPublicUrl(pathInBucket);
    if (!pubData || !pubData.publicUrl) {
      throw createError(`Failed to retrieve public URL from ${bucketName}.`, 500);
    }

    return pubData.publicUrl;
  }

  static async updateDesignAdmin(
    id: string,
    payload: { size?: string; qty?: number; colour?: string; fabricNotes?: string }
  ) {
    const req = await RequestsRepository.getRequestById(id);
    if (!req) {
      throw createError("Custom stitching request not found.", 404);
    }
    const cleanPayload: { size?: string; qty?: number; colour?: string; fabricNotes?: string } = {};
    if (payload.size !== undefined) {
      cleanPayload.size = String(payload.size || "").trim().slice(0, 20);
    }
    if (payload.qty !== undefined) {
      const qtyNum = Number(payload.qty);
      if (isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum <= 0) {
        throw createError("Quantity must be a positive whole number greater than 0.", 400);
      }
      cleanPayload.qty = qtyNum;
    }
    if (payload.colour !== undefined) {
      cleanPayload.colour = String(payload.colour || "").trim();
    }
    if (payload.fabricNotes !== undefined) {
      cleanPayload.fabricNotes = String(payload.fabricNotes || "").trim();
    }
    return await RequestsRepository.updateRequestDesignAdmin(id, cleanPayload);
  }

  static async acceptQuotation(id: string, customerId: string) {
    const req = await RequestsRepository.getRequestById(id);
    if (!req) {
      throw createError("Custom stitching request not found.", 404);
    }
    if (req.customer_id && String(req.customer_id) !== customerId) {
      throw createError("Forbidden: You can only accept quotations for your own requests.", 403);
    }
    if (req.status !== "quoted" && req.status !== "accepted") {
      throw createError("Quotation cannot be accepted at this request status stage.", 400);
    }
    if (!req.quote) {
      throw createError("No active studio quotation found for this request.", 400);
    }
    return await RequestsRepository.acceptQuotation(id, customerId);
  }

  static async deleteStorageFile(filePathOrUrl: string, bucketType: "image" | "audio" | "product" = "image"): Promise<void> {
    try {
      const bucketName =
        bucketType === "product" || filePathOrUrl.includes("product-images")
          ? "product-images"
          : bucketType === "audio" || filePathOrUrl.includes("custom-design-request-audio")
          ? "custom-design-request-audio"
          : "custom-design-request-images";

      const relativePath = filePathOrUrl.includes(`/${bucketName}/`)
        ? filePathOrUrl.split(`/${bucketName}/`).pop() || filePathOrUrl
        : filePathOrUrl;

      await db.storage.from(bucketName).remove([relativePath]);
    } catch (e: any) {
      console.error(`Failed to clean up orphaned storage file ${filePathOrUrl}:`, e.message);
    }
  }
}
