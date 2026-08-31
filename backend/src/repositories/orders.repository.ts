import { db } from "../config/db.js";

export class OrdersRepository {
  static async createCODOrder(orderPayload: Record<string, unknown>, items: Record<string, unknown>[]) {
    const key = (orderPayload.idempotency_key || orderPayload.idempotencyKey) as string | undefined;

    if (key) {
      const { data: existing, error } = await db
        .from("orders")
        .select("*, order_items(*)")
        .eq("idempotency_key", key)
        .maybeSingle();

      if (!error && existing) {
        return { ...existing, items: existing.order_items || [] };
      }
    }

    return await this.createOrder(orderPayload, items);
  }

  static async createOrder(orderPayload: Record<string, unknown>, items: Record<string, unknown>[]) {
    // Ensure total, delivery_type, and items are omitted if present to prevent PostgREST PGRST204 schema cache errors
    const { total, delivery_type, items: _rawItems, idempotencyKey, ...cleanPayload } = orderPayload;
    if (!cleanPayload.fulfilment_type && delivery_type) {
      cleanPayload.fulfilment_type = delivery_type;
    }

    let { data: order, error: orderErr } = await db
      .from("orders")
      .insert([cleanPayload])
      .select()
      .single();

    if (orderErr && orderErr.code === "PGRST204" && "idempotency_key" in cleanPayload) {
      delete cleanPayload.idempotency_key;
      const retried = await db
        .from("orders")
        .insert([cleanPayload])
        .select()
        .single();
      order = retried.data;
      orderErr = retried.error;
    }

    if (orderErr) throw orderErr;

    // Insert line items (triggers atomic stock check via enforce_stock_on_order_item)
    const formattedItems = items.map((item) => ({
      order_id: order.id,
      variant_id: item.variant_id ?? item.variantId ?? null,
      product_name_snapshot: item.product_name_snapshot ?? item.productName ?? item.name ?? "Item",
      size_snapshot: item.size_snapshot ?? item.size ?? "S",
      colour_snapshot: item.colour_snapshot ?? item.colour ?? "Design Colour",
      unit_price: Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0),
      qty: Number(item.qty ?? 1),
      image_url_snapshot: (item.image_url_snapshot ?? item.imageUrl ?? item.image) as string | null,
    }));
    const { error: itemsErr } = await db.from("order_items").insert(formattedItems);
    if (itemsErr) throw itemsErr;
    return order;
  }

  static async getPendingReservedQtyForVariant(variantId: string): Promise<number> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: pendingOrders, error } = await db
      .from("orders")
      .select("customer_notes")
      .eq("payment_status", "pending")
      .gte("created_at", fifteenMinutesAgo);

    if (error || !pendingOrders) return 0;

    let totalReserved = 0;
    for (const order of pendingOrders) {
      if (order.customer_notes && typeof order.customer_notes === "string" && order.customer_notes.startsWith("{")) {
        try {
          const parsed = JSON.parse(order.customer_notes);
          if (parsed && Array.isArray(parsed.pendingItems)) {
            for (const item of parsed.pendingItems) {
              const vId = item.variant_id ?? item.variantId;
              if (vId === variantId) {
                totalReserved += Number(item.qty || 1);
              }
            }
          }
        } catch {
          // ignore parse failure
        }
      }
    }
    return totalReserved;
  }

  static async createPendingRazorpayOrder(orderPayload: Record<string, unknown>, items: Record<string, unknown>[]) {
    const { total, delivery_type, items: _rawItems, ...cleanPayload } = orderPayload;
    if (!cleanPayload.fulfilment_type && delivery_type) {
      cleanPayload.fulfilment_type = delivery_type;
    }

    // Embed item snapshots into customer_notes string for pending order deferred insertion
    const rawNotes = (cleanPayload.customer_notes as string) || "";
    cleanPayload.customer_notes = JSON.stringify({
      notes: rawNotes,
      pendingItems: items,
      reservedAt: new Date().toISOString(),
    });

    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert([cleanPayload])
      .select()
      .single();
    if (orderErr) throw orderErr;
    return order;
  }

  static async getOrderByRazorpayId(razorpayOrderId: string) {
    const { data, error } = await db
      .from("orders")
      .select("*, order_items(*)")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    if (error) throw error;
    return data ? { ...data, items: data.order_items || [] } : null;
  }

  static async finalizeRazorpayOrder(orderId: string, razorpayPaymentId: string) {
    // Concurrency design: a single atomic conditional UPDATE (WHERE payment_status = 'pending')
    // is used as the gate for order finalization. Postgres acquires a row-level exclusive lock
    // during the UPDATE, making the WHERE-condition check and the mutation atomic. Two concurrent
    // callers (e.g. /payments/verify and /payments/webhook) will race:
    //   - The first to execute the UPDATE claims the row (payment_status flips to 'paid').
    //   - The second's UPDATE matches zero rows (payment_status is already 'paid'), detects
    //     this, reads the already-finalized order, and returns it — without inserting items again.
    // This eliminates the TOCTOU window that existed with a separate read-then-conditionally-write.

    // Step 1: Atomically claim the order by updating ONLY if still pending.
    const { data: claimed, error: claimErr } = await db
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("payment_status", "pending")   // ← atomic gate: only one caller wins this UPDATE
      .select("*")
      .maybeSingle();

    if (claimErr) throw claimErr;

    if (!claimed) {
      // Another caller already finalized this order — return the current state idempotently.
      const { data: existing, error: fetchErr } = await db
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();
      if (fetchErr || !existing) throw fetchErr || new Error("Order not found");
      return { ...existing, items: existing.order_items || [] };
    }

    // Step 2: This caller won the race. Parse pending items from customer_notes.
    let cleanNotes: string | null = claimed.customer_notes;
    let pendingItems: Record<string, unknown>[] = [];

    if (claimed.customer_notes && claimed.customer_notes.startsWith("{")) {
      try {
        const parsed = JSON.parse(claimed.customer_notes);
        if (parsed && Array.isArray(parsed.pendingItems)) {
          pendingItems = parsed.pendingItems;
          cleanNotes = parsed.notes || null;
        }
      } catch {
        // Fallback: treat raw string as notes
      }
    }

    // Step 3: Check whether order_items were already inserted (e.g. by a prior partial run).
    const { data: existingItems } = await db
      .from("order_items")
      .select("id")
      .eq("order_id", orderId)
      .limit(1);

    const itemsAlreadyInserted = existingItems && existingItems.length > 0;

    // Step 4: Insert order_items only if not already present and there are pending snapshots.
    // (fires enforce_stock_on_order_item trigger which atomically decrements stock)
    if (!itemsAlreadyInserted && pendingItems.length > 0) {
      const formattedItems = pendingItems.map((item) => ({
        order_id: orderId,
        variant_id: item.variant_id ?? item.variantId ?? null,
        product_name_snapshot: item.product_name_snapshot ?? item.productName ?? item.name ?? "Item",
        size_snapshot: item.size_snapshot ?? item.size ?? "S",
        colour_snapshot: item.colour_snapshot ?? item.colour ?? "Design Colour",
        unit_price: Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0),
        qty: Number(item.qty ?? 1),
        image_url_snapshot: (item.image_url_snapshot ?? item.imageUrl ?? item.image) as string | null,
      }));
      const { error: itemsErr } = await db.from("order_items").insert(formattedItems);
      if (itemsErr) throw itemsErr;
    }

    // Step 5: Update customer_notes to cleaned value (strip serialized pendingItems blob).
    if (cleanNotes !== claimed.customer_notes) {
      await db
        .from("orders")
        .update({ customer_notes: cleanNotes, updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    await this.recordPaymentEvent({
      orderId,
      razorpayPaymentId,
      eventType: "payment.verify",
      payload: { razorpayPaymentId, orderId },
      signatureVerified: true,
    });

    // Step 6: Return finalized order with items.
    const { data: finalOrder, error: finalErr } = await db
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    if (finalErr || !finalOrder) throw finalErr || new Error("Order not found after finalization");

    return { ...finalOrder, items: finalOrder.order_items || [] };
  }

  static async recordPaymentEvent(eventData: {
    orderId?: string | null;
    razorpayPaymentId?: string | null;
    eventType: string;
    payload: Record<string, unknown>;
    signatureVerified?: boolean;
  }) {
    try {
      await db.from("payment_events").insert({
        order_id: eventData.orderId || null,
        razorpay_payment_id: eventData.razorpayPaymentId || null,
        event_type: eventData.eventType,
        payload: eventData.payload,
        signature_verified: eventData.signatureVerified ?? true,
        processed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[OrdersRepository] Payment event log notice:", (err as Error).message);
    }
  }

  static async markRazorpayOrderFailed(orderId: string) {
    const { data, error } = await db
      .from("orders")
      .update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async cancelPendingRazorpayOrder(razorpayOrderId: string, customerId?: string) {
    let query = db
      .from("orders")
      .update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpayOrderId)
      .eq("payment_status", "pending");

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data: existingOrder, error: fetchErr } = await db
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existingOrder) return null;
    if (existingOrder.payment_status === "paid") return existingOrder;

    const { data: updated, error: updateErr } = await query.select().maybeSingle();
    if (updateErr) throw updateErr;
    return updated || existingOrder;
  }

  static async resolveAddressId(customerId: string, addressId?: string, shipping?: Record<string, unknown>): Promise<string | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (addressId && uuidRegex.test(addressId)) {
      const { data } = await db
        .from("addresses")
        .select("id")
        .eq("id", addressId)
        .eq("customer_id", customerId)
        .maybeSingle();
      if (data?.id) return data.id;
    }

    if (shipping) {
      const fullName = (shipping?.fullName as string) || (shipping?.full_name as string) || "";
      const phone = (shipping?.phone as string) || "";
      const line1 = (shipping.line1 as string) || "";
      const city = (shipping.city as string) || "";
      const state = (shipping.state as string) || "";
      const pincode = (shipping.pincode as string) || "";

      if (!fullName?.trim() || !phone?.trim() || !line1?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
        const err = new Error("Invalid address: Required shipping address fields (fullName, phone, line1, city, state, pincode) are missing.") as Error & { statusCode: number };
        err.statusCode = 400;
        throw err;
      }

      // Check if matching address already exists for this customer to prevent duplicate insertion
      const { data: existing } = await db
        .from("addresses")
        .select("id")
        .eq("customer_id", customerId)
        .ilike("full_name", fullName.trim())
        .ilike("line1", line1.trim())
        .eq("pincode", pincode.trim())
        .maybeSingle();

      if (existing?.id) {
        return existing.id;
      }

      const { data, error } = await db
        .from("addresses")
        .insert({
          customer_id: customerId,
          full_name: fullName.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          line2: (shipping.line2 as string)?.trim() || null,
          landmark: (shipping.landmark as string)?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          address_type: (shipping.addressType as string) || (shipping.address_type as string) || "home",
        })
        .select("id")
        .single();
      if (error) throw error;
      if (data?.id) return data.id;
    }

    return null;
  }

  static async getOrdersByCustomer(customerId: string) {
    const { data, error } = await db
      .from("orders")
      .select("*, items:order_items(*), address:addresses(*)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getOrderByIdCustomer(id: string, customerId: string) {
    const { data, error } = await db
      .from("orders")
      .select("*, items:order_items(*), shipment:shipments(*, scans:shipment_scans(*)), address:addresses(*)")
      .eq("id", id)
      .eq("customer_id", customerId)  // RLS enforced: customer can only read own order
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  static async getAllOrdersAdmin(filters?: { stage?: string; delivery_type?: string; limit?: number; offset?: number }) {
    let query = db.from("v_admin_orders").select("*, items:order_items(*)", { count: "exact" });
    if (filters?.stage && filters.stage !== "all") {
      query = query.eq("stage", filters.stage);
    }
    if (filters?.delivery_type && filters.delivery_type !== "all") {
      query = query.eq("fulfilment_type", filters.delivery_type);
    }
    const limit = filters?.limit ? Math.min(Number(filters.limit), 100) : 20;
    const offset = filters?.offset ? Math.max(Number(filters.offset), 0) : 0;

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return { orders: data ?? [], total: count ?? 0, limit, offset };
  }

  static async getOrderByIdAdmin(id: string) {
    const { data, error } = await db
      .from("v_admin_orders")
      .select("*, items:order_items(*), shipment:shipments(*, scans:shipment_scans(*))")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  static async getFilteredOrdersAdmin(filters: { stage?: string; delivery_type?: string; limit?: number; offset?: number }) {
    return await this.getAllOrdersAdmin(filters);
  }

  /** Updates order stage AND inserts audit event row per spec */
  static async updateOrderStatus(id: string, stage: string, changedBy: string, notes?: string) {
    const { data: existing } = await db
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .single();

    const previousStage = existing?.stage;

    const payload: Record<string, unknown> = { stage, updated_at: new Date().toISOString() };

    const { data, error } = await db
      .from("orders")
      .update(payload)
      .eq("id", id)
      .select("*, order_items(*)")
      .single();
    if (error) throw error;

    // Insert audit event row per spec (admin_api_contract §7)
    await db.from("order_stage_events").insert({
      order_id: id,
      stage,
      changed_by: changedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(changedBy) ? changedBy : null,
      created_at: new Date().toISOString(),
    });

    // If stage was changed to 'cancelled' and was not previously 'cancelled', restore stock
    // Idempotent: checks stock_adjustments for existing sale_reversal before restoring (spec §8, §70)
    if (stage === "cancelled" && previousStage !== "cancelled" && existing?.order_items) {
      // Check if stock was already restored for this order (by cancellation.service.ts or a prior call)
      const { data: existingReversal } = await db
        .from("stock_adjustments")
        .select("id")
        .eq("order_id", id)
        .eq("reason", "sale_reversal")
        .maybeSingle();

      if (!existingReversal) {
        for (const item of existing.order_items) {
          if (item.variant_id && item.qty > 0) {
            const { data: v } = await db
              .from("product_variants")
              .select("stock_qty")
              .eq("id", item.variant_id)
              .single();

            if (v) {
              const newStock = Number(v.stock_qty || 0) + Number(item.qty);
              await db
                .from("product_variants")
                .update({ stock_qty: newStock, updated_at: new Date().toISOString() })
                .eq("id", item.variant_id);

              await db.from("stock_adjustments").insert({
                variant_id: item.variant_id,
                delta: Number(item.qty),
                reason: "sale_reversal",
                order_id: id,
                adjusted_by: changedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(changedBy) ? changedBy : null,
                note: notes || "Order cancellation stock reversal",
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    return { ...data, items: data.order_items || [] };
  }

  /** Creates a proper shipments record with Blue Dart AWB (backend-generated) */
  static async createShipment(orderId: string, payload: {
    courier: string;
    awb: string;
    service?: string;
    expected_date?: string;
    blue_dart_reference?: string;
    tracking_url?: string;
    status?: string;
  }) {
    const trackingUrl = payload.tracking_url ||
      (payload.courier.toLowerCase().includes("blue dart")
        ? `https://www.bluedart.com/tracking?handler=tnt&action=awbquery&awb=${encodeURIComponent(payload.awb)}`
        : undefined);

    const { data: shipment, error: shipErr } = await db
      .from("shipments")
      .insert({
        order_id: orderId,
        courier: payload.courier,
        awb: payload.awb,
        service: payload.service ?? "Domestic Priority",
        tracking_url: trackingUrl,
        handed_over_at: new Date().toISOString(),
        expected_date: payload.expected_date ?? null,
        blue_dart_reference: payload.blue_dart_reference ?? null,
        status: payload.status ?? "created",
      })
      .select()
      .single();
    if (shipErr) throw shipErr;

    // Insert initial shipment scan event
    await db.from("shipment_scans").insert({
      shipment_id: shipment.id,
      stage_code: "shipped",
      location: "Coimbatore, Tamil Nadu",
      detail: "Shipment created and handed over to Blue Dart",
      scanned_at: new Date().toISOString(),
    }).maybeSingle();

    // Advance order stage to 'shipped' ONLY after successful shipment persistence
    // spec §23: order stage = shipped only after Blue Dart success + DB persistence
    const { error: stageErr } = await db
      .from("orders")
      .update({ stage: "shipped", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (stageErr) throw stageErr;

    // Record order stage event
    await db.from("order_stage_events").insert({
      order_id: orderId,
      stage: "shipped",
      changed_by: null,
      created_at: new Date().toISOString(),
    });

    return shipment;
  }

  /**
   * Returns the current active shipment for an order.
   * Used for idempotency check before calling Blue Dart (spec §20, §72).
   */
  static async getShipmentByOrder(orderId: string) {
    const { data, error } = await db
      .from("shipments")
      .select("*, scans:shipment_scans(*)")
      .eq("order_id", orderId)
      .not("status", "in", '("cancelled","rto")')
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  /**
   * Updates status of a shipment (e.g. cancelled, pickup_registered, delivered)
   */
  static async updateShipmentStatus(shipmentId: string, patch: Record<string, unknown>) {
    const { data, error } = await db
      .from("shipments")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", shipmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Updates pickup registration metadata on a shipment
   */
  static async updatePickupStatus(shipmentId: string, pickupToken: string, pickupDate: string, pickupTime: string) {
    const { data, error } = await db
      .from("shipments")
      .update({
        pickup_registration_status: "registered",
        pickup_token: pickupToken,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipmentId)
      .select()
      .single();
    if (error) throw error;

    // Log scan event
    await db.from("shipment_scans").insert({
      shipment_id: shipmentId,
      stage_code: "shipped",
      location: "Coimbatore, Tamil Nadu",
      detail: `Pickup registered with Blue Dart (Token: ${pickupToken}) for ${pickupDate} ${pickupTime}`,
      scanned_at: new Date().toISOString(),
    }).maybeSingle();

    return data;
  }
}

