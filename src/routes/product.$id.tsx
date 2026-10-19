import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, AlertCircle, Heart, MessageCircle, Minus, Plus, Share2, ShoppingBag, Sparkles } from "lucide-react";
import { PageShell, PageHeader, ComingSoonView, NoInternetConnectionView } from "@/components/shared/Page";
import { ProductGallery } from "@/components/shared/ProductGallery";
import { ProductCard } from "@/components/boutique/ProductCard";
import { findCategory, findSub, isFrocksCategory, isHalfSareeCategory, isPattuPaavadaiCategory, isSalwarReadymadeCategory, isSareeCategory, isBlouseCategory, blouseSizes, type Product } from "@/data/boutique";
import { fetchProductById } from "@/lib/api/catalogue";
import { abs, absImage, BRAND, breadcrumbJsonLd, seoDescription, seoTitle, socialMeta } from "@/lib/seo";
import { inr, orderWaLink, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuthGate } from "@/lib/auth";
import { shareProduct } from "@/lib/share";
import { useProduct, useProductsBySubCategory } from "@/lib/useStorefront";

export const Route = createFileRoute("/product/$id")({
  head: ({ params, loaderData }) => {
    const p = (loaderData as { product?: Product | null } | undefined)?.product ?? null;
    const path = `/product/${params.id}`;
    const title = seoTitle(p?.name ?? "Design", "Buy Custom Silk & Bridal Wear | Pattu Kutty");
    const description =
      (p?.description ? seoDescription(p.description) : null) ??
      "Buy custom silk sarees, bridal wear, and designer clothing from Pattu Kutty Coimbatore — your measurements, your fabric, fast customization, express 1-hour stitching, delivered across India.";

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
    return { id: params.id, product: live ?? null };
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
  const isSaree = categorySlug === "sarees" || isSareeCategory(categorySlug, subCategorySlug);
  const isBlouse = categorySlug === "blouses" || isBlouseCategory(categorySlug);
  const relatedRes = useProductsBySubCategory(categorySlug, (isSaree || isBlouse) ? "" : subCategorySlug);

  const [size, setSize] = useState<string>(isSaree ? "Standard" : isBlouse ? "38" : "");
  const [showBlouseSizeGuide, setShowBlouseSizeGuide] = useState<boolean>(false);
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

  const isPattuPaavadai = isPattuPaavadaiCategory(product?.category, product?.sub);
  const isHalfSareeOrLehenga =
    isHalfSareeCategory(product?.category, product?.sub) ||
    product?.sub === "half-saree-classic" ||
    product?.sub === "lehenga";
  const isFrocks = isFrocksCategory(product?.category);
  const isSalwarReadymade = isSalwarReadymadeCategory(product?.category, product?.sub);
  const isCustomizableStitched = isHalfSareeOrLehenga || isFrocks || isSalwarReadymade;

  // Extract unique size labels from available variants or category defaults
  const uniqueAvailableSizes = useMemo(() => {
    const rawSizes: string[] = [];
    availableVariants.forEach((v) => {
      if (v.size && !rawSizes.includes(v.size)) {
        rawSizes.push(v.size);
      }
    });

    if (isSaree) {
      return ["Standard"];
    }

    if (isBlouse) {
      const hasBlouseSizes = rawSizes.some((s) => blouseSizes.includes(s));
      if (!hasBlouseSizes) {
        return blouseSizes;
      }
      return blouseSizes.filter((s) => rawSizes.includes(s));
    }

    if (rawSizes.length > 0) {
      if (isHalfSareeOrLehenga) {
        const allowed = ["S", "M", "L", "XL", "XXL"];
        const filtered = rawSizes.filter((s) => allowed.includes(s));
        if (filtered.length > 0) return filtered;
      }
      return rawSizes;
    }

    if (isPattuPaavadai) {
      return [
        "1 Year", "2 Year", "3 Year", "4 Year", "5 Year", "6 Year", "7 Year", "8 Year",
        "9 Year", "10 Year", "11 Year", "12 Year", "13 Year", "14 Year", "15 Year", "16 Year",
      ];
    }
    if (isHalfSareeOrLehenga) {
      return ["S", "M", "L", "XL", "XXL"];
    }
    return product?.sizes || ["S", "M", "L", "XL", "XXL"];
  }, [availableVariants, isBlouse, isCustomizableStitched, isHalfSareeOrLehenga, isPattuPaavadai, isSaree, product?.sizes]);

  // Set default selected size when real backend product variants load
  useEffect(() => {
    if (isSaree) {
      setSize("Standard");
    } else if (isBlouse) {
      if (!size || !blouseSizes.includes(size)) {
        setSize(uniqueAvailableSizes.includes("38") ? "38" : (uniqueAvailableSizes[0] ?? "38"));
      }
    } else if (uniqueAvailableSizes.length > 0) {
      if (!size || !uniqueAvailableSizes.includes(size)) {
        setSize(uniqueAvailableSizes[0] ?? "");
      }
    } else {
      setSize("");
    }
  }, [uniqueAvailableSizes, isSaree, isBlouse]);

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

  if (error && !loading) {
    return (
      <PageShell>
        <NoInternetConnectionView />
      </PageShell>
    );
  }

  if (!product && !loading) {
    return (
      <PageShell>
        <ComingSoonView
          title="Design Not Available"
          subtitle="The design you are looking for does not exist or has been removed."
        />
      </PageShell>
    );
  }

  const activeProduct = product!;
  const category = findCategory(activeProduct.category) ?? { id: activeProduct.category, name: "Collection" };
  const sub = findSub(activeProduct.category, activeProduct.sub);
  const related = (relatedRes.data || []).filter((x) => x.id !== activeProduct.id).slice(0, 4);

  const isSoldOut = activeProduct.soldOut || (
    isSaree
      ? Boolean(activeProduct.variants && activeProduct.variants.length > 0 && !activeProduct.variants.some(v => v.available !== false && (v.stockQty === undefined || v.stockQty > 0)))
      : (activeProduct.variants && activeProduct.variants.length > 0 && uniqueAvailableSizes.length === 0)
  );

  const selectedSize = isSaree ? "Standard" : (size || uniqueAvailableSizes[0] || "S");

  const handleAddToCart = () => {
    gate(() => {
      add({
        id: activeProduct.id,
        name: activeProduct.name,
        image: activeProduct.image || (activeProduct.images && activeProduct.images[0]) || "",
        price: activeProduct.price,
        size: selectedSize,
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
        size: selectedSize,
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
          ...(!isSaree && !isBlouse && sub && sub.id !== activeProduct.category ? [{ label: sub.name, to: "/category/$category/$sub", params: { category: activeProduct.category, sub: sub.id } }] : []),
          { label: activeProduct.name },
        ]}
        eyebrow={`${category.name}${!isSaree && !isBlouse && sub ? ` · ${sub.name}` : ""}`}
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
              <ProductGallery
                images={activeProduct.images || [activeProduct.image]}
                alt={activeProduct.name}
                isSoldOut={isSoldOut}
                overlay={
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      title={has(activeProduct.id) ? "Remove from wishlist" : "Save to wishlist"}
                      aria-label={has(activeProduct.id) ? "Remove from wishlist" : "Save to wishlist"}
                      onClick={() => toggle(activeProduct.id)}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/95 dark:bg-black/90 shadow-md border border-border/60 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          has(activeProduct.id) ? "fill-rose-500 text-rose-500" : "text-rose-500/80 fill-rose-50/50 hover:text-rose-600 hover:fill-rose-100"
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      title="Share product link"
                      aria-label={`Share ${activeProduct.name}`}
                      onClick={() => void shareProduct(activeProduct.id, activeProduct.name)}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/95 dark:bg-black/90 shadow-md border border-border/60 text-muted-foreground transition-all hover:scale-110 hover:text-primary active:scale-95 cursor-pointer"
                    >
                      <Share2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                }
              />
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

              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {activeProduct.name}
                </h1>
                <button
                  type="button"
                  title="Share product link"
                  aria-label={`Share ${activeProduct.name}`}
                  onClick={() => void shareProduct(activeProduct.id, activeProduct.name)}
                  className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
              </div>

              {activeProduct.blurb ? (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {activeProduct.blurb}
                </p>
              ) : null}

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

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>🚚 Delivery: {activeProduct.deliveryCharge ? inr(activeProduct.deliveryCharge) : "Free"}</span>
                <span>•</span>
                <span>⭐ {activeProduct.rating ?? 4.9} rating</span>
                {Number((activeProduct as any).expressFromPrice || (activeProduct as any).express_from_price || activeProduct.expressFromPrice || 0) > 0 ? (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      ⚡ Express stitching from {inr(Number((activeProduct as any).expressFromPrice || (activeProduct as any).express_from_price || activeProduct.expressFromPrice))}
                    </span>
                  </>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {activeProduct.description}
              </p>

{/* Size Selection */}
              {isSaree ? (
                <div className="mt-6 rounded-2xl border border-border/60 bg-secondary/30 p-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-primary">
                      <Sparkles className="h-3.5 w-3.5 text-accent fill-accent/20" /> Standard Saree Specifications
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    Full traditional drape (5.5m length) with matching unstitched blouse piece (0.8m). Crafted with authentic borders and high-end finish.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[0.7rem] font-medium text-foreground/80">
                    <span className="rounded-full border border-border/60 bg-card px-2.5 py-1">✓ 5.5m Saree</span>
                    <span className="rounded-full border border-border/60 bg-card px-2.5 py-1">✓ Running Blouse Piece</span>
                    <span className="rounded-full border border-border/60 bg-card px-2.5 py-1">✓ Express Delivery Available</span>
                  </div>
                </div>
              ) : isBlouse ? (
                <div className="mt-8 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
                        Select Blouse Size (Bust in Inches)
                      </label>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[0.68rem] font-bold text-accent dark:text-accent-foreground border border-accent/30 shadow-xs">
                        <Sparkles className="h-3 w-3" /> Can Be Customisable
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBlouseSizeGuide((v) => !v)}
                      className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {showBlouseSizeGuide ? "Hide Size Chart ✕" : "Size Chart 📏"}
                    </button>
                  </div>

                  {/* Expandable Blouse Size Chart / Measurement Guide */}
                  {showBlouseSizeGuide ? (
                    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3.5 sm:p-4 text-xs transition-all animate-fadeIn">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground text-xs">Standard Blouse Size Guide (Inches)</span>
                        <span className="text-[0.65rem] text-muted-foreground">Coimbatore Boutique Fit</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs">
                          <thead>
                            <tr className="border-b border-border/60 text-muted-foreground text-[0.7rem]">
                              <th className="py-1 px-1.5 font-medium text-left">Size</th>
                              {blouseSizes.map((sz) => (
                                <th key={sz} className="py-1 px-1.5 font-semibold text-foreground">{sz}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40 text-[0.72rem]">
                            <tr>
                              <td className="py-1.5 px-1.5 font-medium text-muted-foreground text-left">Bust</td>
                              {blouseSizes.map((sz) => (
                                <td key={`bust-${sz}`} className="py-1.5 px-1.5 font-semibold text-foreground">{sz}"</td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-1.5 px-1.5 font-medium text-muted-foreground text-left">Waist</td>
                              {["26", "28", "30", "32", "34", "36"].map((w, i) => (
                                <td key={`waist-${i}`} className="py-1.5 px-1.5 text-muted-foreground">{w}"</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {/* 32, 34, 36, 38, 40, 42 Size Buttons */}
                  <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                    {blouseSizes.map((sz) => {
                      const isSelected = size === sz;
                      const isAvailable = uniqueAvailableSizes.length === 0 || uniqueAvailableSizes.includes(sz);

                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSize(sz)}
                          disabled={!isAvailable}
                          className={`relative rounded-xl border font-bold transition-all min-h-[3rem] flex flex-col items-center justify-center text-xs sm:text-sm cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-soft ring-2 ring-primary/20 scale-[1.02]"
                              : isAvailable
                                ? "border-border bg-card text-foreground hover:bg-secondary hover:border-primary/40 active:scale-95"
                                : "border-border/40 bg-muted/30 text-muted-foreground/40 cursor-not-allowed line-through"
                          }`}
                        >
                          <span className="text-sm font-bold tracking-tight">{sz}</span>
                          <span className={`text-[0.62rem] font-normal leading-none mt-0.5 ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            inch
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mention: "Can Be Customisable" & Explanation */}
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 sm:p-3.5 flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        Can Be Customisable
                      </p>
                      <p className="text-muted-foreground leading-relaxed text-[0.72rem]">
                        Have unique body measurements, prefer specific neck cuts, sleeve styles, or want a custom fabric color? We tailor each blouse to your exact requirement.
                      </p>
                    </div>
                  </div>

                  {/* Below that: Add a Button "Customize Your Size & Color" */}
                  <button
                    type="button"
                    onClick={handleCustomizeClick}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 hover:from-primary/20 hover:to-accent/20 text-foreground font-semibold px-4 py-3 text-xs sm:text-sm transition-all shadow-xs hover:border-primary active:scale-[0.99] group cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-accent transition-transform group-hover:rotate-12" />
                    <span>Customize Your Size & Color</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
                      {isPattuPaavadai ? "Select Age / Size" : "Select Size"}
                    </label>
                    {isCustomizableStitched ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent border border-accent/20">
                        <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                        Upto 5XL it can Be customisable
                      </span>
                    ) : isPattuPaavadai ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
                        Age 1 Year – 16 Years
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCustomizeClick}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                      >
                        Custom Size / Fit? <Sparkles className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {isPattuPaavadai ? (
                    <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {uniqueAvailableSizes.map((sz) => {
                        const isSelected = size === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSize(sz)}
                            className={`h-11 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center text-center cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-soft ring-2 ring-primary/20 font-bold"
                                : "border-border bg-card text-foreground hover:bg-secondary hover:border-primary/40"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2 sm:gap-2.5">
                      {uniqueAvailableSizes.map((sz) => {
                        const isSelected = size === sz;
                        const isLongText = sz.length > 4;

                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSize(sz)}
                            className={`relative rounded-xl border font-semibold transition-all leading-snug flex items-center justify-center text-center cursor-pointer ${
                              isLongText
                                ? "min-h-[2.75rem] px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm"
                                : "min-w-[3.75rem] min-h-[2.75rem] px-3.5 py-2 text-xs sm:text-sm"
                            } ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-soft ring-2 ring-primary/20 font-bold"
                                : "border-border bg-card text-foreground hover:bg-secondary hover:border-primary/40"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Customize button below size chart */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCustomizeClick}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      Customize Your Size & Color
                    </button>
                    {isCustomizableStitched && (
                      <span className="text-[0.72rem] text-muted-foreground font-medium">
                        Need 3XL, 4XL or 5XL? Click to customize exact fit.
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 rounded-xl bg-secondary/30 p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                      {isPattuPaavadai
                        ? "Custom age fit and height adjustments available."
                        : "Need a different size? Custom sizing is available."}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                      Want a different color? Color customization is available.
                    </p>
                  </div>
                </div>
              )}

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
                      href={orderWaLink([{ key: activeProduct.id, id: activeProduct.id, name: activeProduct.name, image: activeProduct.image || "", price: activeProduct.price, size: selectedSize, colour: "Original Colour", qty }])}
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
