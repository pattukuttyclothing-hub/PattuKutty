/**
 * The three canonical admin cards — request, order, product.
 * Every screen (list pages and dashboard rails) renders these, so a card looks
 * identical wherever it appears. Never inline a duplicate of these layouts.
 */

import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone, Store, Truck, Trash2 } from "lucide-react";
import { EntityCard } from "@/components/shared/EntityCard";
import { findCategory, subName, timelineById } from "@/data/boutique";
import {
  getStagesForOrder,
  isProductSoldOut,
  requestStatusLabel,
  stageIndex,
  stageMeta,
  totalStock,
  type AdminOrder,
  type AdminProduct,
  type CustomRequest,
} from "@/lib/admin-store";
import { fmtDateTime, inr } from "@/lib/format";

import { statusTone } from "@/routes/requests.index";

export function RequestCard({ request: r, index = 0 }: { request: CustomRequest; index?: number }) {
  const isUuid = (val?: string) => !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

  const catObj = findCategory(r.category);
  const catLabel =
    (r.categoryName && !isUuid(r.categoryName) ? r.categoryName : catObj?.name) ||
    (isUuid(r.category) ? "Custom Design" : r.category || "Custom Design");

  const rawSubName = r.subCategoryName || subName(r.sub || "");
  const subLabel = rawSubName && !isUuid(rawSubName) ? rawSubName : (isUuid(r.sub) ? "" : r.sub || "");

  const categoryTitle = !subLabel || subLabel.toLowerCase() === catLabel.toLowerCase() ? catLabel : `${catLabel} — ${subLabel}`;
  const cardTitle = r.quote?.name ?? categoryTitle;

  const formattedDate = fmtDateTime(r.createdAt);
  const safeDate = formattedDate.includes("Invalid") ? "Recent Request" : formattedDate;
  const eyebrowText = `${safeDate} · ${r.requestNo || "CR-0000"}`;

  return (
    <Link to="/requests/$id" params={{ id: r.id }} className="block h-full">
      <EntityCard
        images={r.referenceImages}
        alt={`${r.requestNo || "Custom Request"} reference`}
        index={index}
        ribbon={requestStatusLabel[r.status] || "Submitted"}
        ribbonTone={statusTone[r.status] || "gold"}
        eyebrow={eyebrowText}
        title={cardTitle}
        metaLines={[
          `${r.colour || ""} · Size ${r.size || ""} · ${r.qty || 1} piece${(r.qty || 1) > 1 ? "s" : ""}`,
          `Stitching time: ${timelineById(r.timeline).label}`,
          <span key="c" className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {r.customerName || "(no name)"} · {r.customerPhone || "(no phone)"}
          </span>,
        ]}
        cta={r.quote ? `Quoted ${inr(r.quote.totalPayable)}` : "Review & quote"}
        footer={
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-primary transition-colors group-hover:border-primary">
            <MessageCircle className="h-4 w-4" />
          </span>
        }
      />
    </Link>
  );
}

export function OrderCard({ order: o, index = 0 }: { order: AdminOrder; index?: number }) {
  const stages = getStagesForOrder(o);
  const pct = ((stageIndex(o.stage, stages) + 1) / stages.length) * 100;
  return (
    <Link to="/orders/$id" params={{ id: o.id }} className="block h-full">
      <EntityCard
        images={o.items.map((it) => it.image).filter(Boolean)}
        alt={o.items[0]?.name ?? o.orderNo}
        index={index}
        ribbon={
          o.paymentStatus === "paid"
            ? "Paid"
            : o.paymentMethod === "cod"
              ? "Pay on delivery"
              : "Payment pending"
        }
        eyebrow={`${fmtDateTime(o.createdAt)} · #${o.orderNo}`}
        title={`${o.items[0]?.name ?? "Order"}${o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}`}
        metaLines={[
          <span key="c" className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {o.customerName} · {o.customerPhone}
          </span>,
          <span key="meta" className="inline-flex flex-wrap items-center gap-2">
            <span>{inr(o.total)} · {stageMeta(o.stage, stages).label}</span>
            {o.isCustom ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-600">
                Customisation
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-[0.62rem] text-muted-foreground">
              {o.deliveryType === "store_pickup" ? (
                <><Store className="h-3 w-3" /> Store Pickup</>
              ) : (
                <><Truck className="h-3 w-3" /> Doorstep</>
              )}
            </span>
          </span>,
          <span
            key="p"
            className="block h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/25"
          >
            <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </span>,
        ]}
        cta="Open order"
      />
    </Link>
  );
}

export function ProductCard({
  product: p,
  index = 0,
  onDelete,
}: {
  product: AdminProduct;
  index?: number;
  onDelete?: (id: string, name: string) => void;
}) {
  const soldOut = isProductSoldOut(p);
  const available = totalStock(p);
  const total = (p?.variants ?? []).length;
  return (
    <Link
      to="/products/$id"
      params={{ id: p.id }}
      className={`block h-full transition-all ${
        soldOut ? "opacity-80 ring-2 ring-pink-400/40 rounded-3xl bg-pink-50/10" : ""
      }`}
    >
      <EntityCard
        images={p.images}
        alt={p.name}
        index={index}
        ribbon={soldOut ? "PRODUCT SOLD OUT" : p.isActive ? undefined : "Hidden"}
        eyebrow={`${inr(p.basePrice)} · MRP ${inr(p.mrp)}`}
        title={p.name}
        metaLines={[soldOut ? "Product Sold Out" : `${available} stock available`]}
        cta="Edit design"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <span className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold ${
              soldOut
                ? "border-pink-500/40 bg-pink-500/15 text-pink-700 font-bold"
                : available === total
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : available > 0
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}>
              {soldOut ? "PRODUCT SOLD OUT" : `${available} in stock`}
            </span>
            {onDelete ? (
              <button
                type="button"
                title="Delete product"
                aria-label={`Delete ${p.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(p.id, p.name);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        }
      />
    </Link>
  );
}
