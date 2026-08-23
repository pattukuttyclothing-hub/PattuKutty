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
};

type Row = Record<string, unknown>;

function mapOrder(row: Row): Order {
  const createdAt = String(row["created_at"]);
  const shipping = (row["shipping_address"] ?? {}) as ShippingAddress;
  const deliveryType = (row["delivery_type"] === "store_pickup" || row["fulfilment"] === "store_pickup" ? "store_pickup" : "doorstep") as DeliveryType;
  const storedStatus = String(row["status"] ?? "placed") as OrderStatus;
  const status = derivedStatus(createdAt, storedStatus, deliveryType);
  const awb = String(row["awb"] ?? "");
  const paymentRef = (row["razorpay_payment_id"] as string) || (row["payment_ref"] as string) || (row["payment_id"] as string) || (row["paymentMethod"] === "razorpay" ? `pay_${row["id"]}` : undefined);

  return {
    id: String(row["id"]),
    orderNo: String(row["order_no"] ?? `OR-${String(row["id"]).slice(-6).toUpperCase()}`),
    createdAt,
    items: (row["items"] ?? []) as CartItem[],
    subtotal: Number(row["subtotal"] ?? 0),
    delivery: Number(row["delivery_fee"] ?? 0),
    total: Number(row["total"] ?? 0),
    shipping,
    notes: (row["notes"] as string | null) ?? null,
    paymentMethod: String(row["payment_method"]) === "cod" ? "cod" : "razorpay",
    paymentStatus: String(row["payment_status"] ?? "pending") as Order["paymentStatus"],
    paymentRef,
    status,
    deliveryType,
    awb,
    trackingUrl: awb ? blueDartTrackingUrl(awb) : undefined,
    scans: buildScans(createdAt, status, shipping.city ?? "Coimbatore", shipping.state ?? "TN", deliveryType),
    custom: Boolean(row["is_custom"]),
    requestId: (row["request_id"] as string | null) ?? null,
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
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { fetchCustomerOrders } = await import("./api/orders");
      const liveOrders = await fetchCustomerOrders();
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
      } else {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) setOrders((data as Row[]).map(mapOrder));
      }
    } catch {
      /* Fallback to local store */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, refresh]);

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
