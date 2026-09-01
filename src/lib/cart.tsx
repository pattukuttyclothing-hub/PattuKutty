import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { deliveryRules, storeInfo, waLink } from "@/data/boutique";

export type CartItem = {
  key: string;
  id: string;
  name: string;
  image: string;
  price: number;
  size: string;
  colour: string;
  qty: number;
  customRequestId?: string;
  isCustom?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  delivery: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "butterflies-cart";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const matchesKey = (item: CartItem, key: string) =>
  item.key === key ||
  (Boolean(item.isCustom) && Boolean(item.customRequestId) && (key.includes(String(item.customRequestId)) || item.customRequestId === key)) ||
  `${item.id}|${item.size}|${item.colour}` === key ||
  item.id === key;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        const sanitized = parsed.map((item, idx) => ({
          ...item,
          key: item.key || `${item.id || "item"}|${item.size || ""}|${item.colour || ""}|${idx}`,
        }));
        setItems(sanitized);
      }
    } catch {
      toast.warning(
        "Could not restore your saved bag — your browser storage may be full or restricted. " +
        "Items you add this session will not persist if you close the tab."
      );
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.getItem(STORAGE_KEY);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      toast.error(
        "Your bag could not be saved. Please check your browser storage settings " +
        "(try clearing site data) and try again — items may be lost if you leave this page."
      );
    }
  }, [items]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.id}|${item.size}|${item.colour}`;
    setItems((prev) => {
      const found = prev.find((p) => matchesKey(p, key));
      if (found) {
        if (item.isCustom) {
          return prev.map((p) => (matchesKey(p, key) ? { ...p, ...item, qty: item.qty } : p));
        }
        return prev.map((p) => (matchesKey(p, key) ? { ...p, qty: p.qty + item.qty } : p));
      }
      return [...prev, { ...item, key }];
    });
    toast.success(`Added ${item.name} to your bag`);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.flatMap((p) => (matchesKey(p, key) ? (qty < 1 ? [] : [{ ...p, qty }]) : [p])),
    );
    if (qty < 1) {
      toast.info("Item removed from bag");
    }
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => !matchesKey(p, key)));
    toast.info("Item removed from bag");
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    toast.info("Bag cleared");
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    return {
      items,
      add,
      setQty,
      remove,
      clear,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      // Delivery is always 0 in the cart — final delivery fee is calculated
      // server-side at checkout based on pincode, delivery type, and product rules.
      // Do NOT use this value for payment; use the backend-confirmed total.
      delivery: 0,
      total: subtotal, // Subtotal only — shown as estimate; final total confirmed at checkout
    };
  }, [items, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

/** Builds the WhatsApp order enquiry message (image, name, size, colour, qty, price). */
export function orderWaLink(
  items: CartItem[],
  totals?: { subtotal: number; delivery: number; total: number },
) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const lines = items.map((i, n) => {
    const photoUrl = i.image?.startsWith("http")
      ? i.image
      : i.image?.startsWith("/") && origin
      ? `${origin}${i.image}`
      : i.image || "N/A";
    return `${n + 1}. ${i.name}\n   Size: ${i.size} | Colour: ${i.colour}\n   Qty: ${i.qty} × ${inr(i.price)} = ${inr(i.price * i.qty)}\n   Photo: ${photoUrl}`;
  });
  let msg = `Hi ${storeInfo.name}, I'd like to order:\n\n${lines.join("\n\n")}`;
  if (totals) {
    msg += `\n\nSubtotal: ${inr(totals.subtotal)}\nDelivery: ${
      totals.delivery === 0 ? "Free" : inr(totals.delivery)
    }\nTotal: ${inr(totals.total)}`;
  }
  return waLink(msg);
}
