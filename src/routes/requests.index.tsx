import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Sparkles } from "lucide-react";
import { PageHeader, PageShell, EmptyState } from "@/components/shared/Page";

import { AutoImageFade } from "@/components/shared/AutoImageFade";
import { isRequestPaid, requestLabels, requestTypeLabel, requestWaLink, useRequests } from "@/lib/requests";
import { fmtDateTime } from "@/lib/persist";
import { timelineById } from "@/data/boutique";

const title = "My Design Requests — Pattu Kutty";
const description =
  "Track every custom design you've sent to our Coimbatore studio — review status, update specifications or reach us on WhatsApp.";

export const Route = createFileRoute("/requests/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { requests: liveRequests, loading, error, refreshRequests } = useRequests();
  const requests = liveRequests;

  useEffect(() => {
    void refreshRequests();
  }, [refreshRequests]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your studio file"
        title="My Design Requests"
        compact
        subtitle="Every custom design you've shared with us, with its current studio status."
        crumbs={[{ label: "My Design Requests" }]}
        actions={
          <Link
            to="/design-studio"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft"
          >
            <Sparkles className="h-4 w-4" /> New Design
          </Link>
        }
      />

      <section className="bg-background py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm font-medium text-muted-foreground">Loading your design requests...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm font-semibold text-destructive">{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              title="No design requests yet"
              message="Share a reference photo and your preferences — our designer will get back with a quote."
              actionLabel="Open the Design Studio"
              actionTo="/design-studio"
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {requests.map((r, i) => {
                const meta = requestLabels[r.status];
                const imgs = r.images.filter(Boolean);
                const paid = isRequestPaid(r);
                // Paid custom orders open the order record instead of the request brief.
                const linkProps = (
                  paid
                    ? r.orderId
                      ? { to: "/orders/$id", params: { id: r.orderId } }
                      : { to: "/orders" }
                    : { to: "/requests/$id", params: { id: r.id } }
                ) as { to: string; params?: Record<string, string> };
                return (
                  <Link
                    key={r.id}
                    {...(linkProps as any)}
                    className="card-lift group relative block aspect-[3/4.2] overflow-hidden rounded-2xl bg-card shadow-soft"
                  >
                    {imgs.length ? (
                      <AutoImageFade
                        images={imgs}
                        alt="Your reference design"
                        className="absolute inset-0 h-full w-full"
                        interval={6500}
                        offset={i * 800}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-secondary" />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon/92 via-maroon/35 to-maroon/5" />

                    {/* status sticker — stamped on the card, not a flat pill */}
                    <span
                      className={`absolute top-3 -right-1 z-10 -rotate-6 rounded-l-xl rounded-r-sm px-3.5 py-1.5 text-[0.62rem] font-bold tracking-[0.16em] uppercase shadow-lift ring-2 ring-primary-foreground/70 ${
                        meta.tone === "review"
                          ? "bg-accent text-accent-foreground"
                          : meta.tone === "bad"
                            ? "bg-destructive text-primary-foreground"
                            : meta.tone === "gold"
                              ? "bg-emerald-600 text-white"
                              : paid
                                ? "bg-emerald-600 text-white"
                                : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {meta.label}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                      <p className="text-[0.6rem] tracking-[0.22em] text-primary-foreground/70 uppercase">
                        {fmtDateTime(r.createdAt)}
                      </p>
                      <h2 className="font-display mt-1 text-lg leading-tight font-semibold text-primary-foreground">
                        {r.quote?.name ?? requestTypeLabel(r)}
                      </h2>
                      <p className="mt-1 text-[0.7rem] text-primary-foreground/80">
                        {r.colour} · {r.size === "Custom" ? "Custom fit" : `Size ${r.size}`} ·{" "}
                        {r.qty} {r.qty > 1 ? "pieces" : "piece"}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] text-primary-foreground/70">
                        Stitching time: ready in {timelineById(r.timeline).label.toLowerCase()}
                      </p>

                      {r.updateRequestedAt ? (
                        <p className="mt-1.5 text-[0.68rem] font-medium text-accent">
                          Update requested — studio reviewing
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/95 px-3.5 py-1.5 text-[0.62rem] font-semibold tracking-[0.14em] text-primary uppercase">
                          {paid ? "View order" : "View request"}
                        </span>
                        <span
                          role="link"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(requestWaLink(r), "_blank", "noreferrer");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") window.open(requestWaLink(r), "_blank", "noreferrer");
                          }}
                          className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-primary-foreground/20 text-primary-foreground ring-1 ring-primary-foreground/40 transition-colors hover:bg-primary-foreground hover:text-primary"
                          aria-label="Contact on WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

          )}
        </div>
      </section>
    </PageShell>
  );
}
