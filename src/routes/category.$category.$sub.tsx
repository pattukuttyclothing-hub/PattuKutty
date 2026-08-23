import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/Page";
import { ProductCard } from "@/components/boutique/ProductCard";
import { findCategory, findSub } from "@/data/boutique";
import { subCopy } from "@/data/copy";
import { useProductsBySubCategory } from "@/lib/useStorefront";
import { abs, breadcrumbJsonLd, seoDescription, seoTitle, socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/category/$category/$sub")({
  head: ({ params }) => {
    const cat = findCategory(params.category);
    const sub = findSub(params.category, params.sub);
    const path = `/category/${params.category}/${params.sub}`;
    const title = seoTitle(sub?.name ?? "Designs", "Coimbatore Boutique");
    const description = seoDescription(
      subCopy[sub?.id ?? ""]?.meta ??
        `${sub?.blurb ?? "Custom designs"} — stitched to your measurements in Coimbatore, 1-hour express option, delivered across India.`,
    );
    return {
      meta: socialMeta({ title, description, path, image: sub?.images?.[0] ?? null }),
      links: [{ rel: "canonical", href: abs(path) }],
    };
  },
  loader: ({ params }) => {
    const cat = findCategory(params.category);
    const sub = findSub(params.category, params.sub);
    if (!cat || !sub) throw notFound();
    return { categoryId: cat.id, subId: sub.id };
  },
  component: SubCategoryPage,
});

function SubCategoryPage() {
  const { categoryId, subId } = Route.useLoaderData() as { categoryId: string; subId: string };
  const cat = findCategory(categoryId)!;
  const sub = findSub(categoryId, subId)!;
  const { data: items, loading, error, refetch } = useProductsBySubCategory(categoryId, subId);

  const subtitleText = loading
    ? `${sub.blurb} — Loading designs...`
    : error
      ? `${sub.blurb}`
      : `${sub.blurb} — ${items.length} design${items.length === 1 ? "" : "s"}, each stitched to your measurements.`;

  const crumbsJsonLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: cat.name, path: `/category/${cat.id}/` },
    { name: sub.name, path: `/category/${cat.id}/${sub.id}` },
  ]);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsJsonLd) }}
      />
      <PageHeader
        eyebrow={`${cat.name} · Step 2 of 2`}
        title={sub.name}
        compact
        subtitle={subtitleText}
        crumbs={[
          { label: "Collections", to: "/" },
          { label: cat.name, to: "/category/$category", params: { category: cat.id } },
          { label: sub.name },
        ]}
        actions={
          <Link
            to="/design-studio"
            search={{ category: cat.id, sub: sub.id }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft transition-transform hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4" /> Design Your Own
          </Link>
        }
      />

      <section className="bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {cat.subs.map((s) => (
              <Link
                key={s.id}
                to="/category/$category/$sub"
                params={{ category: cat.id, sub: s.id }}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  s.id === sub.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border/70 bg-card p-4">
                  <div className="aspect-[4/5] rounded-xl bg-muted/60" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-muted/60" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted/60" />
                  <div className="mt-4 h-9 w-full rounded-full bg-muted/60" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">Unable to load designs</h3>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-105"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Loading
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border/70 bg-card p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">No products available</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                There are no designs available in this category yet. Check back soon or design your own custom outfit!
              </p>
              <Link
                to="/design-studio"
                search={{ category: cat.id, sub: sub.id }}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" /> Design Your Own
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
