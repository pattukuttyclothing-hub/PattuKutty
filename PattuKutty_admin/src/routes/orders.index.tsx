import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { OrderCard } from "@/components/admin/cards";
import { useAdmin, doorstepStages, pickupStages, type OrderStage, type AdminOrder } from "@/lib/admin-store";
import { fetchOrders } from "@/lib/api/orders";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";


const title = "Orders — Pattu Kutty Admin";
const description =
  "Every storefront order with payment status, items and the stitching stage the customer sees.";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

// Combine all unique stages from both delivery types
const allStageIds = Array.from(
  new Set([...doorstepStages, ...pickupStages].map((s) => s.id)),
);
const allStageLabels: Record<string, string> = Object.fromEntries(
  [...doorstepStages, ...pickupStages].map((s) => [s.id, s.label]),
);

type FilterType = "all" | "customised" | "doorstep" | "store_pickup";

function OrdersPage() {
  const { orders: initialOrders } = useAdmin();
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [stage, setStage] = useState<OrderStage | "all">("all");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const loadServerOrders = async (
    selectedStage: OrderStage | "all",
    selectedFilter: FilterType,
    pageNum: number,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: {
        stage?: string | undefined;
        deliveryType?: string | undefined;
        limit?: number | undefined;
        offset?: number | undefined;
      } = {
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
      };

      if (selectedStage !== "all") {
        filterParams.stage = selectedStage;
      }
      if (selectedFilter === "doorstep" || selectedFilter === "store_pickup") {
        filterParams.deliveryType = selectedFilter;
      }

      const res = await fetchOrders(filterParams);

      let filteredList = res.orders;
      if (selectedFilter === "customised") {
        filteredList = filteredList.filter((o) => o.isCustom);
      }

      setOrders(filteredList);
      setTotal(res.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch orders from server.";
      setError(msg);
      toast.error(`Order fetch failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServerOrders(stage, filter, page);
  }, [stage, filter, page]);

  const handleStageChange = (s: OrderStage | "all") => {
    setStage(s);
    setPage(1);
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell>
      <PageHead
        eyebrow="Fulfilment"
        title="Orders"
        subtitle="Move each order forward — the customer's tracking label updates with it."
      />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {/* Stage filters */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleStageChange("all")}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              stage === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            All
          </button>
          {allStageIds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStageChange(s)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                stage === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {allStageLabels[s]}
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            { key: "all" as FilterType, label: "All types" },
            { key: "customised" as FilterType, label: "Customised" },
            { key: "doorstep" as FilterType, label: "🚚 Doorstep" },
            { key: "store_pickup" as FilterType, label: "🏪 Pickup" },
          ] as const).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => handleFilterChange(f.key)}
              className={`rounded-full border px-3.5 py-1.5 text-[0.7rem] font-medium ${
                filter === f.key
                  ? "border-primary bg-secondary text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadServerOrders(stage, filter, page)}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.map((o, i) => (
            <OrderCard key={o.id} order={o} index={i} />
          ))}
          {!loading && orders.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              No orders match these filters.
            </p>
          ) : null}
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs">
          <span className="text-muted-foreground">
            Showing Page {page} of {totalPages} ({total} total orders)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border px-3 py-1.5 font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-border px-3 py-1.5 font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
