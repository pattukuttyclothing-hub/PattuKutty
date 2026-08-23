import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, MousePointerClick, Search, Send, Sparkles, Users } from "lucide-react";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { Pill, StatCard } from "@/components/whatsapp/WhatsAppKit";
import { StatusBadge } from "@/components/shared/Badge";
import { useAdmin } from "@/lib/admin-store";
import { inr, fmtDateTime } from "@/lib/format";
import {
  campaignItem,
  clickRate,
  discountPct,
  publishedItemsFrom,
  recentlyNotified,
  useCampaigns,
} from "@/lib/whatsapp-notify";

const title = "WhatsApp Studio — Butterflies Tailoring Admin";
const description =
  "Promote designs and offers on WhatsApp, preview the exact message customers receive, and track reach, clicks and orders district by district.";

export const Route = createFileRoute("/whatsapp/")({
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
  component: WhatsAppStudio,
});

function WhatsAppStudio() {
  const { products } = useAdmin();
  const campaigns = useCampaigns();
  const items = useMemo(() => publishedItemsFrom(products), [products]);
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [q, setQ] = useState("");

  const recent = recentlyNotified(campaigns);
  const viewers = campaigns.reduce((s, c) => s + c.visited, 0);
  const orders = campaigns.reduce((s, c) => s + c.bought, 0);

  const history = campaigns.filter((c) => {
    const name = campaignItem(items, c)?.name ?? "";
    const t = `${name} ${c.id}`.toLowerCase();
    return t.includes(q.trim().toLowerCase());
  });

  return (
    <AdminShell>
      <PageHead
        eyebrow="Marketing"
        title="WhatsApp Studio"
        subtitle="Pick a design or offer, see the exact WhatsApp message before it goes out, and watch who opened, clicked and ordered."
        actions={
          <Link
            to="/whatsapp/broadcast"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[0.66rem] font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-soft"
          >
            <Sparkles className="h-3.5 w-3.5" /> Custom broadcast
          </Link>
        }
      />

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6">
        {/* tabs */}
        <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1 shadow-soft">
          {(["overview", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-[0.66rem] font-semibold tracking-[0.12em] uppercase transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "overview" ? "Overview" : "Campaign history"}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Campaigns sent"
                value={campaigns.length}
                hint={`${recent.length} in the last 48 hours`}
                icon={<Send className="h-4 w-4" />}
                tone="wa"
              />
              <StatCard
                label="Total viewers"
                value={viewers.toLocaleString("en-IN")}
                hint="Customers who opened the design page"
                icon={<Eye className="h-4 w-4" />}
              />
              <StatCard
                label="Click rate"
                value={`${clickRate(campaigns)}%`}
                hint="Clicked / messages delivered"
                icon={<MousePointerClick className="h-4 w-4" />}
                tone="gold"
              />
              <StatCard
                label="Orders attributed"
                value={orders}
                hint="Placed after a WhatsApp campaign"
                icon={<Users className="h-4 w-4" />}
              />
            </div>

            {/* recently notified rail */}
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Notified in the last 48 hours
              </h2>
              {recent.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nothing sent recently.</p>
              ) : (
                <div className="mt-3 flex gap-4 overflow-x-auto pb-3">
                  {recent.map((c) => {
                    const item = campaignItem(items, c);
                    return (
                      <Link
                        key={c.id}
                        to="/whatsapp/analytics/$notificationId"
                        params={{ notificationId: c.id }}
                        className="card-lift w-[230px] shrink-0 overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
                      >
                        <img
                          src={item?.image}
                          alt={item?.name ?? c.id}
                          loading="lazy"
                          className="aspect-[4/5] w-full object-cover"
                        />
                        <div className="p-3.5">
                          <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-primary uppercase">
                            {c.id} · {c.audience}
                          </p>
                          <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
                            {item?.name}
                          </p>
                          <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
                            {c.visited} viewers · {c.bought} orders
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* publishable catalogue */}
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Ready to promote
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Live designs from your catalogue. Pick one to review and notify.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.slice(0, 16).map((item) => (
                  <Link
                    key={item.id}
                    to="/whatsapp/item/$itemId"
                    params={{ itemId: item.id }}
                    className="card-lift overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
                  >
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="aspect-[4/5] w-full object-cover"
                      />
                      <span className="absolute top-3 left-3">
                        <StatusBadge tone="ok">{item.kind}</StatusBadge>
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-1.5 text-sm text-foreground">
                        {inr(item.price)}{" "}
                        <span className="text-xs text-muted-foreground line-through">
                          {inr(item.mrp)}
                        </span>{" "}
                        <span className="text-xs font-semibold text-primary">
                          {discountPct(item.price, item.mrp)}% off
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section>
            <div className="relative max-w-md">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by design name or campaign ID"
                className="w-full rounded-full border border-border bg-card py-3 pr-4 pl-11 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="mt-5 space-y-3">
              {history.map((c) => {
                const item = campaignItem(items, c);
                return (
                  <Link
                    key={c.id}
                    to="/whatsapp/analytics/$notificationId"
                    params={{ notificationId: c.id }}
                    className="card-lift flex items-center gap-4 rounded-3xl border border-border bg-card p-3.5 shadow-soft"
                  >
                    <img
                      src={item?.image}
                      alt={item?.name ?? c.id}
                      loading="lazy"
                      className="h-20 w-16 shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-primary uppercase">
                        {c.id} · {fmtDateTime(c.sentOn)}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground">
                        {item?.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Pill>{c.audience}</Pill>
                        <Pill>{c.sent} sent</Pill>
                        <Pill>{c.clicked} clicks</Pill>
                        <Pill active>{c.bought} orders</Pill>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaigns match that search.</p>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
