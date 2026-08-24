import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  categories,
  seedProducts,
  storeSettings,
  type CategoryId,
  type SizeOption,
  type TimelineId,
} from "@/data/boutique";
import { seedReels, seedFeaturedIds, type ReelItem } from "@/data/reels";

export type { ReelItem };

/* ------------------------------------------------------------------ types */

/** Simplified variant for boutique — one piece per size, no colour dimension. */
export type Variant = {
  size: SizeOption;
  available: boolean;
  stockQty?: number;
};

/** products + product_images + product_variants, as the admin edits them */
export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  sub: string;
  basePrice: number;
  mrp: number;
  /** short one-line blurb shown on the storefront card */
  blurb: string;
  /** small ribbon on the storefront card, e.g. "Bestseller" */
  badge: string;
  /** "Express from ₹…" price shown for fast stitching */
  expressFromPrice: number;
  /** Explicit delivery charge for this product (₹) */
  deliveryCharge: number;
  isActive: boolean;
  /** true when the admin marks the entire product sold out */
  soldOut: boolean;

  images: string[];
  variants: Variant[];
};

export type RequestStatus =
  | "submitted"
  | "under_review"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "ready"
  | "delivered"
  | "cancelled";

/** custom_requests + custom_request_quotes */
export type CustomRequest = {
  id: string;
  requestNo: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  category: CategoryId;
  sub: string;
  categoryName?: string;
  subCategoryName?: string;
  referenceImages: string[];
  colour: string;
  /** photo the customer uploaded when they picked "custom colour" */
  customColourImage?: string;
  fabricNotes: string;
  voiceNote?: string;
  size: string;
  qty: number;
  timeline: TimelineId;
  fulfilment: "pickup" | "doorstep";
  status: RequestStatus;
  sourceProductId?: string;
  /** reason the customer gave when cancelling */
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  /** set when the customer asks for a change after the quote */
  updateRequestedAt?: string;
  updateRequestNote?: string;
  /** Admin modification reason when editing design or quote */
  updateReason?: string;
  quote?: {
    name: string;
    size: string;
    price: number;
    gstAmount: number;
    deliveryFee: number;
    totalPayable: number;
    readyBy: string;
    quotedAt: string;
  };
};

/** orders.stage — includes both doorstep and store-pickup stages */
export type OrderStage =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "ready_for_pickup"
  | "picked_up"
  | "cancelled";

export type DeliveryType = "doorstep" | "store_pickup";

export type OrderItem = {
  name: string;
  size: string;
  colour: string;
  unitPrice: number;
  qty: number;
  image: string;
};

export type AdminOrder = {
  id: string;
  orderNo: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  address: {
    line1: string;
    landmark?: string;
    type?: "home" | "work" | "other";
    city: string;
    state: string;
    pincode: string;
  };
  /** note the customer typed at checkout */
  customerNotes?: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  /** Razorpay payment / order reference */
  paymentRef?: string;
  paymentAttemptedAt?: string;
  /** Blue Dart shipment details — auto-populated when admin enters AWB */
  shipment?: { partner: string; awb: string; trackingUrl?: string; handedOverAt?: string };
  stage: OrderStage;
  deliveryType: DeliveryType;
  isCustom: boolean;
  requestNo?: string;
};

/* ----------------------------------------------------------- stage config */

/** Stages for doorstep (delivery partner) orders */
export const doorstepStages: { id: OrderStage; label: string; hint: string; adminControlled: boolean }[] =
  [
    {
      id: "placed",
      label: "Order Placed",
      hint: "Order received from the storefront.",
      adminControlled: true,
    },
    {
      id: "confirmed",
      label: "Measurements Confirmed",
      hint: "Fit and fabric confirmed — stitching in progress.",
      adminControlled: true,
    },
    {
      id: "packed",
      label: "Packed",
      hint: "Finishing done, outfit packed with care instructions.",
      adminControlled: true,
    },
    {
      id: "shipped",
      label: "Handed to Delivery Partner",
      hint: "Picked up by Blue Dart — tracking is live for the customer.",
      adminControlled: true,
    },
    {
      id: "delivered",
      label: "Delivered",
      hint: "Updated automatically by the delivery partner.",
      adminControlled: false,
    },
  ];

/** Stages for store-pickup orders — no delivery partner needed */
export const pickupStages: { id: OrderStage; label: string; hint: string; adminControlled: boolean }[] =
  [
    {
      id: "placed",
      label: "Order Placed",
      hint: "Order received from the storefront.",
      adminControlled: true,
    },
    {
      id: "confirmed",
      label: "Measurements Confirmed",
      hint: "Fit and fabric confirmed — stitching in progress.",
      adminControlled: true,
    },
    {
      id: "packed",
      label: "Packed",
      hint: "Finishing done, outfit packed with care instructions.",
      adminControlled: true,
    },
    {
      id: "ready_for_pickup",
      label: "Ready for Pickup",
      hint: "Customer can collect from the store.",
      adminControlled: true,
    },
    {
      id: "picked_up",
      label: "Picked Up",
      hint: "Customer collected the order from the store.",
      adminControlled: true,
    },
  ];

/** Legacy — kept for backwards compat but prefer getStagesForOrder() */
export const orderStages = doorstepStages;

/** Returns the correct stage list for an order based on its delivery type */
export const getStagesForOrder = (order: AdminOrder) =>
  order.deliveryType === "store_pickup" ? pickupStages : doorstepStages;

export const stageIndex = (s: OrderStage, stages = doorstepStages) => {
  const i = stages.findIndex((x) => x.id === s);
  return i < 0 ? 0 : i;
};
export const stageMeta = (s: OrderStage, stages = doorstepStages) => stages[stageIndex(s, stages)]!;

export const requestStatusLabel: Record<RequestStatus, string> = {
  submitted: "New Request",
  under_review: "Under Review",
  quoted: "Quotation Sent",
  accepted: "Accepted",
  in_progress: "In Stitching",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Build a Blue Dart tracking URL from an AWB number */
export const blueDartTrackingUrl = (awb: string) =>
  `https://www.bluedart.com/tracking?handler=tnt&action=awbquery&awb=${encodeURIComponent(awb)}`;

/* -------------------------------------------------------------- seed data */

const seedAdminProducts = (): AdminProduct[] =>
  seedProducts.map((p, pi) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    sub: p.sub,
    basePrice: p.price,
    mrp: p.mrp,
    blurb: p.description.split(".")[0] ?? p.name,
    badge: pi % 7 === 0 ? "Bestseller" : "",
    expressFromPrice: Math.round(p.price * 1.15),
    deliveryCharge: 49,
    isActive: true,
    soldOut: false,
    images: p.images,
    variants: p.sizes.map((s, si) => ({
      size: s,
      available: (pi + si) % 5 !== 0, // some sizes sold out for realism
    })),
  }));

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const seedRequests = (): CustomRequest[] => {
  const bl = categories[3]!;
  const hs = categories[0]!;
  const fr = categories[1]!;
  const voice =
    "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4";
  return [
    {
      id: "req-1",
      requestNo: "CR-2601-004",
      customerName: "Divya Ramesh",
      customerPhone: "+91 98765 43210",
      createdAt: hoursAgo(3),
      category: bl.id,
      sub: "bridal-blouses",
      referenceImages: bl.subs[0]!.images.slice(0, 3),
      colour: "Maroon",
      fabricNotes:
        "Bridal blouse with heavy aari work on the sleeves, boat neck in front and a deep back with tassels. Fabric already purchased.",
      voiceNote: voice,
      size: "M",
      qty: 1,
      timeline: "3-day",
      fulfilment: "doorstep",
      status: "submitted",
      customColourImage: bl.subs[0]!.images[3] ?? bl.subs[0]!.images[0]!,
    },
    {
      id: "req-2",
      requestNo: "CR-2601-003",
      customerName: "Anitha Suresh",
      customerPhone: "+91 90032 11884",
      createdAt: hoursAgo(9),
      category: hs.id,
      sub: "lehenga",
      referenceImages: hs.subs[1]!.images.slice(0, 3),
      colour: "Rani Pink",
      fabricNotes: "Can-can lehenga with belt work, custom fit. Need it before the reception.",
      size: "Custom",
      qty: 1,
      timeline: "3-day",
      fulfilment: "pickup",
      status: "submitted",
    },
    {
      id: "req-3",
      requestNo: "CR-2601-002",
      customerName: "Meena Karthik",
      customerPhone: "+91 93455 20988",
      createdAt: hoursAgo(30),
      category: fr.id,
      sub: "wedding-frocks",
      referenceImages: fr.subs[1]!.images.slice(0, 3),
      colour: "Ivory",
      fabricNotes: "Layered gown for my daughter, puff sleeves and a small train.",
      voiceNote: voice,
      size: "S",
      qty: 2,
      timeline: "2-day",
      fulfilment: "doorstep",
      status: "quoted",
      updateRequestedAt: hoursAgo(4),
      updateRequestNote: "Can we make the sleeves elbow length instead of full?",
      quote: {
        name: "Ivory Layered Wedding Gown",
        size: "S",
        price: 5200,
        gstAmount: 260,
        deliveryFee: 49,
        totalPayable: 5509,
        readyBy: new Date(Date.now() + 52 * 3_600_000).toISOString(),
        quotedAt: hoursAgo(26),
      },
    },
  ];
};

const seedOrders = (): AdminOrder[] => {
  const p = seedProducts;
  const mk = (
    n: number,
    stage: OrderStage,
    name: string,
    phone: string,
    pm: AdminOrder["paymentMethod"],
    ps: AdminOrder["paymentStatus"],
    idx: number[],
    hrs: number,
    isCustom = false,
    deliveryType: DeliveryType = "doorstep",
  ): AdminOrder => {
    const items: OrderItem[] = idx.map((i, k) => ({
      name: p[i]!.name,
      size: ["S", "M", "L"][k % 3]!,
      colour: "Rani Pink",
      unitPrice: p[i]!.price,
      qty: 1,
      image: p[i]!.images[0]!,
    }));
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const gstAmount = Math.round(subtotal * (storeSettings.gstPercent / 100));
    const deliveryFee = deliveryType === "store_pickup" ? 0 : 49;
    return {
      id: `ord-${n}`,
      orderNo: `OR-2601-00${n}`,
      createdAt: hoursAgo(hrs),
      customerName: name,
      customerPhone: phone,
      address: {
        line1: "12A, Ramanathapuram, 3rd Street",
        landmark: "Opposite Saibaba Temple",
        type: n % 2 === 0 ? "work" : "home",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641045",
      },
      ...(n % 2 === 0
        ? { customerNotes: "Please call before delivery, I am at work till 6pm." }
        : {}),
      items,
      subtotal,
      gstAmount,
      deliveryFee,
      total: subtotal + gstAmount + deliveryFee,
      paymentMethod: pm,
      paymentStatus: ps,
      ...(pm === "razorpay"
        ? { paymentRef: `pay_R${(90000 + n * 137).toString(36).toUpperCase()}9K2`, paymentAttemptedAt: hoursAgo(hrs) }
        : {}),
      ...(stage === "shipped" || stage === "delivered"
        ? {
            shipment: {
              partner: "Blue Dart",
              awb: `BD${1200340 + n}`,
              trackingUrl: blueDartTrackingUrl(`BD${1200340 + n}`),
              handedOverAt: hoursAgo(Math.max(1, hrs - 6)),
            },
          }
        : {}),
      stage,
      deliveryType,
      isCustom,
      ...(isCustom ? { requestNo: "CR-2601-001" } : {}),
    };
  };
  return [
    mk(5, "placed", "Priyanka Nair", "+91 98940 22110", "razorpay", "paid", [0, 13], 2),
    mk(4, "confirmed", "Shalini Venkat", "+91 90876 55321", "cod", "pending", [21], 10),
    mk(3, "packed", "Lakshmi Iyer", "+91 89400 76512", "razorpay", "paid", [33, 41], 26),
    mk(2, "shipped", "Divya Ramesh", "+91 98765 43210", "razorpay", "paid", [8], 44, true),
    mk(1, "delivered", "Meena Karthik", "+91 93455 20988", "cod", "paid", [17], 96),
    // Store pickup custom order example
    mk(6, "ready_for_pickup", "Anitha Suresh", "+91 90032 11884", "razorpay", "paid", [5], 18, true, "store_pickup"),
  ];
};

/* ------------------------------------------------------------------ store */

type Value = {
  products: AdminProduct[];
  requests: CustomRequest[];
  requestsLoading: boolean;
  requestsError: string | null;
  reloadRequests: () => void;
  orders: AdminOrder[];
  reels: ReelItem[];
  featuredIds: string[];
  findProduct: (id: string) => AdminProduct | undefined;
  findRequest: (id: string) => CustomRequest | undefined;
  findOrder: (id: string) => AdminOrder | undefined;
  saveProduct: (p: AdminProduct) => void;
  addProduct: (p: AdminProduct) => void;
  saveRequest: (id: string, patch: Partial<CustomRequest>) => void;
  setOrderStage: (id: string, stage: OrderStage) => void;
  saveOrder: (id: string, patch: Partial<AdminOrder>) => void;
  convertRequestToOrder: (requestId: string) => AdminOrder | null;
  addReel: (r: ReelItem) => void;
  saveReel: (id: string, patch: Partial<ReelItem>) => void;
  deleteReel: (id: string) => void;
  moveReel: (id: string, dir: -1 | 1) => void;
  setReels: (list: ReelItem[]) => void;
  productsLoading: boolean;
  setFeaturedIds: (ids: string[]) => void;
};

const Ctx = createContext<Value | null>(null);

function usePersisted<T>(key: string, seed: () => T) {
  const [state, setState] = useState<T>(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, ready, state]);
  return [state, setState] as const;
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reels, setReelsState] = useState<ReelItem[]>([]);
  const [featuredIds, setFeaturedState] = useState<string[]>([]);

  // Purge stale browser localStorage mock caches on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("bt-admin-orders-v2");
        localStorage.removeItem("bt-admin-orders");
        localStorage.removeItem("bt-admin-products-v2");
        localStorage.removeItem("bt-admin-products");
        localStorage.removeItem("bt-admin-featured");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadRequests = useCallback(() => {
    let isMounted = true;
    setRequestsLoading(true);
    setRequestsError(null);
    import("./api/requests").then(({ fetchCustomRequests }) => {
      fetchCustomRequests()
        .then((live) => {
          if (isMounted && Array.isArray(live)) {
            setRequests(live);
            setRequestsError(null);
          }
        })
        .catch((err: any) => {
          if (isMounted) {
            setRequestsError(err?.message || "Failed to load custom requests from server.");
            setRequests([]); // NEVER fall back to mock requests
          }
        })
        .finally(() => {
          if (isMounted) setRequestsLoading(false);
        });
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch live API data on mount when available
  useEffect(() => {
    let isMounted = true;
    import("./api/catalogue").then(({ fetchProducts }) => {
      fetchProducts()
        .then((live) => {
          if (isMounted && Array.isArray(live)) setProducts(live);
        })
        .catch(() => {
          /* Keep current store state on network failure */
        })
        .finally(() => {
          if (isMounted) setProductsLoading(false);
        });
    });

    const cleanupRequests = loadRequests();

    import("./api/orders").then(({ fetchOrders }) => {
      fetchOrders()
        .then((live) => {
          if (isMounted && Array.isArray(live)) setOrders(live);
        })
        .catch(() => {
          /* Fallback to local store */
        });
    });

    import("./api/catalogue").then(({ fetchAdminReels, fetchAdminFeatured }) => {
      fetchAdminReels()
        .then((live) => {
          if (isMounted && Array.isArray(live)) setReelsState(live);
        })
        .catch(() => {});
      fetchAdminFeatured()
        .then((live) => {
          if (isMounted && Array.isArray(live)) setFeaturedState(live);
        })
        .catch(() => {});
    });

    return () => {
      isMounted = false;
      cleanupRequests();
    };
  }, [setProducts, setOrders, loadRequests]);

  const saveProduct = useCallback(
    (p: AdminProduct) => {
      setProducts((list) => {
        const exists = list.some((x) => x.id === p.id);
        return exists ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list];
      });
    },
    [setProducts],
  );

  const addProduct = useCallback(
    (p: AdminProduct) => {
      setProducts((l) => [p, ...l]);
      import("./api/catalogue").then(({ createProduct }) => {
        createProduct({
          slug: p.id,
          name: p.name,
          categoryId: p.category,
          subCategoryId: p.sub,
          description: p.description,
          basePrice: p.basePrice,
          mrp: p.mrp,
          deliveryCharge: p.deliveryCharge,
        }).catch(() => {});
      });
    },
    [setProducts],
  );
  const saveRequest = useCallback(
    (id: string, patch: Partial<CustomRequest>) =>
      setRequests((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [setRequests],
  );
  const setOrderStage = useCallback(
    (id: string, stage: OrderStage) => {
      setOrders((l) => l.map((o) => (o.id === id ? { ...o, stage } : o)));
      import("./api/orders").then(({ updateOrderStage }) => {
        updateOrderStage(id, stage).catch(() => {});
      });
    },
    [setOrders],
  );
  const saveOrder = useCallback(
    (id: string, patch: Partial<AdminOrder>) =>
      setOrders((l) => l.map((o) => (o.id === id ? { ...o, ...patch } : o))),
    [setOrders],
  );

  const convertRequestToOrder = useCallback(
    (requestId: string): AdminOrder | null => {
      const r = requests.find((x) => x.id === requestId);
      if (!r || !r.quote) return null;

      const orderNo = `OR-${Date.now().toString(36).toUpperCase().slice(-4)}-${String(orders.length + 1).padStart(3, "0")}`;
      const deliveryType: DeliveryType = r.fulfilment === "pickup" ? "store_pickup" : "doorstep";

      const newOrder: AdminOrder = {
        id: `ord-cr-${Date.now().toString(36)}`,
        orderNo,
        createdAt: new Date().toISOString(),
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        address: {
          line1: deliveryType === "store_pickup" ? "Store Pickup — Gandhipuram" : "Address pending",
          city: "Coimbatore",
          state: "Tamil Nadu",
          pincode: "641045",
        },
        items: [
          {
            name: r.quote.name,
            size: r.quote.size,
            colour: r.colour,
            unitPrice: r.quote.price,
            qty: r.qty,
            image: r.referenceImages[0] ?? "",
          },
        ],
        subtotal: r.quote.price * r.qty,
        gstAmount: r.quote.gstAmount,
        deliveryFee: r.quote.deliveryFee,
        total: r.quote.totalPayable,
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        stage: "placed",
        deliveryType,
        isCustom: true,
        requestNo: r.requestNo,
      };

      setOrders((l) => [newOrder, ...l]);
      setRequests((l) => l.map((x) => (x.id === requestId ? { ...x, status: "in_progress" as RequestStatus } : x)));

      import("./api/requests").then(({ convertRequestToOrder: convertApi }) => {
        convertApi(requestId, deliveryType).catch(() => {});
      });

      return newOrder;
    },
    [requests, orders.length, setOrders, setRequests],
  );

  const addReel = useCallback(
    (r: ReelItem) => {
      setReelsState((l) => [...l, r]);
      import("./api/catalogue").then(({ createAdminReel, fetchAdminReels }) => {
        createAdminReel({
          title: r.title,
          videoUrl: r.videoUrl,
          productId: r.productId,
          position: reels.length,
        })
          .then(() => fetchAdminReels())
          .then((live) => {
            if (Array.isArray(live)) setReelsState(live);
          })
          .catch((err) => console.error("Failed to persist reel to DB:", err));
      });
    },
    [setReelsState, reels.length],
  );
  const saveReel = useCallback(
    (id: string, patch: Partial<ReelItem>) => {
      setReelsState((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      const payload: { title?: string; videoUrl?: string; productId?: string } = {};
      if (patch.title !== undefined) payload.title = patch.title;
      if (patch.videoUrl !== undefined) payload.videoUrl = patch.videoUrl;
      if (patch.productId !== undefined) payload.productId = patch.productId;
      import("./api/catalogue").then(({ updateAdminReel, fetchAdminReels }) => {
        updateAdminReel(id, payload)
          .then(() => fetchAdminReels())
          .then((live) => {
            if (Array.isArray(live)) setReelsState(live);
          })
          .catch((err) => console.error("Failed to update reel in DB:", err));
      });
    },
    [setReelsState],
  );
  const deleteReel = useCallback(
    (id: string) => {
      setReelsState((l) => l.filter((r) => r.id !== id));
      import("./api/catalogue").then(({ deleteAdminReel }) => {
        deleteAdminReel(id).catch((err) => console.error("Failed to delete reel from DB:", err));
      });
    },
    [setReelsState],
  );
  const moveReel = useCallback(
    (id: string, dir: -1 | 1) =>
      setReelsState((l) => {
        const i = l.findIndex((r) => r.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= l.length) return l;
        const next = [...l];
        const [item] = next.splice(i, 1);
        next.splice(j, 0, item!);
        import("./api/catalogue").then(({ updateAdminReel }) => {
          next.forEach((r, idx) => {
            updateAdminReel(r.id, { position: idx }).catch(() => {});
          });
        });
        return next;
      }),
    [setReelsState],
  );
  const setReels = useCallback(
    (list: ReelItem[]) => {
      setReelsState(list);
      import("./api/catalogue").then(({ updateAdminReel }) => {
        list.forEach((r, idx) => {
          updateAdminReel(r.id, { position: idx }).catch(() => {});
        });
      });
    },
    [setReelsState],
  );
  const setFeaturedIds = useCallback(
    (ids: string[]) => {
      setFeaturedState(ids);
      import("./api/catalogue").then(({ updateAdminFeatured }) => {
        updateAdminFeatured(ids).catch((err) => console.error("Failed to update featured items in DB:", err));
      });
    },
    [setFeaturedState],
  );

  const value = useMemo<Value>(
    () => ({
      products,
      productsLoading,
      requests,
      requestsLoading,
      requestsError,
      reloadRequests: loadRequests,
      orders,
      reels,
      featuredIds,
      findProduct: (id) => products.find((p) => p.id === id),
      findRequest: (id) => requests.find((r) => r.id === id),
      findOrder: (id) => orders.find((o) => o.id === id),
      saveProduct,
      addProduct,
      saveRequest,
      setOrderStage,
      saveOrder,
      convertRequestToOrder,
      addReel,
      saveReel,
      deleteReel,
      moveReel,
      setReels,
      setFeaturedIds,
    }),
    [
      products,
      productsLoading,
      requests,
      requestsLoading,
      requestsError,
      loadRequests,
      orders,
      reels,
      featuredIds,
      saveProduct,
      addProduct,
      saveRequest,
      setOrderStage,
      saveOrder,
      convertRequestToOrder,
      addReel,
      saveReel,
      deleteReel,
      moveReel,
      setReels,
      setFeaturedIds,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin(): Value {
  const v = useContext(Ctx);
  if (!v) {
    return {
      products: [],
      productsLoading: false,
      requests: [],
      requestsLoading: false,
      requestsError: null,
      reloadRequests: () => {},
      orders: [],
      reels: [],
      featuredIds: [],
      findProduct: () => undefined,
      findRequest: () => undefined,
      findOrder: () => undefined,
      saveProduct: () => {},
      addProduct: () => {},
      saveRequest: () => {},
      setOrderStage: () => {},
      saveOrder: () => {},
      convertRequestToOrder: () => null,
      addReel: () => {},
      saveReel: () => {},
      deleteReel: () => {},
      moveReel: () => {},
      setReels: () => {},
      setFeaturedIds: () => {},
    };
  }
  return v;
}

/* ---------------------------------------------------------------- helpers */

export const isProductSoldOut = (p: AdminProduct | undefined | null): boolean => {
  if (!p) return false;
  if (p.soldOut || (p as any).sold_out) return true;
  if (p.variants && p.variants.length > 0) {
    return !p.variants.some((v) => v.available && (v.stockQty === undefined || v.stockQty > 0));
  }
  return false;
};

export const totalStock = (p: AdminProduct) => {
  if (!p || isProductSoldOut(p)) return 0;
  return (p?.variants ?? []).reduce((acc, v) => acc + (v.available ? (v.stockQty ?? 1) : 0), 0);
};
/** All distinct sizes that are available */
export const productSizes = (p: AdminProduct) =>
  (p?.variants ?? []).filter((v) => v.available).map((v) => v.size);
export const gstOf = (amount: number) => Math.round(amount * (storeSettings.gstPercent / 100));

export const customRequestDisplayName = (r: Partial<CustomRequest> | null | undefined): string => {
  if (!r) return "Custom Design";
  if (r.quote?.name && typeof r.quote.name === "string" && r.quote.name.trim()) {
    return r.quote.name.trim();
  }
  const isUuid = (val?: string) => !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  const catLabel = (r.categoryName && !isUuid(r.categoryName) ? r.categoryName : "") ||
                   (r.category && !isUuid(r.category) ? r.category : "") || "Custom Design";
  const subLabel = (r.subCategoryName && !isUuid(r.subCategoryName) ? r.subCategoryName : "") ||
                   (r.sub && !isUuid(r.sub) ? r.sub : "");

  if (!subLabel || subLabel.toLowerCase() === catLabel.toLowerCase()) {
    return catLabel;
  }
  return `${catLabel} — ${subLabel}`;
};
