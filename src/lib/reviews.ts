import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api/client";

export type Review = {
  id: string;
  userId: string;
  orderId: string | null;
  productId: string;
  productName: string | null;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  photos: string[];
  createdAt: string;
};

type Row = Record<string, unknown>;

const map = (row: Row): Review => ({
  id: String(row["id"]),
  userId: String(row["user_id"]),
  orderId: (row["order_id"] as string | null) ?? null,
  productId: String(row["product_id"]),
  productName: (row["product_name"] as string | null) ?? null,
  authorName: (row["author_name"] as string | null) ?? "Butterflies customer",
  rating: Number(row["rating"] ?? 5),
  title: (row["title"] as string | null) ?? null,
  body: (row["body"] as string | null) ?? null,
  photos: (row["photos"] ?? []) as string[],
  createdAt: String(row["created_at"]),
});

export async function listReviewsForOrder(_orderId: string): Promise<Review[]> {
  // Database schema stores reviews by product_id and customer_id (order_id is not a DB column)
  return [];
}

export async function listReviewsForProduct(productId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as Row[]).map(map);
  } catch {
    return [];
  }
}

export async function addReview(input: {
  userId: string;
  orderId?: string | null;
  productId: string;
  productName?: string;
  authorName: string;
  rating: number;
  title?: string;
  body?: string;
  photos?: string[];
}): Promise<Review | null> {
  try {
    const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>("/reviews", {
      method: "POST",
      body: JSON.stringify({
        product_id: input.productId,
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        title: input.title?.trim() || "",
        comment: input.body?.trim() || "",
      }),
    });
    if (!res.success || !res.data) return null;
    return map(res.data);
  } catch {
    return null;
  }
}
