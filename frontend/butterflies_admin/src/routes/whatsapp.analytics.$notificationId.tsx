import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, MailOpen, MousePointerClick, Send, ShoppingBag, Users } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { Pill, StatCard, WhatsAppPreview } from "@/components/whatsapp/WhatsAppKit";
import { useAdmin } from "@/lib/admin-store";
import { fmtDateTime, inr } from "@/lib/format";
import {
  activeDistricts,
  campaignById,
  campaignItem,
  discountPct,
  publishedItemsFrom,
  useCampaigns,
} from "@/lib/whatsapp-notify";

const title = "Campaign report — Butterflies Tailoring Admin";
const description =
  "Per-campaign WhatsApp report: delivery and click funnels, orders attributed and a district-wise visitor breakdown.";

export const Route = createFileRoute("/whatsapp/analytics/$notificationId")({
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
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { notificationId } = Route.useParams();
  const { products } = useAdmin();
  const campaigns = useCampaigns();
  const items = useMemo(() => publishedItemsFrom(products), [products]);
  const campaign = campaignById(campaigns, notificationId);
  const [showAll, setShowAll] = useState(false);

  if (!campaign) {
    return (
      <AdminShell>
        <PageHead eyebrow="WhatsApp Studio" title="Campaign not found" />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link to="/whatsapp" className="text-sm font-semibold text-primary">
            Back to WhatsApp Studio
          </Link>
        </div>
      </AdminShell>
    );
  }

  const item = campaignItem(items, campaign);
  const ranked = activeDistricts(campaign);
  const chartData = ranked.slice(0, 8).map((d) => ({ ...d, name: d.district }));
  const priceLine =
    item && item.price > 0
      ? `${inr(item.price)} only (MRP ${inr(item.mrp)}) · ${discountPct(item.price, item.mrp)}% OFF`
      : undefined;

  return (
    <AdminShell>
      <PageHead
        eyebrow={`Campaign ${campaign.id}`}
        title={item?.name ?? "Campaign report"}
        subtitle={`Sent ${fmtDateTime(campaign.sentOn)} to ${campaign.audience}.`}
        actions={
          <Link
            to="/whatsapp"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[0.66rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      <div className="mx-auto max-w-[1500px] space-y-8 px-4 py-7 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <div>
            <p className="mb-2 text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Message sent
            </p>
            {item ? (
              <WhatsAppPreview
                title={item.name}
                priceLine={priceLine}
                message={item.blurb}
                image={item.image}
                note={campaign.note}
                cta={campaign.custom ? undefined : "View Design"}
              />
            ) : null}
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="font-display text-base font-semibold text-foreground">
                Message funnel
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="Delivered"
                  value={campaign.sent.toLocaleString("en-IN")}
                  icon={<Send className="h-4 w-4" />}
                  tone="wa"
                />
                <StatCard
                  label="Opened"
                  value={campaign.opened.toLocaleString("en-IN")}
                  hint={`${Math.round((campaign.opened / campaign.sent) * 100)}% of delivered`}
                  icon={<MailOpen className="h-4 w-4" />}
                />
                <StatCard
                  label="Clicked"
                  value={campaign.clicked.toLocaleString("en-IN")}
                  hint={`${Math.round((campaign.clicked / campaign.sent) * 100)}% click rate`}
                  icon={<MousePointerClick className="h-4 w-4" />}
                />
              </div>
            </section>

            <section>
              <h2 className="font-display text-base font-semibold text-foreground">
                Business funnel
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="Reached"
                  value={campaign.reached.toLocaleString("en-IN")}
                  icon={<Users className="h-4 w-4" />}
                />
                <StatCard
                  label="Visited store"
                  value={campaign.visited.toLocaleString("en-IN")}
                  icon={<Eye className="h-4 w-4" />}
                />
                <StatCard
                  label="Ordered"
                  value={campaign.bought.toLocaleString("en-IN")}
                  hint={`${Math.round((campaign.bought / Math.max(1, campaign.visited)) * 100)}% of visitors`}
                  icon={<ShoppingBag className="h-4 w-4" />}
                  tone="gold"
                />
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <Pill active>{campaign.audience}</Pill>
              <Pill>{ranked.length} districts responded</Pill>
              <Pill>{campaign.custom ? "Custom broadcast" : "Catalogue promotion"}</Pill>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-base font-semibold text-foreground">
            Where the response came from
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Store visitors by district, highest first.
          </p>

          <div className="mt-4 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={92}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: "1rem",
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: "0.78rem",
                  }}
                />
                <Bar dataKey="visitors" radius={[0, 10, 10, 0]}>
                  {chartData.map((d, i) => (
                    <Cell
                      key={d.district}
                      fill={i === 0 ? "var(--accent)" : "var(--primary)"}
                      opacity={i === 0 ? 1 : 0.85 - i * 0.07}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {ranked.length > 8 ? (
            <>
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-2 text-[0.66rem] font-semibold tracking-[0.12em] text-primary uppercase"
              >
                {showAll ? "Hide full list" : "View all districts"}
              </button>
              {showAll ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ranked.map((d, i) => (
                    <li
                      key={d.district}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {i + 1}. {d.district}
                      </span>
                      <span className="font-semibold text-foreground">{d.visitors}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </AdminShell>
  );
}
