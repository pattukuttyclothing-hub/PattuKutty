import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { ProductCard } from "@/components/admin/cards";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { categories, findSub, type CategoryId } from "@/data/boutique";
import { isProductSoldOut, useAdmin, type AdminProduct } from "@/lib/admin-store";
import { uid } from "@/lib/format";


const title = "Products — Pattu Kutty Admin";
const description =
  "Every design shown on the storefront, with live availability per size, grouped by category.";

export const Route = createFileRoute("/products/")({
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
  component: ProductsPage,
});

function ProductsPage() {
  const { products, addProduct, deleteProduct } = useAdmin();
  const navigate = useNavigate();
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [sub, setSub] = useState<string | "all">("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<{ id: string; name: string } | null>(null);

  const subs = cat === "all" ? [] : (categories.find((c) => c.id === cat)?.subs ?? []);

  const list = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (cat === "all" || p.category === cat) &&
            (sub === "all" || p.sub === sub) &&
            p.name.toLowerCase().includes(q.trim().toLowerCase()),
        )
        .sort((a, b) => {
          const aSold = isProductSoldOut(a);
          const bSold = isProductSoldOut(b);
          return aSold === bSold ? 0 : aSold ? 1 : -1;
        }),
    [products, cat, sub, q],
  );

  const create = (categoryId: CategoryId, subId: string) => {
    const s = findSub(categoryId, subId)!;
    const newId = `design-new-${Date.now().toString(36)}`;
    const p: AdminProduct = {
      id: newId,
      name: "",
      description: "",
      category: categoryId,
      sub: subId,
      basePrice: 0,
      mrp: 0,
      blurb: s.blurb || "",
      badge: "",
      expressFromPrice: 0,
      deliveryCharge: 0,
      isActive: true,
      soldOut: false,

      images: [],
      variants: (["S", "M", "L"] as const).map((size) => ({ size, available: true, stockQty: 1 })),
    };
    addProduct(p);
    toast.success("New draft created — enter design details and upload photos.");
    void navigate({ to: "/products/$id", params: { id: p.id } });
  };

  return (
    <AdminShell>
      <PageHead
        eyebrow="Catalogue"
        title="Products"
        subtitle="Same cards the customer sees — with availability instead of the shop CTA."
        actions={
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft"
          >
            <Plus className="h-4 w-4" /> Add design
          </button>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {adding ? (
          <div className="mb-7 rounded-3xl border border-primary/25 bg-card p-5 shadow-soft">
            <p className="text-sm font-medium">Pick where the new design lives</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {categories.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <img src={c.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
                    <span className="text-sm font-semibold">{c.name}</span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {c.subs.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => create(c.id, s.id)}
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary"
                      >
                        <img src={s.images[0]} alt="" className="h-7 w-7 rounded-lg object-cover" />
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Visual category filter */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCat("all");
              setSub("all");
            }}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              cat === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCat(c.id);
                  setSub("all");
                }}
                className={`flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-xs font-semibold transition-colors ${
                  cat === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <img src={c.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                {c.name} ({count})
              </button>
            );
          })}
          <label className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search designs"
              className="w-40 bg-transparent text-xs outline-none"
            />
          </label>
        </div>

        {subs.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSub("all")}
              className={`rounded-full border px-3.5 py-1.5 text-[0.7rem] font-medium ${
                sub === "all" ? "border-primary text-primary" : "border-border text-muted-foreground"
              }`}
            >
              All styles
            </button>
            {subs.map((s) => {
              const count = products.filter((p) => p.category === cat && p.sub === s.id).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSub(s.id)}
                  className={`flex items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-[0.7rem] font-medium ${
                    sub === s.id ? "border-primary text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <img src={s.images[0]} alt="" className="h-6 w-6 rounded-full object-cover" />
                  {s.name} ({count})
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              index={i}
              onDelete={(id, name) => setDeletingProduct({ id, name })}
            />
          ))}
        </div>
      </div>

      <DeleteConfirmationModal
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        itemName={deletingProduct?.name}
        onConfirm={async () => {
          if (deletingProduct) {
            await deleteProduct(deletingProduct.id);
            toast.success(`Product "${deletingProduct.name}" deleted successfully.`);
          }
        }}
      />
    </AdminShell>
  );
}
