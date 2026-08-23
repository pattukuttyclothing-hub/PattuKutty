import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, IndianRupee, PackageCheck, Scissors } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderCard, ProductCard, RequestCard } from "@/components/admin/cards";
import { isProductSoldOut, useAdmin, type RequestStatus } from "@/lib/admin-store";
import { storeInfo } from "@/data/boutique";
import { inr } from "@/lib/format";

const title = "Admin Dashboard — Butterflies Tailoring";
const description =
  "Control the storefront catalogue, quote custom design requests and move orders through stitching and handover.";

export const Route = createFileRoute("/")({
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
  component: Dashboard,
});

const greeting = () => {
  const h = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" })
      .format(new Date())
      .replace(/\D/g, ""),
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

function RailHead({
  title: t,
  note,
  to,
  linkLabel,
}: {
  title: string;
  note: string;
  to: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">{t}</h2>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <Link
        to={to}
        className="inline-flex items-center gap-1 text-[0.7rem] font-semibold tracking-[0.1em] text-primary uppercase"
      >
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Dashboard() {
  const { products, requests, orders } = useAdmin();

  const soldOutSizes = (p: (typeof products)[number]) =>
    (p?.variants ?? []).filter((v) => !v.available).length;
  const withSoldOut = [...products].sort((a, b) => soldOutSizes(b) - soldOutSizes(a)).slice(0, 12);
  const needsAttention = products.filter((p) => (p?.variants ?? []).some((v) => !v.available) || isProductSoldOut(p));
  const openRequests = requests.filter((r) => r.status === "submitted" || r.status === "under_review");
  const toPack = orders.filter((o) => o.stage === "placed" || o.stage === "confirmed");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const earned = orders
    .filter((o) => {
      if (o.paymentStatus !== "paid" || o.stage === "cancelled") return false;
      const d = new Date(o.createdAt);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((s, o) => s + (o.total ?? 0), 0);

  const waiting = [...requests].sort((a, b) => {
    const rank = (s: RequestStatus) => (s === "submitted" ? 0 : s === "under_review" ? 1 : s === "quoted" ? 2 : 3);
    return rank(a.status) - rank(b.status) || +new Date(b.createdAt) - +new Date(a.createdAt);
  });

  const recentOrders = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const stats = [
    {
      to: "/requests",
      icon: Scissors,
      value: String(openRequests.length),
      label: "Waiting for a price",
      note: "Send a quote today",
    },
    {
      to: "/orders",
      icon: PackageCheck,
      value: String(toPack.length),
      label: "Orders to pack",
      note: `${toPack.filter((o) => o.isCustom).length} custom pieces on the table`,
    },
    {
      to: "/products",
      icon: AlertTriangle,
      value: String(needsAttention.length),
      label: "Sizes sold out",
      note: "Re-stock or mark as customise request",
    },
    {
      to: "/orders",
      icon: IndianRupee,
      value: inr(earned),
      label: "Earned this month",
      note: "Paid orders only",
    },
  ];

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1500px] px-4 pt-7 pb-10 sm:px-6">
        {/* greeting */}
        <header>
          <p className="text-[0.62rem] font-semibold tracking-[0.3em] text-primary uppercase">
            {storeInfo.area ? storeInfo.area.split(",")[1]?.trim() || "Coimbatore" : "Coimbatore"} Studio
          </p>
          <h1 className="font-display mt-1.5 text-2xl font-semibold text-foreground sm:text-3xl">
            {greeting()}, Studio Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live overview of custom stitching requests, store orders, and catalogue status.
          </p>
        </header>

        {/* stat tiles */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                to={s.to}
                className="card-lift flex items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="font-display block text-xl font-semibold text-foreground">
                    {s.value}
                  </span>
                  <span className="block text-xs font-medium text-foreground">{s.label}</span>
                  <span className="block text-[0.7rem] text-muted-foreground">{s.note}</span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* waiting on you */}
        <section className="mt-8">
          <RailHead
            title="Waiting on you"
            note="Custom requests, newest first"
            to="/requests"
            linkLabel="All requests"
          />
          <div className="flex gap-4 overflow-x-auto pb-3">
            {waiting.map((r, i) => (
              <div key={r.id} className="w-[300px] shrink-0">
                <RequestCard request={r} index={i} />
              </div>
            ))}
          </div>
        </section>

        {/* recent orders */}
        <section className="mt-6">
          <RailHead title="Recent orders" note="Newest first" to="/orders" linkLabel="All orders" />
          <div className="flex gap-4 overflow-x-auto pb-3">
            {recentOrders.map((o, i) => (
              <div key={o.id} className="w-[300px] shrink-0">
                <OrderCard order={o} index={i} />
              </div>
            ))}
          </div>
        </section>

        {/* running low */}
        <section className="mt-6">
          <RailHead
            title="Needs attention"
            note="Products with sold out sizes"
            to="/products"
            linkLabel="Manage stock"
          />
          <div className="flex gap-4 overflow-x-auto pb-3">
            {withSoldOut.map((p, i) => (
              <div key={p.id} className="w-[300px] shrink-0">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
