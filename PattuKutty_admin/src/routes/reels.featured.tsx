import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronDown, ChevronUp, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { FeaturedShowcase, PreviewPanel } from "@/components/admin/StorefrontSections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin, type AdminProduct } from "@/lib/admin-store";
import { inr } from "@/lib/format";

const title = "Editing Featured Designs — Pattu Kutty Admin";
const description =
  "Choose which designs are featured on the customer landing page and set the order they appear in.";

export const Route = createFileRoute("/reels/featured")({
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
  component: EditFeaturedPage,
});

function EditFeaturedPage() {
  const { products, productsLoading, featuredIds, setFeaturedIds } = useAdmin();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const featured = useMemo(() => {
    const explicit = featuredIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is AdminProduct => !!p);

    const seen = new Set<string>();
    return explicit.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [featuredIds, products]);

  const pool = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = products.filter(
      (p) => !needle || p.name.toLowerCase().includes(needle) || (p.badge && p.badge.toLowerCase().includes(needle))
    );

    const uniqueMap = new Map<string, AdminProduct>();
    for (const p of filtered) {
      if (!uniqueMap.has(p.id)) {
        uniqueMap.set(p.id, p);
      }
    }
    return Array.from(uniqueMap.values()).slice(0, 90);
  }, [products, q]);

  const toggle = (id: string) => {
    const nextIds = featuredIds.includes(id)
      ? featuredIds.filter((x) => x !== id)
      : [...featuredIds, id];
    setFeaturedIds(Array.from(new Set(nextIds)));
  };

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = featuredIds.indexOf(fromId);
    const to = featuredIds.indexOf(toId);
    if (from < 0 || to < 0) return;
    const next = [...featuredIds];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x!);
    setFeaturedIds(Array.from(new Set(next)));
  };

  const endDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <AdminShell>
      <PageHead
        eyebrow="Storefront · Featured"
        title="Editing the Featured Designs"
        subtitle="Drag the pinned designs into the order customers should see. Use “Add designs” to pick more from the catalogue."
        actions={
          <Link
            to="/reels"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-2 text-[0.66rem] font-semibold tracking-[0.12em] text-primary uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[7fr_3fr]">
          <PreviewPanel label="Live preview">
            <FeaturedShowcase products={featured} />
          </PreviewPanel>

          <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-blush px-5 py-3">
              <div>
                <span className="text-[0.62rem] font-semibold tracking-[0.22em] text-primary uppercase">
                  Featured order
                </span>
                <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                  {featured.length} design{featured.length === 1 ? "" : "s"} pinned · drag to
                  reorder
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[0.64rem] font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft"
              >
                <Plus className="h-3.5 w-3.5" /> Add designs
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {featured.map((p, i) => {
                const dragging = dragId === p.id;
                const over = overId === p.id && dragId !== p.id;
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(p.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", p.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setOverId(p.id);
                    }}
                    onDragLeave={() => setOverId((cur) => (cur === p.id ? null : cur))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragId ?? e.dataTransfer.getData("text/plain");
                      if (from) reorder(from, p.id);
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={`flex cursor-grab items-center gap-3 rounded-2xl border bg-background p-2.5 transition-all active:cursor-grabbing ${
                      dragging
                        ? "border-primary/60 opacity-45"
                        : over
                          ? "border-primary bg-secondary shadow-soft ring-2 ring-primary/35"
                          : "border-border/70"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[0.62rem] font-bold text-accent-foreground">
                      {i + 1}
                    </span>
                    <img
                      src={
                        p.images?.[0] ||
                        (p as any).image ||
                        "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg"
                      }
                      alt=""
                      className="h-12 w-10 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{p.name}</span>
                      <span className="text-[0.7rem] text-primary">{inr(p.basePrice)}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        aria-label="Move featured design up"
                        onClick={() => {
                          if (i > 0) reorder(p.id, featured[i - 1]!.id);
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={i === featured.length - 1}
                        aria-label="Move featured design down"
                        onClick={() => {
                          if (i < featured.length - 1) reorder(p.id, featured[i + 1]!.id);
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${p.name} from featured`}
                        onClick={() => {
                          toggle(p.id);
                          toast.success("Removed from featured designs.");
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full border border-destructive/35 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {!featured.length ? (
                <div className="grid place-items-center gap-3 py-14 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nothing featured yet — the landing page section will stay empty.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[0.66rem] font-semibold tracking-[0.1em] text-primary-foreground uppercase"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add designs
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <Dialog
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o);
          if (!o) setQ("");
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add designs to Featured</DialogTitle>
            <DialogDescription>
              Tap a design to pin or unpin it. Pinned designs keep the order on the previous screen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              id="catalogueSearch"
              name="catalogueSearch"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the catalogue…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="grid max-h-[62vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
            {productsLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Loading catalogue…</span>
              </div>
            ) : pool.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                {q ? `No active designs match "${q}".` : "No active designs in the catalogue yet."}
              </p>
            ) : (
              pool.map((p) => {
                const on = featuredIds.includes(p.id);
                const cardImg =
                  p.images?.[0] ||
                  (p as any).image ||
                  "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      toggle(p.id);
                      if (!on) {
                        toast.success(`Pinned "${p.name}" to featured designs.`);
                      } else {
                        toast.info(`Unpinned "${p.name}" from featured designs.`);
                      }
                    }}
                    className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition-all ${
                      on
                        ? "border-primary bg-secondary/80 ring-2 ring-primary/40 shadow-soft"
                        : "border-border/80 bg-card hover:border-primary/50 hover:bg-secondary/40"
                    }`}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                      {cardImg ? (
                        <img
                          src={cardImg}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center bg-muted text-[0.65rem] text-muted-foreground p-2 text-center">
                          No image
                        </div>
                      )}
                      {on ? (
                        <span className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      ) : null}
                      {p.badge ? (
                        <span className="absolute bottom-2 left-2 rounded-full bg-primary/90 px-2 py-0.5 text-[0.6rem] font-bold text-primary-foreground backdrop-blur">
                          {p.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3">
                      <span className="block truncate text-[0.78rem] font-semibold text-foreground" title={p.name}>
                        {p.name}
                      </span>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-[0.72rem] font-bold text-primary">{inr(p.basePrice)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <p className="text-[0.7rem] text-muted-foreground">
              {featured.length} design{featured.length === 1 ? "" : "s"} pinned
            </p>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="rounded-full bg-primary px-5 py-2 text-[0.66rem] font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
