import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { AddReelDialog } from "@/components/admin/AddReelDialog";
import { PreviewPanel, ReelsShowcase } from "@/components/admin/StorefrontSections";
import { useAdmin, type ReelItem } from "@/lib/admin-store";
import { inr } from "@/lib/format";


const title = "Editing the Reels Section — Pattu Kutty Admin";
const description =
  "Reorder, add, edit or remove the reels shown in the storefront What We Stitch carousel.";

export const Route = createFileRoute("/reels/edit")({
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
  component: EditReelsPage,
});

function EditReelsPage() {
  const { reels, products, deleteReel, setReels } = useAdmin();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReelItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (r: ReelItem) => {
    setEditing(r);
    setOpen(true);
  };

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = reels.findIndex((r) => r.id === fromId);
    const to = reels.findIndex((r) => r.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...reels];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setReels(next);
    toast.success(`“${item!.title}” moved to position ${to + 1}.`);
  };

  const endDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <AdminShell>
      <PageHead
        eyebrow="Storefront · Reels"
        title="Editing the Reels Section"
        subtitle="Drag a card by its handle and drop it where you want it — the rest shift down automatically. #1 plays first on the storefront."
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
            <ReelsShowcase reels={reels} products={products} cardWidth={280} height={520} />
          </PreviewPanel>

          <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-blush px-5 py-3">
              <div>
                <span className="text-[0.62rem] font-semibold tracking-[0.22em] text-primary uppercase">
                  Carousel order
                </span>
                <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
                  {reels.length} reel{reels.length === 1 ? "" : "s"} · drag to reorder
                </p>
              </div>
              <button
                type="button"
                onClick={openNew}
                aria-label="Add a reel"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {reels.map((r, i) => {
                const p = products.find((x) => x.id === r.productId);
                const dragging = dragId === r.id;
                const over = overId === r.id && dragId !== r.id;
                return (
                  <article
                    key={r.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(r.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", r.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setOverId(r.id);
                    }}
                    onDragLeave={() => setOverId((cur) => (cur === r.id ? null : cur))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = dragId ?? e.dataTransfer.getData("text/plain");
                      if (from) reorder(from, r.id);
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={`flex cursor-grab gap-3 rounded-2xl border bg-background p-3 transition-all active:cursor-grabbing ${
                      dragging
                        ? "border-primary/60 opacity-45"
                        : over
                          ? "border-primary bg-secondary shadow-soft ring-2 ring-primary/35"
                          : "border-border/70"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="mt-1 grid h-6 w-4 shrink-0 place-items-center text-muted-foreground"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>

                    <div className="relative h-24 w-[54px] shrink-0 overflow-hidden rounded-xl bg-maroon">
                      <video
                        src={r.videoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-1 left-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-accent-foreground">
                        {i + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      {p ? (
                        <p className="mt-1 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
                          <img src={p.images[0]} alt="" className="h-6 w-5 rounded object-cover" />
                          <span className="truncate">{p.name}</span>
                          <span className="shrink-0 font-semibold text-primary">
                            {inr(p.basePrice)}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-[0.7rem] text-destructive">No product tagged</p>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={i === 0}
                          aria-label="Move reel up"
                          onClick={() => {
                            if (i > 0) reorder(r.id, reels[i - 1]!.id);
                          }}
                          className="inline-flex items-center justify-center rounded-full border border-border bg-card p-1 text-foreground hover:bg-secondary disabled:opacity-30"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={i === reels.length - 1}
                          aria-label="Move reel down"
                          onClick={() => {
                            if (i < reels.length - 1) reorder(r.id, reels[i + 1]!.id);
                          }}
                          className="inline-flex items-center justify-center rounded-full border border-border bg-card p-1 text-foreground hover:bg-secondary disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-secondary px-3 py-1 text-[0.64rem] font-semibold text-primary uppercase"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteReel(r.id);
                            toast.success("Reel removed from the storefront.");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-destructive/35 px-3 py-1 text-[0.64rem] font-semibold text-destructive uppercase"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {!reels.length ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No reels yet — tap + to add the first one.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {open ? (
        <AddReelDialog
          key={editing?.id ?? "new"}
          open={open}
          editing={editing}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </AdminShell>
  );
}

