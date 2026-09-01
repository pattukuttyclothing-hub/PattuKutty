import { db } from "../config/db.js";

export class RequestsRepository {
  private static isUUID(val: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
  }

  static async resolveCategoryUuid(catIdOrSlug?: string): Promise<string | null> {
    const trimmed = typeof catIdOrSlug === "string" ? catIdOrSlug.trim() : "";

    if (trimmed && this.isUUID(trimmed)) {
      return trimmed;
    }

    try {
      if (trimmed) {
        const { data } = await db.from("categories").select("id").eq("slug", trimmed).maybeSingle();
        if (data?.id && this.isUUID(data.id)) return data.id;

        const normalized = trimmed.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
        const { data: dataNorm } = await db.from("categories").select("id").eq("slug", normalized).maybeSingle();
        if (dataNorm?.id && this.isUUID(dataNorm.id)) return dataNorm.id;

        const { data: dataName } = await db.from("categories").select("id").ilike("name", `%${trimmed}%`).maybeSingle();
        if (dataName?.id && this.isUUID(dataName.id)) return dataName.id;
      }

      // Fallback to first available category UUID so category_id is never NULL in DB
      const { data: anyCat } = await db.from("categories").select("id").limit(1).maybeSingle();
      if (anyCat?.id && this.isUUID(anyCat.id)) return anyCat.id;
    } catch {
      // ignore
    }

    return null;
  }

  static async resolveSubCategoryUuid(subIdOrSlug?: string): Promise<string | null> {
    if (!subIdOrSlug || typeof subIdOrSlug !== "string") return null;
    const trimmed = subIdOrSlug.trim();
    if (!trimmed) return null;

    if (this.isUUID(trimmed)) {
      return trimmed;
    }

    try {
      const { data } = await db.from("sub_categories").select("id").eq("slug", trimmed).maybeSingle();
      if (data?.id && this.isUUID(data.id)) return data.id;

      const normalized = trimmed.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
      const { data: dataNorm } = await db.from("sub_categories").select("id").eq("slug", normalized).maybeSingle();
      if (dataNorm?.id && this.isUUID(dataNorm.id)) return dataNorm.id;

      const { data: dataName } = await db.from("sub_categories").select("id").ilike("name", `%${trimmed}%`).maybeSingle();
      if (dataName?.id && this.isUUID(dataName.id)) return dataName.id;

      // Fallback to first available subcategory UUID
      const { data: anySub } = await db.from("sub_categories").select("id").limit(1).maybeSingle();
      if (anySub?.id && this.isUUID(anySub.id)) return anySub.id;
    } catch {
      // ignore
    }

    return null;
  }

  static async resolveTimelineId(timelineId?: string): Promise<string | null> {
    if (!timelineId || typeof timelineId !== "string") return null;
    const trimmed = timelineId.trim();
    if (!trimmed) return null;

    const normUnderscore = trimmed.replace(/-/g, "_");
    const normPlural = normUnderscore.endsWith("day") ? `${normUnderscore}s` : normUnderscore;
    const normSingular = normUnderscore.endsWith("days") ? normUnderscore.slice(0, -1) : normUnderscore;
    const normHyphen = trimmed.replace(/_/g, "-");

    try {
      // 1. Direct match
      const { data } = await db.from("stitching_timelines").select("id").eq("id", trimmed).maybeSingle();
      if (data?.id) return data.id;

      // 2. Plural underscore (e.g. "3-day" or "3_day" -> "3_days")
      const { data: dataPlural } = await db.from("stitching_timelines").select("id").eq("id", normPlural).maybeSingle();
      if (dataPlural?.id) return dataPlural.id;

      // 3. Singular underscore (e.g. "3-days" -> "3_day")
      const { data: dataSingular } = await db.from("stitching_timelines").select("id").eq("id", normSingular).maybeSingle();
      if (dataSingular?.id) return dataSingular.id;

      // 4. Standard underscore (e.g. "1-day" -> "1_day")
      const { data: dataUnderscore } = await db.from("stitching_timelines").select("id").eq("id", normUnderscore).maybeSingle();
      if (dataUnderscore?.id) return dataUnderscore.id;

      // 5. Hyphen (e.g. "1_day" -> "1-day")
      const { data: dataHyphen } = await db.from("stitching_timelines").select("id").eq("id", normHyphen).maybeSingle();
      if (dataHyphen?.id) return dataHyphen.id;
    } catch {
      // fallback
    }

    return null;
  }

  static async resolveColourId(colourName?: string): Promise<number | null> {
    if (!colourName || typeof colourName !== "string") return null;
    const trimmed = colourName.trim();
    if (!trimmed) return null;

    try {
      const { data } = await db.from("colours").select("id").ilike("name", trimmed).maybeSingle();
      return data?.id ?? null;
    } catch {
      return null;
    }
  }

  static async createCustomRequest(requestPayload: Record<string, unknown>) {
    const { data, error } = await db
      .from("custom_requests")
      .insert([requestPayload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data || !data.id || !data.request_no) {
      throw new Error("Database insertion succeeded but failed to return a valid request record.");
    }

    return data;
  }

  static async getRequestsByCustomer(customerId: string) {
    const { data, error } = await db
      .from("custom_requests")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Batch-fetch the current active quote for each request
    const requestIds = data.map((r: Record<string, unknown>) => r.id as string).filter(Boolean);
    let quotesMap = new Map<string, Record<string, unknown>>();
    if (requestIds.length > 0) {
      try {
        // Fetch all current quotes for these request IDs in one query
        const { data: quotes } = await db
          .from("custom_request_quotes")
          .select("*")
          .in("request_id", requestIds)
          .eq("is_current", true);

        if (quotes && quotes.length > 0) {
          for (const q of quotes) {
            quotesMap.set(String(q.request_id), q);
          }
        }

        // For requests with no is_current=true quote, try latest quote fallback
        const missingIds = requestIds.filter((id) => !quotesMap.has(id));
        if (missingIds.length > 0) {
          const { data: fallbackQuotes } = await db
            .from("custom_request_quotes")
            .select("*")
            .in("request_id", missingIds)
            .order("quoted_at", { ascending: false });

          if (fallbackQuotes && fallbackQuotes.length > 0) {
            const seenFallback = new Set<string>();
            for (const q of fallbackQuotes) {
              const rid = String(q.request_id);
              if (!seenFallback.has(rid)) {
                seenFallback.add(rid);
                quotesMap.set(rid, q);
              }
            }
          }
        }
      } catch {
        // Ignore quote fetch failures — degrade gracefully
      }
    }

    return (data as any[]).map((r: any) => {
      const q = quotesMap.get(String(r.id));
      let quote: Record<string, unknown> | null = null;
      if (q) {
        const priceNum = Number(q.price) || 0;
        const gstNum = Number(q.gst_amount) || 0;
        const deliveryNum = Number(q.delivery_fee) || 0;
        const totalNum = Number(q.total_payable) || (priceNum + gstNum + deliveryNum);
        quote = {
          name: q.name || "Custom Design Stitching",
          size: q.size || r.size,
          price: priceNum,
          gstAmount: gstNum,
          deliveryFee: deliveryNum,
          totalPayable: totalNum,
          readyBy: q.ready_by,
          quotedAt: q.quoted_at,
        };
      }
      return { ...r, quote };
    });
  }


  static async getAllRequests() {
    const { data, error } = await db
      .from("custom_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return [];

    const customerIds = [...new Set(data.map((r: Record<string, unknown>) => r.customer_id as string).filter(Boolean))];
    const categoryIds = [...new Set(data.map((r: Record<string, unknown>) => r.category_id as string).filter(Boolean))];
    const subCategoryIds = [...new Set(data.map((r: Record<string, unknown>) => r.sub_category_id as string).filter(Boolean))];
    const colourIds = [...new Set(data.map((r: Record<string, unknown>) => r.colour_id as number).filter(Boolean))];

    const [custsRes, catsRes, subsRes, coloursRes] = await Promise.all([
      customerIds.length > 0 ? db.from("customers").select("id, full_name, phone, city").in("id", customerIds) : Promise.resolve({ data: [] }),
      categoryIds.length > 0 ? db.from("categories").select("id, slug, name").in("id", categoryIds) : Promise.resolve({ data: [] }),
      subCategoryIds.length > 0 ? db.from("sub_categories").select("id, slug, name").in("id", subCategoryIds) : Promise.resolve({ data: [] }),
      colourIds.length > 0 ? db.from("colours").select("id, name, hex").in("id", colourIds) : Promise.resolve({ data: [] }),
    ]);

    const custMap = new Map((custsRes.data || []).map((c: Record<string, unknown>) => [c.id as string, c]));
    const catMap = new Map((catsRes.data || []).map((c: Record<string, unknown>) => [c.id as string, c]));
    const subMap = new Map((subsRes.data || []).map((s: Record<string, unknown>) => [s.id as string, s]));
    const colourMap = new Map((coloursRes.data || []).map((cl: Record<string, unknown>) => [cl.id as number, cl]));

    return data.map((r: Record<string, unknown>) => {
      const colourMatch = typeof r.fabric_notes === "string" ? r.fabric_notes.match(/\[Colour\]:\s*([^\n]+)/) : null;
      const matchedColourFromNotes = colourMatch ? colourMatch[1].trim() : null;
      const colourObj = r.colour_id ? colourMap.get(r.colour_id as number) : null;
      const colourName = (r.colour as string) || (colourObj as any)?.name || matchedColourFromNotes || "Custom Colour";

      return {
        ...r,
        customer: custMap.get(r.customer_id as string) ?? null,
        category: catMap.get(r.category_id as string) ?? null,
        sub_category: subMap.get(r.sub_category_id as string) ?? null,
        colour: colourName,
        colour_detail: colourObj ?? null,
      };
    });
  }

  static async getRequestById(id: string) {
    const { data, error } = await db
      .from("custom_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;

    let customer = null;
    if (data.customer_id) {
      const { data: cust } = await db
        .from("customers")
        .select("id, full_name, phone, city")
        .eq("id", data.customer_id)
        .maybeSingle();
      customer = cust ?? null;
    }

    let category = null;
    if (data.category_id) {
      const { data: cat } = await db.from("categories").select("id, slug, name").eq("id", data.category_id).maybeSingle();
      category = cat ?? null;
    }

    let sub_category = null;
    if (data.sub_category_id) {
      const { data: sub } = await db.from("sub_categories").select("id, slug, name").eq("id", data.sub_category_id).maybeSingle();
      sub_category = sub ?? null;
    }

    let colourObj = null;
    if (data.colour_id) {
      const { data: cl } = await db.from("colours").select("id, name, hex").eq("id", data.colour_id).maybeSingle();
      colourObj = cl ?? null;
    }

    const colourMatch = data.fabric_notes ? data.fabric_notes.match(/\[Colour\]:\s*([^\n]+)/) : null;
    const colour = data.colour || colourObj?.name || (colourMatch ? colourMatch[1].trim() : "") || null;

    const phoneMatch = data.fabric_notes ? data.fabric_notes.match(/\[Contact Phone\]:\s*([^\n]+)/) : null;
    const extractedPhone = phoneMatch ? phoneMatch[1].trim() : "";

    if (!customer) {
      // No customer record found — do NOT inject a fake identity.
      // Return null customer so the API caller can surface a proper error.
      customer = null;
    } else if (!customer.phone) {
      customer.phone = extractedPhone || null;
    }

    let quote = null;
    try {
      let { data: q } = await db
        .from("custom_request_quotes")
        .select("*")
        .eq("request_id", id)
        .eq("is_current", true)
        .maybeSingle();

      if (!q) {
        const { data: qList } = await db
          .from("custom_request_quotes")
          .select("*")
          .eq("request_id", id)
          .order("quoted_at", { ascending: false })
          .limit(1);
        if (qList && qList.length > 0) {
          q = qList[0];
        }
      }

      if (q) {
        const priceNum = Number(q.price) || 0;
        const gstNum = Number(q.gst_amount) || 0;
        const deliveryNum = Number(q.delivery_fee) || 0;
        const totalNum = Number(q.total_payable) || (priceNum + gstNum + deliveryNum);

        quote = {
          name: q.name || "Custom Design Stitching",
          size: q.size || data.size,
          price: priceNum,
          gstAmount: gstNum,
          deliveryFee: deliveryNum,
          totalPayable: totalNum,
          readyBy: q.ready_by,
          quotedAt: q.quoted_at,
        };
      }
    } catch {
      // Ignore if quotes table read fails
    }

    const finalPhone = phoneMatch ? phoneMatch[1].trim() : (customer?.phone || "");
    if (customer && phoneMatch) {
      customer.phone = finalPhone;
    }

    return { ...data, colour: colour || "", phone: finalPhone, customer, category, sub_category, colour_detail: colourObj, quote };
  }

  static async submitQuoteAdmin(
    requestId: string,
    adminUserId: string,
    quoteData: {
      name: string;
      size: string;
      price: number;
      gstAmount: number;
      deliveryFee: number;
      readyBy: string;
      updateReason?: string;
      changedFieldsSummary?: string;
    }
  ) {
    // 1. Invalidate previous current quotes for this request
    const { error: invalidateErr } = await db
      .from("custom_request_quotes")
      .update({ is_current: false })
      .eq("request_id", requestId)
      .eq("is_current", true);

    if (invalidateErr) {
      throw invalidateErr;
    }

    // 2. Insert new quote record into custom_request_quotes table
    const quotePayload = {
      request_id: requestId,
      name: quoteData.name,
      size: quoteData.size,
      price: quoteData.price,
      gst_amount: quoteData.gstAmount,
      delivery_fee: quoteData.deliveryFee,
      ready_by: quoteData.readyBy.slice(0, 10),
      quoted_by: adminUserId,
      quoted_at: new Date().toISOString(),
      is_current: true,
    };

    const { data: insertedQuote, error: qErr } = await db
      .from("custom_request_quotes")
      .insert([quotePayload])
      .select()
      .single();

    if (qErr || !insertedQuote) {
      throw qErr || new Error("Failed to insert quotation record into custom_request_quotes table.");
    }

    // 3. Update custom_requests table status to 'quoted' and store update reason or changed fields if provided
    const reqPayload: Record<string, unknown> = {
      status: "quoted",
      updated_at: new Date().toISOString(),
    };

    const noteParts: string[] = [];
    if (quoteData.changedFieldsSummary) {
      noteParts.push(`[Updated Fields]: ${quoteData.changedFieldsSummary}`);
    }
    if (quoteData.updateReason) {
      noteParts.push(`[Admin Update Reason]: ${quoteData.updateReason}`);
    }
    if (noteParts.length > 0) {
      reqPayload.update_request_note = noteParts.join("\n");
    }

    const { data: reqData, error: reqErr } = await db
      .from("custom_requests")
      .update(reqPayload)
      .eq("id", requestId)
      .select()
      .single();

    if (reqErr) throw reqErr;

    return {
      request: reqData,
      quote: insertedQuote,
    };
  }

  static async updateRequestDesignAdmin(
    id: string,
    designData: {
      size?: string;
      qty?: number;
      colour?: string;
      fabricNotes?: string;
    }
  ) {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (designData.size !== undefined) payload.size = designData.size;
    if (designData.qty !== undefined) payload.qty = designData.qty;
    if (designData.fabricNotes !== undefined) payload.fabric_notes = designData.fabricNotes;

    if (designData.colour && typeof designData.colour === "string" && designData.colour.trim()) {
      const colourId = await this.resolveColourId(designData.colour);
      if (colourId) {
        payload.colour_id = colourId;
      }
    }

    const { data, error } = await db
      .from("custom_requests")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async acceptQuotation(id: string, customerId: string) {
    const { data, error } = await db
      .from("custom_requests")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("customer_id", customerId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Quotation accept failed: no request updated.");
    return data;
  }

  static async updateRequestStatus(id: string, status: string, updates?: Record<string, unknown>) {
    const payload = { status, updated_at: new Date().toISOString(), ...updates };
    const { data, error } = await db
      .from("custom_requests")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async requestChanges(id: string, customerId: string, note: string) {
    const payload = {
      update_request_note: note,
      update_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db
      .from("custom_requests")
      .update(payload)
      .eq("id", id)
      .eq("customer_id", customerId)
      .select()
      .single();
    if (error || !data) {
      throw error || new Error("Failed to submit design request modification note in database.");
    }
    return data;
  }

  static async cancelCustomRequest(id: string, customerId: string, reason: string) {
    const payload = {
      status: "cancelled",
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db
      .from("custom_requests")
      .update(payload)
      .eq("id", id)
      .eq("customer_id", customerId)
      .select()
      .single();
    if (error || !data) {
      throw error || new Error("Failed to cancel design request in database.");
    }
    return data;
  }

  static async cancelCustomRequestAdmin(id: string, reason: string) {
    const payload = {
      status: "cancelled",
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db
      .from("custom_requests")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      throw error || new Error("Admin failed to cancel design request in database.");
    }
    return data;
  }

  static async convertRequestToOrderRpc(requestId: string, adminUserId: string) {
    const { data, error } = await db.rpc("convert_request_to_order", {
      p_request_id: requestId,
      p_admin_id: adminUserId,
    });
    if (error) throw error;
    return data;
  }
}

