import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertCircle, Heart, MessageCircle, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import { PageShell, PageHeader } from "@/components/shared/Page";
import { ProductGallery } from "@/components/shared/ProductGallery";
import { ProductCard } from "@/components/boutique/ProductCard";
import { findCategory, findProduct, findSub, type Product } from "@/data/boutique";
import { fetchProductById } from "@/lib/api/catalogue";
import { abs, absImage, BRAND, breadcrumbJsonLd, socialMeta } from "@/lib/seo";
import { inr, orderWaLink, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuthGate } from "@/lib/auth";
import { useProduct, useProductsBySubCategory } from "@/lib/useStorefront";

export const Route = createFileRoute("/product/$id")({
  head: ({ params, loaderData }) => {
    const p = (loaderData as { product?: Product | null } | undefined)?.product ?? findProduct(params.id);
    const path = `/product/${params.id}`;
    const title = `${p?.name ?? "Design"} — Custom Stitched | Pattu Kutty Coimbatore`;
    const description =
      p?.description?.slice(0, 158) ??
      "Custom stitched designer wear from our Coimbatore studio — your measurements, your fabric, 1-hour express option, delivered across India.";

    const productJsonLd = p
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          image: [absImage(p.image)],
          sku: p.id,
          brand: { "@type": "Brand", name: BRAND.name },
          ...(p.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: 12 } } : {}),
          offers: {
            "@type": "Offer",
            url: abs(path),
            priceCurrency: "INR",
            price: String(p.price),
            availability: p.soldOut
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: BRAND.legalName },
          },
        }
      : null;

    const crumbs = p
      ? breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: findCategory(p.category)?.name ?? "Collection", path: `/category/${p.category}/` },
          { name: findSub(p.category, p.sub)?.name ?? "Designs", path: `/category/${p.category}/${p.sub}` },
          { name: p.name, path },
        ])
      : null;

    return {
      meta: socialMeta({ title, description, path, image: p?.image ?? null, type: "product" }),
      links: [{ rel: "canonical", href: abs(path) }],
      scripts: [
        ...(productJsonLd
          ? [{ type: "application/ld+json", children: JSON.stringify(productJsonLd) }]
          : []),
        ...(crumbs ? [{ type: "application/ld+json", children: JSON.stringify(crumbs) }] : []),
      ],
    };
  },
  loader: async ({ params }) => {
    // Live product data so SEO tags reflect the real catalogue; seed data is the fallback.
    let live: Product | undefined;
    try {
      live = await fetchProductById(params.id);
    } catch {
      live = undefined;
    }
    return { id: params.id, product: live ?? findProduct(params.id) ?? null };
  },
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useLoaderData() as { id: string };
  const { product, loading, error } = useProduct(id);

  const navigate = useNavigate();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const gate = useAuthGate();

  const categorySlug = product?.category ?? "";
  const subCategorySlug = product?.sub ?? "";
  const relatedRes = useProductsBySubCategory(categorySlug, subCategorySlug);

  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  // Filter available variants strictly from backend variant stock/availability
  const availableVariants = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return [];
    return product.variants.filter((v) => {
      const isAvail = v.available !== false;
      const hasStock = v.stockQty === undefined || v.stockQty > 0;
      return isAvail && hasStock;
    });
  }, [product?.variants]);

  // Extract unique size labels from available variants
  const uniqueAvailableSizes = useMemo(() => {
    const sizes: string[] = [];
    availableVariants.forEach((v) => {
      if (v.size && !sizes.includes(v.size)) {
        sizes.push(v.size);
      }
    });
    return sizes;
  }, [availableVariants]);

  // Set default selected size when real backend product variants load
  useEffect(() => {
    if (uniqueAvailableSizes.length > 0) {
      if (!size || !uniqueAvailableSizes.includes(size)) {
        setSize(uniqueAvailableSizes[0] ?? "");
      }
    } else {
      setSize("");
    }
  }, [uniqueAvailableSizes]);

  if (loading && !product) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-xs font-medium text-muted-foreground">Loading design details...</p>
        </div>
      </PageShell>
    );
  }

  if ((error || !product) && !loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Design Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The design you are looking for does not exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Collections
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const activeProduct = product!;
  const category = findCategory(activeProduct.category) ?? { id: activeProduct.category, name: "Collection" };
  const sub = findSub(activeProduct.category, activeProduct.sub);
  const related = (relatedRes.data || []).filter((x) => x.id !== activeProduct.id).slice(0, 4);

  const isSoldOut = activeProduct.soldOut || (activeProduct.variants && activeProduct.variants.length > 0 && uniqueAvailableSizes.length === 0);

  const handleAddToCart = () => {
    gate(() => {
      add({
        id: activeProduct.id,
        name: activeProduct.name,
        image: activeProduct.image || (activeProduct.images && activeProduct.images[0]) || "",
        price: activeProduct.price,
        size: size || uniqueAvailableSizes[0] || "S",
        colour: "Design Colour",
        qty,
      });
    });
  };

  const handleBuyNow = () => {
    gate(() => {
      add({
        id: activeProduct.id,
        name: activeProduct.name,
        image: activeProduct.image || (activeProduct.images && activeProduct.images[0]) || "",
        price: activeProduct.price,
        size: size || uniqueAvailableSizes[0] || "S",
        colour: "Design Colour",
        qty,
      });
      void navigate({ to: "/checkout" });
    });
  };

  const handleCustomizeClick = () => {
    gate(() => {
      void navigate({
        to: "/design-studio",
        search: { product: activeProduct.id, category: activeProduct.category, sub: activeProduct.sub },
      });
    });
  };

  return (
    <PageShell>
      <PageHeader
        crumbs={[
          { label: category.name, to: "/category/$category", params: { category: activeProduct.category } },
          ...(sub ? [{ label: sub.name, to: "/category/$category/$sub", params: { category: activeProduct.category, sub: sub.id } }] : []),
          { label: activeProduct.name },
        ]}
        eyebrow={`${category.name}${sub ? ` · ${sub.name}` : ""}`}
        title={activeProduct.name}
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span className="text-primary font-bold text-base">{inr(activeProduct.basePrice ?? activeProduct.price)}</span>
            {isSoldOut ? (
              <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-destructive">
                Sold Out
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-emerald-700 dark:text-emerald-400">
                In Stock & Ready for Customization
              </span>
            )}
          </span>
        }
        actions={null}
      />

      <section className="bg-background py-6 lg:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Product + Breadcrumb structured data is emitted from the route head() using live loader data. */}


          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6 lg:sticky lg:top-28 self-start">
              <ProductGallery images={activeProduct.images || [activeProduct.image]} alt={activeProduct.name} />
            </div>

            <div className="flex flex-col lg:col-span-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  {activeProduct.badge && (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.16em] text-accent uppercase">
                      <Sparkles className="h-3 w-3" /> {activeProduct.badge}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCustomizeClick}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> Customize This Product
                </button>
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {activeProduct.name}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold text-primary sm:text-3xl">
                  {inr(activeProduct.basePrice ?? activeProduct.price)}
                </span>
                {activeProduct.mrp > (activeProduct.basePrice ?? activeProduct.price) && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {inr(activeProduct.mrp)}
                    </span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      SAVE {Math.round((1 - (activeProduct.basePrice ?? activeProduct.price) / activeProduct.mrp) * 100)}%
                    </span>
                  </>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>🚚 Delivery: {activeProduct.deliveryCharge ? inr(activeProduct.deliveryCharge) : "Free"}</span>
                <span>•</span>
                <span>⭐ {activeProduct.rating ?? 4.9} rating</span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {activeProduct.description}
              </p>

              {/* Size Selection */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
                    Select Size
                  </label>
                  <button
                    type="button"
                    onClick={handleCustomizeClick}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    Custom Size / Fit? <Sparkles className="h-3 w-3" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {uniqueAvailableSizes.map((sz) => {
                    const isSelected = size === sz;

                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSize(sz)}
                        className={`relative min-w-[3.25rem] rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-soft"
                            : "border-border bg-card text-foreground hover:bg-secondary"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 space-y-1 rounded-xl bg-secondary/30 p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                    Need a different size? Custom sizing is available.
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                    Want a different color? Color customization is available.
                  </p>
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-6">
                <label className="text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
                  Quantity
                </label>
                <div className="mt-2 flex w-fit items-center rounded-xl border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="grid h-9 w-9 place-items-center rounded-lg text-foreground transition-transform active:scale-95 hover:bg-secondary disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-semibold text-foreground">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-foreground transition-transform active:scale-95 hover:bg-secondary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                {isSoldOut ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-amber-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Currently Sold Out
                    </div>
                    <p className="mt-1 text-xs text-amber-700">
                      This design is currently sold out. You can submit a custom size request and our tailors will craft one for you!
                    </p>
                    <button
                      type="button"
                      onClick={handleCustomizeClick}
                      className="mt-3 w-full rounded-full bg-accent px-6 py-3 text-xs font-semibold tracking-[0.12em] text-accent-foreground uppercase shadow-soft"
                    >
                      Request Custom Stitching
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="flex-1 rounded-full border border-primary bg-card py-3.5 text-xs font-semibold tracking-[0.12em] text-primary uppercase shadow-soft hover:bg-secondary"
                      >
                        <ShoppingBag className="mr-2 inline-block h-4 w-4" /> Add to Bag
                      </button>

                      <button
                        type="button"
                        onClick={handleBuyNow}
                        className="flex-1 rounded-full bg-primary py-3.5 text-xs font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-soft hover:bg-primary/90"
                      >
                        Buy Now
                      </button>

                      <button
                        type="button"
                        onClick={() => toggle(activeProduct.id)}
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border transition-colors ${has(activeProduct.id)
                            ? "border-rose-300 bg-rose-50 text-rose-600"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <Heart className={`h-5 w-5 ${has(activeProduct.id) ? "fill-rose-600" : ""}`} />
                      </button>
                    </div>

                    <a
                      href={orderWaLink([{ key: activeProduct.id, id: activeProduct.id, name: activeProduct.name, image: activeProduct.image || "", price: activeProduct.price, size: size || uniqueAvailableSizes[0] || "S", colour: "Original Colour", qty }])}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary/60 py-3 text-xs font-semibold text-secondary-foreground hover:bg-secondary"
                    >
                      <MessageCircle className="h-4 w-4" /> Order via WhatsApp Direct
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
