import { useQuery } from "@tanstack/react-query";
import {
  categories as seedCategories,
  heroBanners as seedHeroBanners,
  featuredProducts as seedFeaturedProducts,
  products as seedProducts,
  reels as seedReels,
  reviews as seedReviews,
  type Category,
  type Product,
} from "@/data/boutique";
import {
  fetchCategories,
  fetchFeaturedProducts,
  fetchHeroBanners,
  fetchProductById,
  fetchProductsBySubCategory,
  fetchReels,
  fetchTestimonials,
  type HeroBanner,
  type ReelItem,
  type Testimonial,
} from "./api/catalogue";

// Seed banners pre-mapped to HeroBanner shape — used as placeholderData while
// the live fetch is in-flight. Avoids a blank Hero on first render.
const seedBannersAsHeroBanners: HeroBanner[] = seedHeroBanners.map((b) => ({
  id: b.id,
  image_url: b.image,
  eyebrow: b.eyebrow,
  headline: b.headline,
  subtext: b.subtext,
  cta_label: b.cta,
  cta_link: "#collections",
}));

// ─── Storefront data hooks (React Query) ────────────────────────────────────
//
// Caching contract per data type:
//   categories / testimonials  — staleTime 5 min  (change rarely)
//   heroBanners / reels        — staleTime 2 min  (admin may push new content)
//   featuredProducts / product — staleTime 1 min  (stock / featured state changes)
//
// Empty-state contract (FIXED from prior useEffect pattern):
//   • SUCCESS + empty array  → returns []      → component renders genuine empty state
//   • SUCCESS + data         → returns data    → component renders live content
//   • FAILURE (network/5xx)  → returns seed    → component renders seed as resilience fallback
//     (The prior `res && res.length > 0` guard kept seed on successful empty-array
//      responses, masking real "no items" states in the DB from the admin.)
// ────────────────────────────────────────────────────────────────────────────

export function useCategories(): Category[] {
  const { data, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    placeholderData: seedCategories,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (isError || !data || !Array.isArray(data) || data.length === 0) {
    return seedCategories;
  }

  // Preserve canonical 4 boutique categories and imported Cloudinary image assets
  return seedCategories.map((seedCat) => {
    const matched = (data as any[]).find(
      (d) => d.id === seedCat.id || d.slug === seedCat.id || d.name?.toLowerCase().includes(seedCat.name.toLowerCase())
    );
    if (!matched) return seedCat;
    const validImage = typeof matched.image === "string" && matched.image.startsWith("http") ? matched.image : seedCat.image;
    const backendSubs = matched.sub_categories || matched.subs || [];
    const enrichedSubs = seedCat.subs.map((seedSub) => {
      const matchedSub = backendSubs.find(
        (s: any) =>
          s.id === seedSub.id ||
          s.slug === seedSub.id ||
          s.name?.toLowerCase() === seedSub.name.toLowerCase()
      );
      const rawCount = matchedSub ? (matchedSub.designCount ?? matchedSub.design_count) : undefined;
      return {
        ...seedSub,
        ...(typeof rawCount === "number"
          ? { designCount: rawCount, design_count: rawCount }
          : {}),
      };
    });


    return {
      ...seedCat,
      name: seedCat.name,
      blurb: matched.blurb || seedCat.blurb,
      image: validImage,
      subs: enrichedSubs,
    };
  });
}

export function useHeroBanners(): HeroBanner[] {
  const { data, isError } = useQuery({
    queryKey: ["heroBanners"],
    queryFn: fetchHeroBanners,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (isError || !data || !Array.isArray(data) || data.length === 0) {
    return seedBannersAsHeroBanners;
  }

  return data as HeroBanner[];
}

export function useFeaturedProducts(): Product[] {
  const { data, isError } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: fetchFeaturedProducts,
    // Seed data is only a pre-fetch placeholder; a real (even empty) API
    // response always wins so the storefront never masks backend state.
    placeholderData: seedFeaturedProducts,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  return isError ? [] : (data ?? []);
}


export function useReels(): ReelItem[] {
  const { data, isError } = useQuery({
    queryKey: ["reels"],
    queryFn: async (): Promise<ReelItem[]> => {
      const res: unknown = await fetchReels();
      if (Array.isArray(res)) return res;
      if (
        res &&
        typeof res === "object" &&
        "data" in res &&
        Array.isArray((res as Record<string, unknown>)["data"])
      ) {
        return (res as Record<string, unknown>)["data"] as ReelItem[];
      }
      return [];
    },
    placeholderData: seedReels as unknown as ReelItem[],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  return isError
    ? (seedReels as unknown as ReelItem[])
    : (data ?? (seedReels as unknown as ReelItem[]));
}

export function useTestimonials(): Testimonial[] {
  const { data, isError } = useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
    placeholderData: seedReviews,
    staleTime: 5 * 60 * 1000,
  });
  return isError ? seedReviews : (data ?? seedReviews);
}

// ─── Product & Sub-Category hooks ───────────────────────────────────────────

export interface UseProductsBySubCategoryResult {
  data: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProductsBySubCategory(
  categoryId: string,
  subCategoryId: string
): UseProductsBySubCategoryResult {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: ["productsBySub", categoryId, subCategoryId],
    queryFn: () => fetchProductsBySubCategory(categoryId, subCategoryId),
    staleTime: 1 * 60 * 1000,
    enabled: Boolean(categoryId && subCategoryId),
  });

  return {
    data: data ?? [],
    loading: isLoading,
    error: isError
      ? error instanceof Error
        ? error.message
        : "Failed to load products from server"
      : null,
    refetch: () => {
      void refetchQuery();
    },
  };
}

export interface UseProductResult {
  product: Product | undefined;
  loading: boolean;
  error: boolean;
}

export function useProduct(id: string): UseProductResult {
  const seed = seedProducts.find((p: Product) => p.id === id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id),
    placeholderData: seed,
    staleTime: 1 * 60 * 1000,
    enabled: Boolean(id),
  });

  return {
    product: isError && !seed ? undefined : (data ?? seed),
    loading: isLoading && !seed,
    error: isError && !seed,
  };
}

// ─── Wishlist resolution hook ────────────────────────────────────────────────
// Retains seed-product-first resolution: resolves static seed products
// instantly and fetches only missing UUIDs from the API.

export interface UseWishlistProductsResult {
  products: Product[];
  loading: boolean;
}

export function useWishlistProducts(ids: string[]): UseWishlistProductsResult {
  const { data: fetched, isLoading } = useQuery({
    queryKey: ["wishlistProducts", ids.join(",")],
    queryFn: async (): Promise<Product[]> => {
      if (!ids || ids.length === 0) return [];

      const seedMatches: Record<string, Product> = {};
      ids.forEach((id) => {
        const match = seedProducts.find((p: Product) => p.id === id);
        if (match) seedMatches[id] = match;
      });

      const missingIds = ids.filter((id) => !seedMatches[id]);

      if (missingIds.length === 0) {
        return ids.map((id) => seedMatches[id]).filter((p): p is Product => !!p);
      }

      const fetchedArr = await Promise.all(
        missingIds.map((id) => fetchProductById(id).catch(() => undefined))
      );

      const fetchedMap: Record<string, Product> = {};
      fetchedArr.forEach((p) => {
        if (p && p.id) fetchedMap[p.id] = p;
      });

      return ids
        .map((id) => seedMatches[id] || fetchedMap[id])
        .filter((p): p is Product => !!p);
    },
    enabled: ids.length > 0,
    staleTime: 1 * 60 * 1000,
  });

  return {
    products: fetched ?? [],
    loading: isLoading && ids.length > 0,
  };
}
