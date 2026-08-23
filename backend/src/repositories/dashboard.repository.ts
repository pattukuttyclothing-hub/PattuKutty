import { db } from "../config/db.js";

export class DashboardRepository {
  /** Single round-trip dashboard query — calls admin_dashboard() PG function if available */
  static async getDashboardSummary() {
    try {
      // Try the PG aggregate function first (production)
      const { data: rpcData, error: rpcError } = await db.rpc("admin_dashboard");
      if (!rpcError && rpcData) return rpcData;
    } catch { /* fallback below */ }

    // Fallback: parallel queries
    const [
      pendingRequests,
      unfulfilledOrders,
      revenueResult,
      lowStockRail,
      waitingRequests,
      recentOrders,
    ] = await Promise.allSettled([
      db.from("custom_requests").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      db.from("orders").select("id", { count: "exact", head: true }).in("stage", ["placed", "confirmed"]),
      db.from("orders")
        .select("total_amount")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .eq("payment_status", "paid")
        .neq("stage", "cancelled"),
      db.from("v_admin_products").select("*").eq("is_low_stock", true).order("min_stock", { ascending: true }).limit(12),
      db.from("v_admin_requests").select("*").order("created_at", { ascending: false }).limit(10),
      db.from("v_admin_orders").select("*, items:order_items(*)").order("created_at", { ascending: false }).limit(10),
    ]);

    const revenueData = revenueResult.status === "fulfilled" ? revenueResult.value.data ?? [] : [];
    const revenue = revenueData.reduce((sum: number, row: { total_amount?: number }) => sum + (row.total_amount ?? 0), 0);

    return {
      pending_requests_count: pendingRequests.status === "fulfilled" ? (pendingRequests.value.count ?? 0) : 0,
      unfulfilled_orders_count: unfulfilledOrders.status === "fulfilled" ? (unfulfilledOrders.value.count ?? 0) : 0,
      revenue_this_month: revenue,
      low_stock_products: lowStockRail.status === "fulfilled" ? (lowStockRail.value.data ?? []) : [],
      waiting_requests: waitingRequests.status === "fulfilled" ? (waitingRequests.value.data ?? []) : [],
      recent_orders: recentOrders.status === "fulfilled" ? (recentOrders.value.data ?? []) : [],
    };
  }

  static async getAdminProfile(userId: string) {
    try {
      const { data, error } = await db
        .from("admin_profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId)
        .single();
      if (error || !data) return { full_name: "Admin", avatar_url: null };
      return data;
    } catch { return { full_name: "Admin", avatar_url: null }; }
  }
}
