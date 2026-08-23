import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader, PageSection, PageShell } from "@/components/shared/Page";
import { Reveal, stagger } from "@/components/shared/Reveal";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import { findCategory, type CategoryId } from "@/data/boutique";
import { categoryCopy } from "@/data/copy";
import { useCategories } from "@/lib/useStorefront";
import { abs, breadcrumbJsonLd, seoTitle, socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/category/$category/")({
  head: ({ params }) => {
    const cat = findCategory(params.category);
    const path = `/category/${params.category}/`;
    const title = seoTitle(cat?.name ?? "Collection", "Custom Stitched in Coimbatore");
    const description =
      categoryCopy[cat?.id ?? ""]?.meta ??
      `Custom ${cat?.name ?? "boutique"} stitched to your measurements in Coimbatore — 1-hour express option, delivery across India.`;
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

  const crumbsJsonLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: cat.name, path: `/category/${cat.id}/` },
  ]);

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsJsonLd) }}
      />
      <PageHeader
        eyebrow="Step 1 of 2 · Pick a style"
        title={cat.name}
        subtitle={`${cat.blurb} — choose the style you're looking for and we'll show you every design we stitch in it.`}
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
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {cat.subs.map((sub, i) => {
              const count =
                sub.designCount != null
                  ? sub.designCount
                  : sub.design_count;
              // count === -1 means "no live DB data yet" — hide badge entirely
              const badgeText = (count != null && count >= 0) ? `${count} ${count === 1 ? "design" : "designs"}` : null;
              return (
                <Reveal key={sub.id} delay={stagger(i, 80)}>
                <Link
                  to="/category/$category/$sub"
                  params={{ category: cat.id, sub: sub.id }}
                  className="card-lift group relative block aspect-[4/5] sm:aspect-[3/3.8] overflow-hidden rounded-3xl bg-card shadow-lift"
                >
                  <AutoImageFade
                    images={sub.images}
                    alt={`${sub.name} designs`}
                    className="absolute inset-0 h-full w-full"
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
      </PageSection>
    </PageShell>
  );
}
