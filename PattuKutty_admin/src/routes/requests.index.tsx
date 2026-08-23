import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { RequestCard } from "@/components/admin/cards";
import { type Tone } from "@/components/shared/Badge";
import { useAdmin, requestStatusLabel, type RequestStatus } from "@/lib/admin-store";


const title = "Customer Requests — Butterflies Tailoring Admin";
const description =
  "Custom design requests sent from the storefront, ready to be reviewed and quoted.";

export const Route = createFileRoute("/requests/")({
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
  component: RequestsPage,
});

export const statusTone: Record<RequestStatus, Tone> = {
  submitted: "gold",
  under_review: "review",
  quoted: "pink",
  accepted: "ok",
  in_progress: "purple",
  ready: "info",
  delivered: "ok",
  cancelled: "bad",
};

function RequestsPage() {
  const { requests, requestsLoading, requestsError, reloadRequests } = useAdmin();
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const list = (requests || []).filter((r) => filter === "all" || r.status === filter);
  const filters: (RequestStatus | "all")[] = ["all", "submitted", "quoted", "accepted", "cancelled"];

  return (
    <AdminShell>
      <PageHead
        eyebrow="Design studio"
        title="Customer Requests"
        subtitle="Custom design requests submitted by customers, fetched live from backend API database."
      />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {requestsError ? (
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
            <h3 className="font-display text-base font-semibold text-destructive">Failed to Load Custom Requests</h3>
            <p className="text-xs text-muted-foreground">{requestsError}</p>
            <button
              type="button"
              onClick={reloadRequests}
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Retry Connection
            </button>
          </div>
        ) : requestsLoading ? (
          <div className="py-16 text-center text-sm font-medium text-muted-foreground">
            Loading design requests from server...
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                    filter === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {f === "all" ? "All" : requestStatusLabel[f]}
                </button>
              ))}
            </div>

            {list.length === 0 ? (
              <div className="mt-10 py-12 text-center rounded-3xl border border-dashed border-border bg-card p-6">
                <p className="text-sm font-medium text-foreground">No customer requests found</p>
                <p className="text-xs text-muted-foreground mt-1">There are no custom design requests matching this filter in the database.</p>
              </div>
            ) : (
              <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((r, i) => (
                  <RequestCard key={r.id} request={r} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
