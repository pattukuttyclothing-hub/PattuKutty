import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader, PageSection, PageShell } from "@/components/shared/Page";
import { Reveal, stagger } from "@/components/shared/Reveal";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import { ProductCard } from "@/components/boutique/ProductCard";
import { findCategory, type CategoryId } from "@/data/boutique";
import { categoryCopy } from "@/data/copy";
import { useCategories, useProductsBySubCategory } from "@/lib/useStorefront";
import { abs, breadcrumbJsonLd, seoTitle, socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/category/$category/")({
  head: ({ params }) => {
    const cat = findCategory(params.category);
    const path = `/category/${params.category}/`;
    const catName = cat?.name ?? "Collection";
    const title = seoTitle(catName, "Custom & Bridal Clothing | Pattu Kutty");
    const description =
      categoryCopy[cat?.id ?? ""]?.meta ??
      `Shop ${catName} at Pattu Kutty Coimbatore — custom-stitched to your measurements with fast customization. Bridal, designer, and handmade options. Express 1-hour stitching available, delivery across India.`;
    return {
      meta: socialMeta({ title, description, path, image: cat?.image ?? null }),
      links: [{ rel: "canonical", href: abs(path) }],
    };
  },
  loader: ({ params }) => {
    const cat = findCategory(params.category);
    if (!cat) throw notFound();
    return { categoryId: cat.id };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useLoaderData() as { categoryId: CategoryId };
  const categoriesList = useCategories();
  const cat = categoriesList.find((c) => c.id === categoryId) ?? findCategory(categoryId)!;
  const hasSubs = Boolean(cat.subs && cat.subs.length > 0);

  // When category has no subcategories (e.g. Frocks), fetch products directly
  const { data: directItems, loading, error, refetch } = useProductsBySubCategory(
    hasSubs ? "" : categoryId,
    ""
  );

  const crumbsJsonLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: cat.name, path: `/category/${cat.id}/` },
  ]);

  const subtitleText = hasSubs
    ? `${cat.blurb} — choose the style you're looking for and we'll show you every design we stitch in it.`
    : loading
      ? `${cat.blurb} — Loading designs...`
      : error
        ? `${cat.blurb}`
        : `${cat.blurb} — ${directItems.length} design${directItems.length === 1 ? "" : "s"}, each stitched to your measurements.`;

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsJsonLd) }}
      />
      <PageHeader
        eyebrow={hasSubs ? "Step 1 of 2 · Pick a style" : `${cat.name} Collection`}
        title={cat.name}
        subtitle={subtitleText}
        crumbs={[{ label: "Collections", to: "/" }, { label: cat.name }]}
        actions={
          <Link
            to="/design-studio"
            search={{ category: cat.id }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft transition-transform hover:scale-[1.03]"
          >
            <Sparkles className="h-4 w-4" /> Design Your Own
          </Link>
        }
      />

      <PageSection>
        {hasSubs ? (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
            {cat.subs.map((sub, i) => {
              const count =
                sub.designCount != null
                  ? sub.designCount
                  : sub.design_count;
              const badgeText = (count != null && count >= 0) ? `${count} ${count === 1 ? "design" : "designs"}` : null;
              return (
                <Reveal
                  key={sub.id}
                  delay={stagger(i, 80)}
                  className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1.35rem)] max-w-[420px]"
                >
                  <Link
                    to="/category/$category/$sub"
                    params={{ category: cat.id, sub: sub.id }}
                    className="card-lift group relative block aspect-[4/5] sm:aspect-[3/3.8] w-full overflow-hidden rounded-3xl bg-card shadow-lift"
                  >
                    <AutoImageFade
                      images={sub.images}
                      alt={`${sub.name} designs`}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      interval={7000}
                      offset={i * 1500}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon/85 via-maroon/20 to-transparent" />
                    <div className="absolute top-3 left-3 z-10">
                      {badgeText != null && (
                        <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[0.6rem] sm:text-[0.65rem] font-bold tracking-wide text-primary-foreground shadow-soft border border-accent/40">
                          {badgeText}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
                      <h2 className="font-display text-xl leading-tight font-semibold text-primary-foreground sm:text-2xl">
                        {sub.name}
                      </h2>
                      <p className="mt-1.5 text-xs text-primary-foreground/85 sm:text-sm">
                        {sub.blurb}
                      </p>
                      <span className="mt-3.5 inline-flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.18em] text-accent uppercase">
                        View Designs <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
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
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
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
        ) : directItems.length === 0 ? (
          <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No products available</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              There are no designs available in this category yet. Check back soon or design your own custom outfit!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {directItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        )}
      </PageSection>
    </PageShell>
  );
}
