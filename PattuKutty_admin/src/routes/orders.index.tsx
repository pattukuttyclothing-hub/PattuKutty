import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { OrderCard } from "@/components/admin/cards";
import { useAdmin, doorstepStages, pickupStages, type OrderStage, type DeliveryType } from "@/lib/admin-store";


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
  const { orders } = useAdmin();
  const [stage, setStage] = useState<OrderStage | "all">("all");
  const [filter, setFilter] = useState<FilterType>("all");

  const list = orders.filter((o) => {
    if (stage !== "all" && o.stage !== stage) return false;
    if (filter === "customised" && !o.isCustom) return false;
    if (filter === "doorstep" && o.deliveryType !== "doorstep") return false;
    if (filter === "store_pickup" && o.deliveryType !== "store_pickup") return false;
    return true;
  });

  const customCount = orders.filter((o) => o.isCustom).length;
  const pickupCount = orders.filter((o) => o.deliveryType === "store_pickup").length;
  const doorstepCount = orders.filter((o) => o.deliveryType === "doorstep").length;

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
            onClick={() => setStage("all")}
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
              onClick={() => setStage(s)}
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
            { key: "customised" as FilterType, label: `Customised (${customCount})` },
            { key: "doorstep" as FilterType, label: `🚚 Doorstep (${doorstepCount})` },
            { key: "store_pickup" as FilterType, label: `🏪 Pickup (${pickupCount})` },
          ] as const).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
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

        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((o, i) => (
            <OrderCard key={o.id} order={o} index={i} />
          ))}
          {list.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              No orders match these filters.
            </p>
          ) : null}
        </div>

      </div>
    </AdminShell>
  );
}
