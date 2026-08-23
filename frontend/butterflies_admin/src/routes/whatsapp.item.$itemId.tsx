import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/shared/Badge";
import { useAdmin } from "@/lib/admin-store";
import { inr } from "@/lib/format";
import { discountPct, itemById, itemLink, publishedItemsFrom } from "@/lib/whatsapp-notify";

const title = "Review design before notifying — Butterflies Tailoring Admin";
const description =
  "Check the design or offer details, pricing and store link before sending it out as a WhatsApp campaign.";

export const Route = createFileRoute("/whatsapp/item/$itemId")({
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
  component: ItemPage,
});

function ItemPage() {
  const { itemId } = Route.useParams();
  const { products } = useAdmin();
  const items = useMemo(() => publishedItemsFrom(products), [products]);
  const item = itemById(items, itemId);

  if (!item) {
    return (
      <AdminShell>
        <PageHead eyebrow="WhatsApp Studio" title="Design not found" />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link to="/whatsapp" className="text-sm font-semibold text-primary">
            Back to WhatsApp Studio
          </Link>
        </div>
      </AdminShell>
    );
  }

  const product = products.find((p) => p.id === item.id);
  const gallery = product?.images ?? [item.image];

  return (
    <AdminShell>
      <PageHead
        eyebrow="WhatsApp Studio"
        title={item.name}
        subtitle="Confirm what goes into the message — the campaign always uses the live catalogue price."
        actions={
          <>
            <Link
              to="/whatsapp"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[0.66rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <Link
              to="/whatsapp/send/$itemId"
              params={{ itemId: item.id }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[0.66rem] font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-soft"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Notify on WhatsApp
            </Link>
          </>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="grid grid-cols-2 gap-3">
          {gallery.slice(0, 4).map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={`${item.name} view ${i + 1}`}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-3xl border border-border object-cover shadow-soft"
            />
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <StatusBadge tone="ok">{item.kind}</StatusBadge>
          <h2 className="font-display mt-3 text-xl font-semibold text-foreground">{item.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.blurb}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-foreground">
              {inr(item.price)}
            </span>
            <span className="text-sm text-muted-foreground line-through">{inr(item.mrp)}</span>
            <span className="text-sm font-semibold text-primary">
              {discountPct(item.price, item.mrp)}% off
            </span>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Catalogue ID</dt>
              <dd className="font-semibold text-foreground">{item.id}</dd>
            </div>
            {product ? (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Availability</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {(product.variants ?? []).filter((v) => v.available).length} of {(product.variants ?? []).length} sizes
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Sizes</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {(product.variants ?? []).map((v) => v.size).join(" · ")}
                  </dd>
                </div>
              </>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Store link</dt>
              <dd className="truncate text-right text-xs font-medium text-primary">
                {itemLink(item)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AdminShell>
  );
}
