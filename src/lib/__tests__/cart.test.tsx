import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart, matchesKey, type CartItem } from "@/lib/cart";
import type { ReactNode } from "react";

beforeEach(() => {
  window.localStorage.clear();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe("matchesKey helper", () => {
  it("matches normal products by key or id|size|colour", () => {
    const item: CartItem = {
      key: "PROD-101|Free|Red",
      id: "PROD-101",
      name: "Kanchipuram Silk Saree",
      image: "/photo.jpg",
      price: 5000,
      size: "Free",
      colour: "Red",
      qty: 1,
    };

    expect(matchesKey(item, "PROD-101|Free|Red")).toBe(true);
    expect(matchesKey(item, "PROD-101")).toBe(true);
    expect(matchesKey(item, "PROD-101|Stitched-38|Red")).toBe(false);
    expect(matchesKey(item, "PROD-102|Free|Red")).toBe(false);
  });

  it("matches custom request items by customRequestId", () => {
    const customItem: CartItem = {
      key: "REQ-550|38|Gold",
      id: "REQ-550",
      customRequestId: "REQ-550",
      isCustom: true,
      name: "Custom Blouse",
      image: "/photo.jpg",
      price: 2500,
      size: "38",
      colour: "Gold",
      qty: 1,
    };

    expect(matchesKey(customItem, "REQ-550")).toBe(true);
    expect(matchesKey(customItem, "REQ-550|38|Gold")).toBe(true);
    expect(matchesKey(customItem, "CR-REQ-550")).toBe(true);
    expect(matchesKey(customItem, "REQ-999")).toBe(false);
  });
});

describe("CartProvider deduplication logic", () => {
  it("deduplicates normal products by incrementing quantity on duplicate add", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add({
        id: "PROD-1",
        name: "Silk Saree",
        image: "/saree.jpg",
        price: 3000,
        size: "Free",
        colour: "Blue",
        qty: 1,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.qty).toBe(1);

    // Re-adding the exact same normal product
    act(() => {
      result.current.add({
        id: "PROD-1",
        name: "Silk Saree",
        image: "/saree.jpg",
        price: 3000,
        size: "Free",
        colour: "Blue",
        qty: 1,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.qty).toBe(2);

    // Adding a different variant (different size) adds a separate item
    act(() => {
      result.current.add({
        id: "PROD-1",
        name: "Silk Saree",
        image: "/saree.jpg",
        price: 3000,
        size: "Stitched-40",
        colour: "Blue",
        qty: 1,
      });
    });

    expect(result.current.items).toHaveLength(2);
  });

  it("deduplicates custom request items by overwriting item instead of duplicating or stacking qty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.add({
        id: "CR-100",
        customRequestId: "CR-100",
        isCustom: true,
        name: "Custom Anarkali (Customised)",
        image: "/design.jpg",
        price: 4500,
        size: "38",
        colour: "Pink",
        qty: 1,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.qty).toBe(1);

    // Clicking "Accept Quotation & Pay" again
    act(() => {
      result.current.add({
        id: "CR-100",
        customRequestId: "CR-100",
        isCustom: true,
        name: "Custom Anarkali (Customised)",
        image: "/design.jpg",
        price: 4500,
        size: "38",
        colour: "Pink",
        qty: 1,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.qty).toBe(1);
  });
});
