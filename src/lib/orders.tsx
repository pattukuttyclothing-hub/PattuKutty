import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import type { CartItem } from "./cart";
import {
  buildScans,
  derivedStatus,
  expectedDeliveryDate,
  doorstepSteps,
  pickupSteps,
  blueDartTrackingUrl,
  type DeliveryType,
  type OrderStatus,
  type Scan,
} from "./tracking";

export { doorstepSteps, pickupSteps };
export type { OrderStatus, Scan, DeliveryType };

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | undefined;
  landmark?: string | undefined;
  city: string;
  state: string;
  pincode: string;
  addressType?: string | undefined;
};

export type Order = {
  id: string;
  orderNo: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
  shipping: ShippingAddress;
  notes: string | null;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "pending" | "paid" | "failed";
  paymentRef?: string | undefined;
  status: OrderStatus;
  deliveryType: DeliveryType;
  awb: string;
  trackingUrl?: string | undefined;
  scans: Scan[];
  custom: boolean;
  requestId: string | null;
  expectedDelivery: string;
};

export type NewOrder = {
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
  shipping: ShippingAddress;
  notes?: string | undefined;
  paymentMethod: "razorpay" | "cod";
  paymentStatus?: "pending" | "paid" | "failed" | undefined;
  razorpayOrderId?: string | undefined;
  razorpayPaymentId?: string | undefined;
  deliveryType?: DeliveryType | undefined;
  custom?: boolean | undefined;
  requestId?: string | undefined;
  idempotencyKey?: string | undefined;
};

type Row = Record<string, unknown>;

function normalizeOrderItem(it: Record<string, unknown>): CartItem {
  const name = String(
    it["name"] ||
    it["product_name_snapshot"] ||
    it["title"] ||
    it["product_name"] ||
    ""
  );
  const size = String(
    it["size"] ||
    it["size_snapshot"] ||
    it["variant"] ||
    ""
  );
  const qty = Math.max(1, Number(it["qty"] ?? it["quantity"] ?? 1));
  const price = Number(
    it["price"] ??
    it["unit_price"] ??
    it["price_override"] ??
    0
  );
  const image = String(
    it["image"] ||
    it["image_url_snapshot"] ||
    it["image_url"] ||
    it["hero_image_url"] ||
    ""
  );
  const id = String(it["id"] || it["variant_id"] || it["product_id"] || `item-${Date.now()}`);
  const customReqId = (it["customRequestId"] || it["custom_request_id"]) as string | undefined;

  const item: CartItem = {
    key: String(it["key"] || `${id}-${size}`),
    id,
    name,
    price,
    size,
    colour: String(it["colour"] || it["colour_snapshot"] || ""),
    qty,
    image,
    isCustom: Boolean(it["isCustom"] || it["is_custom"]),
  };

  if (customReqId) {
    item.customRequestId = customReqId;
  }

  return item;
}

export function mapOrder(row: Row): Order {
  if (!row || typeof row !== "object") return row as unknown as Order;
  const createdAt = String(
    row["created_at"] ?? row["createdAt"] ?? row["created_at_utc"] ?? new Date().toISOString()
  );
  const rawId = String(row["id"] ?? `ord-${Date.now()}`);
  const orderNo = String(
    row["order_no"] ??
    row["orderNo"] ??
    row["order_number"] ??
    `OR-${rawId.slice(-6).toUpperCase()}`
  );
  const shipping = ((row["shipping_address"] ?? row["shipping"] ?? {}) as ShippingAddress);
  const deliveryType = (
    row["delivery_type"] === "store_pickup" ||
    row["fulfilment"] === "store_pickup" ||
    row["deliveryType"] === "store_pickup"
      ? "store_pickup"
      : "doorstep"
  ) as DeliveryType;

  const storedStatus = String(
    row["stage"] ?? row["status"] ?? row["order_status"] ?? "placed"
  ) as OrderStatus;

  const status = derivedStatus(createdAt, storedStatus, deliveryType);
  const awb = String(row["awb"] ?? row["tracking_awb"] ?? "");
  const paymentRef =
    (row["razorpay_payment_id"] as string) ||
    (row["payment_ref"] as string) ||
    (row["payment_id"] as string) ||
    (row["paymentRef"] as string) ||
    (row["payment_method"] === "razorpay" || row["paymentMethod"] === "razorpay" ? `pay_${rawId}` : undefined);

  let rawList: Record<string, unknown>[] = [];
  const rawItems = row["items"] ?? row["order_items"];
  if (Array.isArray(rawItems)) {
    rawList = rawItems as Record<string, unknown>[];
  } else if (typeof rawItems === "string") {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) rawList = parsed as Record<string, unknown>[];
    } catch {
      rawList = [];
    }
  }
  const items: CartItem[] = rawList.map(normalizeOrderItem);

  const itemsSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const subtotal = Number(row["subtotal"] ?? (itemsSubtotal > 0 ? itemsSubtotal : 0));
  const delivery = Number(row["delivery_fee"] ?? row["delivery"] ?? row["deliveryFee"] ?? 0);
  const total = Number(row["total"] ?? row["total_amount"] ?? row["totalPayable"] ?? (subtotal + delivery));

  return {
    id: rawId,
    orderNo,
    createdAt,
    items,
    subtotal,
    delivery,
    total,
    shipping,
    notes: typeof row["notes"] === "string" ? row["notes"] : typeof row["customer_notes"] === "string" ? row["customer_notes"] : null,
    paymentMethod: String(row["payment_method"] ?? row["paymentMethod"]) === "cod" ? "cod" : "razorpay",
    paymentStatus: String(row["payment_status"] ?? row["paymentStatus"] ?? "pending") as Order["paymentStatus"],
    paymentRef,
    status,
    deliveryType,
    awb,
    trackingUrl: awb ? blueDartTrackingUrl(awb) : undefined,
    scans: buildScans(createdAt, status, shipping?.city ?? "Coimbatore", shipping?.state ?? "TN", deliveryType),
    custom: Boolean(row["is_custom"] ?? row["custom"]),
    requestId: typeof row["request_id"] === "string" ? row["request_id"] : typeof row["requestId"] === "string" ? row["requestId"] : null,
    expectedDelivery: expectedDeliveryDate(createdAt, deliveryType).toISOString(),
  };
}

type OrdersValue = {
  orders: Order[];
  loading: boolean;
  count: number;
  find: (id: string) => Order | undefined;
  place: (o: NewOrder) => Promise<Order>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<OrdersValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const { fetchCustomerOrders } = await import("./api/orders");
        const liveOrders = await fetchCustomerOrders();
        if (Array.isArray(liveOrders)) {
          // Always use live data, even if empty (empty = no orders yet)
          const mapped = liveOrders.map(mapOrder);
          setOrders(mapped);
          try {
            // Update cache with fresh data so it reflects latest status
            localStorage.setItem("pk_customer_orders", JSON.stringify(mapped));
          } catch {}
          return;
        }
      }
      // Not logged in — clear orders
      setOrders([]);
    } catch (err) {
      console.warn("[Orders] Order refresh error — falling back to cache:", err);
      // Only use stale localStorage as last resort when network fails
      const saved = typeof window !== "undefined" ? localStorage.getItem("pk_customer_orders") : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setOrders(parsed.map(mapOrder));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    void refresh();

    // Poll every 15 seconds so status updates from admin appear promptly
    const interval = window.setInterval(() => {
      void refresh();
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [ready, user, refresh]);

  const place = useCallback(
    async (o: NewOrder) => {
      if (!user) throw new Error("Please sign in to place your order.");
      const deliveryType = o.deliveryType ?? "doorstep";

      const { placeOrder: apiPlaceOrder, placeCODOrder: apiPlaceCODOrder } = await import("./api/orders");
      const addressId = (o.shipping as Record<string, unknown> & { id?: string })?.id;

      const orderPayload = {
        addressId: addressId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(addressId) ? addressId : undefined,
        shipping: o.shipping as unknown as Record<string, unknown>,
        deliveryType,
        paymentMethod: o.paymentMethod,
        razorpayOrderId: o.razorpayOrderId,
        razorpayPaymentId: o.razorpayPaymentId,
        customerNotes: o.notes ?? undefined,
        idempotencyKey: o.idempotencyKey ?? undefined,
        items: o.items.map((it) => ({
          id: it.id,
          productId: it.id,
          size: it.size,
          colour: it.colour,
          qty: it.qty,
        })),
      };

      const apiOrder = o.paymentMethod === "cod"
        ? await apiPlaceCODOrder(orderPayload)
        : await apiPlaceOrder(orderPayload);

      if (apiOrder) {
        setOrders((prev) => [apiOrder, ...prev]);
        return apiOrder;
      }

      throw new Error("Could not place order. Please try again.");
    },
    [user],
  );

  const value = useMemo<OrdersValue>(
    () => ({
      orders,
      loading,
      count: orders.length,
      find: (id) => orders.find((o) => o.id === id || o.orderNo === id),
      place,
      refresh,
    }),
    [orders, loading, place, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrders() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrders must be used inside OrdersProvider");
  return ctx;
}
