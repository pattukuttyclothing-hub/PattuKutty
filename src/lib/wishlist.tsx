import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { usePersistentState } from "./persist";

type WishlistValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  count: number;
};

const Ctx = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { value: ids, setValue } = usePersistentState<string[]>("butterflies-wishlist", []);

  const toggle = useCallback(
    (id: string) =>
      setValue((prev) => {
        const exists = prev.includes(id);
        if (exists) {
          toast.info("Removed from loved designs");
          return prev.filter((p) => p !== id);
        } else {
          toast.success("Saved to loved designs");
          return [...prev, id];
        }
      }),
    [setValue],
  );

  const remove = useCallback(
    (id: string) =>
      setValue((prev) => {
        toast.info("Removed from loved designs");
        return prev.filter((p) => p !== id);
      }),
    [setValue],
  );

  const value = useMemo<WishlistValue>(
    () => ({ ids, has: (id) => ids.includes(id), toggle, remove, count: ids.length }),
    [ids, toggle, remove],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
