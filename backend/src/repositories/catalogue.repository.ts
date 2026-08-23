import { db } from "../config/db.js";

// ──────────────────────────────────────────────────────────────────────
// Fallback data served when Supabase is not yet seeded / unreachable
// ──────────────────────────────────────────────────────────────────────
const fallbackCategories = [
  {
    id: "half-saree",
    name: "Half Saree",
    blurb: "Ceremony sets & bridal drapes",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Saree_3_1.jpg",
    subs: [
      { id: "half-saree-classic", name: "Half Saree", blurb: "Silk sets with zari drape work" },
      { id: "lehenga", name: "Lehenga", blurb: "Bridal flare & can-can layers" },
      { id: "pattu-pudavai", name: "Pattu Pudavai", blurb: "Traditional temple-border silk" },
    ],
  },
  {
    id: "frocks",
    name: "Frocks",
    blurb: "Everyday to wedding wear",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Kurti_Carousel_Banner.jpg",
    subs: [
      { id: "normal-frocks", name: "Normal Frocks", blurb: "Soft cottons for daily comfort" },
      { id: "wedding-frocks", name: "Wedding Frocks", blurb: "Layered gowns for the big day" },
      { id: "designer-frocks", name: "Designer Frocks", blurb: "Statement cuts & hand work" },
    ],
  },
  {
    id: "sarees",
    name: "Sarees",
    blurb: "Silk, fancy & designer drapes",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514181/Saree_Carousel_Banner.jpg",
    subs: [
      { id: "silk-sarees", name: "Silk Sarees", blurb: "Kanchi silk with gold zari" },
      { id: "fancy-sarees", name: "Fancy Sarees", blurb: "Light drapes for functions" },
      { id: "designer-sarees", name: "Designer Sarees", blurb: "Custom pallu & blouse pairing" },
    ],
  },
  {
    id: "blouses",
    name: "Blouses",
    blurb: "Aari, maggam & designer work",
    image: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg",
    subs: [
      { id: "bridal-blouses", name: "Bridal Blouses", blurb: "Heavy zari & sleeve work" },
      { id: "pattern-blouses", name: "Pattern Blouses", blurb: "Princess cut, boat & sweetheart" },
      { id: "designer-blouses", name: "Designer Blouses", blurb: "Aari and maggam couture" },
    ],
  },
];

const fallbackProducts = [
  {
    id: "blouse-aari-1",
    name: "Royal Peacock Zardosi Aari Blouse",
    base_price: 3499,
    price: 3499,
    mrp: 4999,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80"],
    category: "blouses",
    sub: "bridal-blouses",
    delivery_charge: 0,
    sold_out: false,
    is_active: true,
    description: "Hand-crafted peacock motif in antique gold zardosi and pearls on deep magenta velvet silk.",
  },
  {
    id: "lehenga-velvet-1",
    name: "Maharani Royal Crimson Velvet Lehenga",
    base_price: 18999,
    price: 18999,
    mrp: 24999,
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80"],
    category: "half-saree",
    sub: "lehenga",
    delivery_charge: 0,
    sold_out: false,
    is_active: true,
    description: "Heavy velvet skirt with 16 panels of zardosi work and double net dupattas.",
  },
];

const fallbackHeroBanners = [
  {
    id: "hb-1",
    image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg",
    desktop_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg",
    tablet_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg",
    mobile_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514177/Half_Saree_Carousel_Banner.jpg",
    cta_label: "Book a Fitting",
    cta_link: "#collections",
    is_active: true,
    position: 0,
  },
  {
    id: "hb-2",
    image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Saree_3_1.jpg",
    desktop_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Saree_3_1.jpg",
    tablet_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Saree_3_1.jpg",
    mobile_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Saree_3_1.jpg",
    cta_label: "Explore Half Sarees",
    cta_link: "#collections",
    is_active: true,
    position: 1,
  },
  {
    id: "hb-3",
    image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg",
    desktop_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg",
    tablet_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg",
    mobile_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786515414/ClipDown.com_636776992_1234791172100082_8411992496655131403_n.jpg",
    cta_label: "Enquire Now",
    cta_link: "#collections",
    is_active: true,
    position: 2,
  },
  {
    id: "hb-4",
    image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Kurti_Carousel_Banner.jpg",
    desktop_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Kurti_Carousel_Banner.jpg",
    tablet_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Kurti_Carousel_Banner.jpg",
    mobile_image_url: "https://res.cloudinary.com/vy7aodsr/image/upload/v1786514176/Kurti_Carousel_Banner.jpg",
    cta_label: "See Festive Picks",
    cta_link: "#collections",
    is_active: true,
    position: 3,
  },
];

const fallbackReels = [
  {
    id: "r1",
    title: "Bridal Lehenga Reveal",
    video_url: "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    poster_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    is_active: true,
    position: 0,
    products: [fallbackProducts[0]],
  },
  {
    id: "r2",
    title: "Aari Sleeve Embroidery",
    video_url: "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    poster_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    is_active: true,
    position: 1,
    products: [fallbackProducts[1] || fallbackProducts[0]],
  },
  {
    id: "r3",
    title: "Half Saree Drape Styling",
    video_url: "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    poster_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    is_active: true,
    position: 2,
    products: [fallbackProducts[2] || fallbackProducts[0]],
  },
  {
    id: "r4",
    title: "Kanchi Silk Blouse Stitch",
    video_url: "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    poster_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    is_active: true,
    position: 3,
    products: [fallbackProducts[3] || fallbackProducts[0]],
  },
  {
    id: "r5",
    title: "1-Hour Express Fitting",
    video_url: "https://res.cloudinary.com/vy7aodsr/video/upload/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4",
    poster_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80",
    is_active: true,
    position: 4,
    products: [fallbackProducts[4] || fallbackProducts[0]],
  },
];

const fallbackTestimonials = [
  {
    id: "rev-1",
    name: "Ananya Ramesh",
    initials: "AR",
    rating: 5,
    quote: "Stitched my bridal blouse in just 1 hour! Perfect fit without a single alteration.",
    is_active: true,
    position: 0,
  },
  {
    id: "rev-2",
    name: "Deepika Suresh",
    initials: "DS",
    rating: 5,
    quote: "The quality of aari work is unmatched. My lehenga looked like it came from a Mumbai designer!",
    is_active: true,
    position: 1,
  },
];

export class CatalogueRepository {
  // ──── Storefront Public Queries ──────────────────────────────────────

  static async getCategories() {
    try {
      const { data, error } = await db
        .from("categories")
        .select("*, sub_categories(*)")
        .order("position", { ascending: true });

      if (error || !data || data.length === 0) {
        return fallbackCategories.map((cat) => ({
          ...cat,
          subs: cat.subs.map((sub) => {
            const count = fallbackProducts.filter(
              (p) => p.sub === sub.id && p.is_active !== false
            ).length;
            return { ...sub, design_count: count, designCount: count };
          }),
        }));
      }

      const { data: activeProducts } = await db
        .from("products")
        .select("sub_category_id, category_id, sub:sub_categories(slug)")
        .eq("is_active", true);

      return data.map((cat) => {
        const subCategories = cat.sub_categories || cat.subs || [];
        const enrichedSubs = subCategories.map((sub: Record<string, unknown>) => {
          const subIdStr = String(sub.id || "");
          const subSlugStr = String(sub.slug || "");

          const dbCount = activeProducts
            ? activeProducts.filter((p: Record<string, unknown>) => {
                const subObj = p.sub as { slug?: string } | null;
                const pSubId = String(p.sub_category_id || "");
                const pSubSlug = subObj?.slug ? String(subObj.slug) : "";
                return (
                  (pSubId && (pSubId === subIdStr || pSubId === subSlugStr)) ||
                  (pSubSlug && (pSubSlug === subSlugStr || pSubSlug === subIdStr))
                );
              }).length
            : 0;

          const fallbackCount = fallbackProducts.filter(
            (p) => (p.sub === subIdStr || p.sub === subSlugStr) && p.is_active !== false
          ).length;

          const count = activeProducts ? dbCount : fallbackCount;

          return { ...sub, design_count: count, designCount: count };
        });
        return {
          ...cat,
          subs: enrichedSubs,
          sub_categories: enrichedSubs,
        };
      });
    } catch {
      return fallbackCategories.map((cat) => ({
        ...cat,
        subs: cat.subs.map((sub) => {
          const count = fallbackProducts.filter(
            (p) => p.sub === sub.id && p.is_active !== false
          ).length;
          return { ...sub, design_count: count, designCount: count };
        }),
      }));
    }
  }

  static async getHeroBanners() {
    try {
      const { data, error } = await db
        .from("hero_banners")
        .select("*")
        .eq("is_active", true)                  // ← correct column name from schema
        .order("position", { ascending: true });
      if (error || !data || data.length === 0) return fallbackHeroBanners;
      return data;
    } catch { return fallbackHeroBanners; }
  }

  /** Uses featured_slots JOIN products (or falls back to top active database products) */
  static async getFeaturedProducts() {
    try {
      const { data, error } = await db
        .from("featured_slots")
        .select("sort_order, product:products(*, images:product_images(*))")
        .order("sort_order", { ascending: true })
        .limit(8);

      let rawProducts: any[] = [];
      if (!error && data && data.length > 0) {
        rawProducts = data.map((row: any) => row.product).filter(Boolean);
      } else {
        // Fallback to top active products from products table in database
        const { data: dbProducts } = await db
          .from("products")
          .select("*, images:product_images(*)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8);
        rawProducts = dbProducts ?? [];
      }

      if (!rawProducts.length) return [];

      return rawProducts.map((p: any) => {
        const imgArr = Array.isArray(p.images)
          ? p.images
              .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((i: any) => (typeof i === "string" ? i : i.url))
          : [];
        return {
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          category: p.category_id,
          sub: p.sub_category_id,
          basePrice: p.base_price ?? p.price ?? 2999,
          base_price: p.base_price ?? p.price ?? 2999,
          price: p.base_price ?? p.price ?? 2999,
          mrp: p.mrp ?? 0,
          blurb: p.blurb ?? "",
          badge: p.badge ?? "",
          deliveryCharge: p.delivery_charge ?? 0,
          soldOut: Boolean(p.sold_out),
          sold_out: Boolean(p.sold_out),
          image: imgArr[0] || p.image || "",
          images: imgArr,
        };
      });
    } catch (err) {
      console.error("Error in getFeaturedProducts:", err);
      return [];
    }
  }

  static async getProductsBySub(categoryId: string, subCategoryId: string) {
    try {
      const catUuid = await this.resolveCategoryUuid(categoryId);
      const subUuid = await this.resolveSubCategoryUuid(subCategoryId);

      let query = db
        .from("products")
        .select("*, category:categories(slug, name), sub:sub_categories(slug, name), images:product_images(*), variants:product_variants(*)")
        .eq("is_active", true);

      if (catUuid) {
        query = query.eq("category_id", catUuid);
      } else if (categoryId && this.isUUID(categoryId)) {
        query = query.eq("category_id", categoryId);
      } else if (categoryId) {
        // Provided category slug does not exist in DB
        return [];
      }

      if (subUuid) {
        query = query.eq("sub_category_id", subUuid);
      } else if (subCategoryId && this.isUUID(subCategoryId)) {
        query = query.eq("sub_category_id", subCategoryId);
      } else if (subCategoryId) {
        // Provided subcategory slug does not exist in DB
        return [];
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Supabase error in getProductsBySub:", error);
        throw new Error(error?.message || "Failed to fetch products from database");
      }

      return data.map((p) => {
        const imgArr = Array.isArray(p.images)
          ? p.images
              .sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((i: { url: string } | string) => (typeof i === "string" ? i : i.url))
          : [];
        const varArr = Array.isArray(p.variants)
          ? p.variants.map((v: { id?: string; size: string; available?: boolean; is_sold_out?: boolean; is_active?: boolean; stock_qty?: number }) => {
              const isAvail = v.available ?? ((v.is_active !== false) && (v.is_sold_out !== true) && ((v.stock_qty ?? 1) > 0));
              return {
                id: v.id,
                size: v.size,
                available: isAvail,
                stockQty: v.stock_qty ?? (isAvail ? 1 : 0),
              };
            })
          : [];

        const isSoldOut = Boolean(
          p.sold_out ||
          (varArr.length > 0 && !varArr.some((v: { available: boolean; stockQty: number }) => v.available && (v.stockQty ?? 0) > 0))
        );

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description ?? "",
          category: p.category?.slug ?? p.category_id,
          sub: p.sub?.slug ?? p.sub_category_id,
          basePrice: p.base_price,
          base_price: p.base_price,
          price: p.base_price,
          mrp: p.mrp,
          blurb: p.blurb ?? "",
          badge: p.badge ?? "",
          expressFromPrice: p.express_from_price ?? 0,
          deliveryCharge: p.delivery_charge ?? 0,
          delivery_charge: p.delivery_charge ?? 0,
          isActive: p.is_active ?? true,
          is_active: p.is_active ?? true,
          soldOut: isSoldOut,
          sold_out: isSoldOut,
          image: imgArr[0] ?? "",
          images: imgArr,
          variants: varArr,
        };
      });
    } catch (err) {
      console.error("Error in getProductsBySub:", err);
      throw err;
    }
  }

  static async getProductById(id: string) {
    try {
      let query = db
        .from("products")
        .select("*, category:categories(slug, name), sub:sub_categories(slug, name), images:product_images(*), variants:product_variants(*)");

      if (this.isUUID(id)) {
        query = query.eq("id", id);
      } else {
        query = query.eq("slug", id);
      }

      const { data: p, error } = await query.single();
      if (error || !p) return null;

      const imgArr = Array.isArray(p.images)
        ? p.images
            .sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((i: { url: string } | string) => (typeof i === "string" ? i : i.url))
        : [];
      const varArr = Array.isArray(p.variants)
        ? p.variants.map((v: { id?: string; size: string; available?: boolean; is_sold_out?: boolean; is_active?: boolean; stock_qty?: number }) => {
            const isAvail = v.available ?? ((v.is_active !== false) && (v.is_sold_out !== true) && ((v.stock_qty ?? 1) > 0));
            return {
              id: v.id,
              size: v.size,
              available: isAvail,
              stockQty: v.stock_qty ?? (isAvail ? 1 : 0),
            };
          })
        : [];

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description ?? "",
        category: p.category?.slug ?? p.category_id,
        sub: p.sub?.slug ?? p.sub_category_id,
        basePrice: p.base_price,
        base_price: p.base_price,
        price: p.base_price,
        mrp: p.mrp,
        blurb: p.blurb ?? "",
        badge: p.badge ?? "",
        expressFromPrice: p.express_from_price ?? 0,
        deliveryCharge: p.delivery_charge ?? 0,
        delivery_charge: p.delivery_charge ?? 0,
        isActive: p.is_active ?? true,
        is_active: p.is_active ?? true,
        soldOut: p.sold_out ?? false,
        sold_out: p.sold_out ?? false,
        image: imgArr[0] ?? "",
        images: imgArr,
        variants: varArr,
      };
    } catch {
      return null;
    }
  }

  static async getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
    try {
      const { data, error } = await db
        .from("products")
        .select("*, images:product_images(*)")
        .eq("category_id", categoryId)
        .neq("id", excludeId)
        .eq("is_active", true)
        .limit(limit);
      if (error || !data) return [];
      return data;
    } catch { return []; }
  }

  /** Reels using correct reel_products join table */
  static async getReels() {
    try {
      const { data, error } = await db
        .from("reels")
        .select("*, reel_products(sort_order, products(*, images:product_images(*)))")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error || !data || data.length === 0) return fallbackReels;
      return data.map((reel: any) => {
        const prods = Array.isArray(reel.reel_products)
          ? reel.reel_products
              .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((rp: any) => {
                const p = rp.products;
                if (!p) return null;
                const imgArr = Array.isArray(p.images)
                  ? p.images
                      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                      .map((i: any) => (typeof i === "string" ? i : i.url))
                  : [];
                return {
                  id: p.id,
                  name: p.name,
                  price: p.base_price ?? p.price ?? 2999,
                  base_price: p.base_price ?? p.price ?? 2999,
                  mrp: p.mrp ?? 0,
                  image: imgArr[0] || p.image || "",
                  images: imgArr,
                  category: p.category_id,
                  description: p.description ?? "",
                };
              })
              .filter(Boolean)
          : [];
        return {
          ...reel,
          products: prods,
        };
      });
    } catch { return fallbackReels; }
  }

  /** Testimonials using correct is_active column */
  static async getTestimonials() {
    try {
      const { data, error } = await db
        .from("testimonials")
        .select("*")
        .eq("is_active", true)                  // ← correct column name from schema
        .order("position", { ascending: true });
      if (error || !data || data.length === 0) return fallbackTestimonials;
      return data;
    } catch { return fallbackTestimonials; }
  }

  // ──── Store Settings ─────────────────────────────────────────────────

  static async getStoreSettings() {
    try {
      const { data, error } = await db
        .from("store_settings")
        .select("*")
        .single();
      if (error || !data) return {
        store_name: "Butterflies Tailoring",
        area: "Coimbatore",
        tagline: "Coimbatore's Fastest Ladies Dress Designer",
        gst_percent: 5,
        default_delivery_fee: 0,
        free_above: 3999,
        whatsapp_no: "919876543210",
      };
      return data;
    } catch {
      return {
        store_name: "Butterflies Tailoring",
        area: "Coimbatore",
        tagline: "Coimbatore's Fastest Ladies Dress Designer",
        gst_percent: 5,
        default_delivery_fee: 0,
        free_above: 3999,
        whatsapp_no: "919876543210",
      };
    }
  }

  static async updateStoreSettings(payload: Record<string, unknown>) {
    try {
      const { data, error } = await db
        .from("store_settings")
        .update(payload)
        .select()
        .single();
      if (error || !data) return payload;
      return data;
    } catch { return payload; }
  }

  // ──── Admin Catalogue Queries ─────────────────────────────────────────

  private static isUUID(val: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
  }

  private static async resolveCategoryUuid(catIdOrSlug?: string): Promise<string | null> {
    if (!catIdOrSlug) return null;
    if (this.isUUID(catIdOrSlug)) return catIdOrSlug;
    try {
      const { data } = await db.from("categories").select("id").eq("slug", catIdOrSlug).single();
      return data?.id ?? null;
    } catch { return null; }
  }

  private static async resolveSubCategoryUuid(subIdOrSlug?: string): Promise<string | null> {
    if (!subIdOrSlug) return null;
    if (this.isUUID(subIdOrSlug)) return subIdOrSlug;
    try {
      const { data } = await db.from("sub_categories").select("id").eq("slug", subIdOrSlug).single();
      return data?.id ?? null;
    } catch { return null; }
  }

  /** Uses products table with joined categories, sub_categories, images & variants */
  static async getAllProductsAdmin(filters?: { categorySlug?: string; subSlug?: string; search?: string; lowStockOnly?: boolean }) {
    try {
      let query = db
        .from("products")
        .select("*, category:categories(slug, name), sub:sub_categories(slug, name), images:product_images(*), variants:product_variants(*)");

      if (filters?.categorySlug) {
        const catUuid = await this.resolveCategoryUuid(filters.categorySlug);
        if (catUuid) query = query.eq("category_id", catUuid);
      }
      if (filters?.subSlug) {
        const subUuid = await this.resolveSubCategoryUuid(filters.subSlug);
        if (subUuid) query = query.eq("sub_category_id", subUuid);
      }
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error || !data) return [];

      return data.map((p) => {
        const imgArr = Array.isArray(p.images)
          ? p.images.sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: { url: string }) => i.url)
          : [];
        const varArr = Array.isArray(p.variants)
          ? p.variants.map((v: { id?: string; size: string; available?: boolean; is_sold_out?: boolean; is_active?: boolean; stock_qty?: number }) => {
              const isAvail = v.available ?? ((v.is_active !== false) && (v.is_sold_out !== true) && ((v.stock_qty ?? 1) > 0));
              return {
                id: v.id,
                size: v.size,
                available: isAvail,
                stockQty: v.stock_qty ?? (isAvail ? 1 : 0),
              };
            })
          : [];

        const isSoldOut = Boolean(
          p.sold_out ||
          (varArr.length > 0 && !varArr.some((v: { available: boolean; stockQty: number }) => v.available && (v.stockQty ?? 0) > 0))
        );

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description ?? "",
          category: p.category?.slug ?? p.category_id,
          sub: p.sub?.slug ?? p.sub_category_id,
          basePrice: p.base_price,
          mrp: p.mrp,
          blurb: p.blurb ?? "",
          badge: p.badge ?? "",
          expressFromPrice: p.express_from_price ?? 0,
          deliveryCharge: p.delivery_charge ?? 0,
          isActive: p.is_active ?? true,
          soldOut: isSoldOut,
          images: imgArr,
          variants: varArr,
        };
      });
    } catch { return []; }
  }

  static async getProductAdminById(productId: string) {
    try {
      let query = db
        .from("products")
        .select("*, category:categories(slug, name), sub:sub_categories(slug, name), images:product_images(*), variants:product_variants(*)");

      if (this.isUUID(productId)) {
        query = query.eq("id", productId);
      } else {
        query = query.eq("slug", productId);
      }

      const { data: p, error } = await query.single();
      if (error || !p) return null;

      const imgArr = Array.isArray(p.images)
        ? p.images.sort((a: { sort_order?: number }, b: { sort_order?: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: { url: string }) => i.url)
        : [];
      const varArr = Array.isArray(p.variants)
        ? p.variants.map((v: { id?: string; size: string; available?: boolean; is_sold_out?: boolean; is_active?: boolean; stock_qty?: number }) => {
            const isAvail = v.available ?? ((v.is_active !== false) && (v.is_sold_out !== true) && ((v.stock_qty ?? 1) > 0));
            return {
              id: v.id,
              size: v.size,
              available: isAvail,
              stockQty: v.stock_qty ?? (isAvail ? 1 : 0),
            };
          })
        : [];

      const isSoldOut = Boolean(
        p.sold_out ||
        (varArr.length > 0 && !varArr.some((v: { available: boolean; stockQty: number }) => v.available && (v.stockQty ?? 0) > 0))
      );

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description ?? "",
        category: p.category?.slug ?? p.category_id,
        sub: p.sub?.slug ?? p.sub_category_id,
        basePrice: p.base_price,
        mrp: p.mrp,
        blurb: p.blurb ?? "",
        badge: p.badge ?? "",
        expressFromPrice: p.express_from_price ?? 0,
        deliveryCharge: p.delivery_charge ?? 0,
        isActive: p.is_active ?? true,
        soldOut: isSoldOut,
        images: imgArr,
        variants: varArr,
      };
    } catch {
      return null;
    }
  }

  static async upsertProduct(productPayload: Record<string, unknown>) {
    try {
      let productId = String(productPayload.id || "");
      if (!this.isUUID(productId)) {
        // Try looking up product UUID by slug
        const { data: existing } = await db.from("products").select("id").eq("slug", productId).single();
        if (existing) productId = existing.id;
      }

      const catUuid = await this.resolveCategoryUuid(
        String(productPayload.categoryId || productPayload.category || "")
      );
      const subUuid = await this.resolveSubCategoryUuid(
        String(productPayload.subCategoryId || productPayload.sub || "")
      );

      const updateData: Record<string, unknown> = {};
      if (productPayload.name !== undefined) updateData.name = productPayload.name;
      if (productPayload.description !== undefined) updateData.description = productPayload.description;
      if (productPayload.blurb !== undefined) updateData.blurb = productPayload.blurb;
      if (productPayload.badge !== undefined) updateData.badge = productPayload.badge;
      if (productPayload.basePrice !== undefined) updateData.base_price = Number(productPayload.basePrice);
      if (productPayload.mrp !== undefined) updateData.mrp = Number(productPayload.mrp);

      if (updateData.base_price !== undefined && updateData.mrp !== undefined) {
        if (Number(updateData.mrp) < Number(updateData.base_price)) {
          throw new Error("MRP cannot be less than base price.");
        }
      }
      if (productPayload.expressFromPrice !== undefined) updateData.express_from_price = Number(productPayload.expressFromPrice);
      if (productPayload.deliveryCharge !== undefined) updateData.delivery_charge = Number(productPayload.deliveryCharge);
      if (productPayload.soldOut !== undefined) {
        updateData.sold_out = Boolean(productPayload.soldOut);
      } else if (Array.isArray(productPayload.variants) && productPayload.variants.length > 0) {
        const providedVariants = productPayload.variants as { available?: boolean; stockQty?: number }[];
        const allUnavailable = !providedVariants.some(v => v.available !== false && (v.stockQty === undefined || v.stockQty > 0));
        if (allUnavailable) {
          updateData.sold_out = true;
        }
      }
      if (productPayload.isActive !== undefined) updateData.is_active = Boolean(productPayload.isActive);
      if (catUuid) updateData.category_id = catUuid;
      if (subUuid) updateData.sub_category_id = subUuid;
      updateData.updated_at = new Date().toISOString();

      if (this.isUUID(productId)) {
        const { error } = await db
          .from("products")
          .update(updateData)
          .eq("id", productId);

        if (error) {
          const err = new Error(error.message || "Failed to update product");
          throw err;
        }

        // Handle variants update if provided
        if (Array.isArray(productPayload.variants)) {
          const providedVariants = productPayload.variants as { size: string; available?: boolean; stockQty?: number }[];
          const providedSizes = new Set(providedVariants.map(v => v.size));

          for (const v of providedVariants) {
            const isAvail = v.available !== false;
            const stockQty = v.stockQty !== undefined ? v.stockQty : (isAvail ? 1 : 0);
            const { error: variantError } = await db.from("product_variants").upsert({
              product_id: productId,
              size: v.size,
              is_active: isAvail,
              stock_qty: stockQty,
              updated_at: new Date().toISOString(),
            }, { onConflict: "product_id,size" });

            if (variantError) {
              console.error(`[CatalogueRepository] Error upserting variant (product: ${productId}, size: ${v.size}):`, variantError);
              throw new Error(`Failed to update product variant (${v.size}): ${variantError.message}`);
            }
          }

          // Mark omitted variants as inactive safely (non-destructive)
          const { data: existingVariants, error: fetchErr } = await db
            .from("product_variants")
            .select("id, size")
            .eq("product_id", productId);

          if (fetchErr) {
            console.error(`[CatalogueRepository] Error fetching existing variants (product: ${productId}):`, fetchErr);
            throw new Error(`Failed to verify existing variants: ${fetchErr.message}`);
          }

          if (existingVariants) {
            for (const ev of existingVariants) {
              if (!providedSizes.has(ev.size)) {
                const { error: deactivateErr } = await db
                  .from("product_variants")
                  .update({
                    is_active: false,
                    stock_qty: 0,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", ev.id);

                if (deactivateErr) {
                  console.error(`[CatalogueRepository] Error deactivating variant (${ev.size}):`, deactivateErr);
                  throw new Error(`Failed to deactivate omitted variant (${ev.size}): ${deactivateErr.message}`);
                }
              }
            }
          }
        }

        // Handle images update if provided
        if (Array.isArray(productPayload.images)) {
          // Filter out base64 images, keep valid URLs
          const validUrls = (productPayload.images as string[]).filter(url => url && !url.startsWith("data:"));
          const { error: delImgErr } = await db.from("product_images").delete().eq("product_id", productId);
          if (delImgErr) {
            console.error(`[CatalogueRepository] Error clearing images for product ${productId}:`, delImgErr);
            throw new Error(`Failed to update product images: ${delImgErr.message}`);
          }
          if (validUrls.length > 0) {
            const { error: insImgErr } = await db.from("product_images").insert(
              validUrls.map((url, sort_order) => ({
                product_id: productId,
                url,
                sort_order,
              }))
            );
            if (insImgErr) {
              console.error(`[CatalogueRepository] Error inserting images for product ${productId}:`, insImgErr);
              throw new Error(`Failed to insert product images: ${insImgErr.message}`);
            }
          }
        }

        const reFetched = await this.getProductAdminById(productId);
        if (reFetched) return reFetched;

        return {
          id: productId,
          name: String(productPayload.name || ""),
          description: String(productPayload.description || ""),
          blurb: String(productPayload.blurb || ""),
          badge: String(productPayload.badge || ""),
          category: String(productPayload.category || productPayload.categoryId || ""),
          sub: String(productPayload.sub || productPayload.subCategoryId || ""),
          basePrice: Number(productPayload.basePrice || 0),
          mrp: Number(productPayload.mrp || 0),
          expressFromPrice: Number(productPayload.expressFromPrice || 0),
          deliveryCharge: Number(productPayload.deliveryCharge || 0),
          isActive: Boolean(productPayload.isActive),
          soldOut: Boolean(productPayload.soldOut),
          images: Array.isArray(productPayload.images) ? productPayload.images : [],
          variants: Array.isArray(productPayload.variants) ? productPayload.variants : [],
        };
      } else {
        // Create fallback insert
        return await this.createDraftProduct(productPayload);
      }
    } catch (err) {
      throw err;
    }
  }

  static async createDraftProduct(payload: Record<string, unknown>) {
    try {
      let baseSlug = String(payload.slug || payload.id || payload.name || `design-${Date.now().toString(36)}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (!baseSlug) baseSlug = `design-${Date.now().toString(36)}`;

      let slugStr = baseSlug;
      let counter = 1;
      while (true) {
        const { data: existing } = await db.from("products").select("id").eq("slug", slugStr).single();
        if (!existing) break;
        slugStr = `${baseSlug}-${Date.now().toString(36).slice(-4)}-${counter}`;
        counter++;
      }

      const catUuid = await this.resolveCategoryUuid(String(payload.categoryId || payload.category || "blouse"));
      const subUuid = await this.resolveSubCategoryUuid(String(payload.subCategoryId || payload.sub || ""));

      if (!catUuid) {
        throw new Error("Invalid or missing category");
      }

      const basePrice = Math.max(1, Number(payload.basePrice || 1999));
      const rawMrp = Number(payload.mrp || 0);
      const mrp = rawMrp >= basePrice ? rawMrp : Math.round(basePrice * 1.38);

      const insertData: Record<string, unknown> = {
        slug: slugStr,
        name: String(payload.name || "New Design"),
        category_id: catUuid,
        sub_category_id: subUuid,
        description: String(payload.description || ""),
        blurb: String(payload.blurb || ""),
        badge: String(payload.badge || ""),
        base_price: basePrice,
        mrp: mrp,
        express_from_price: payload.expressFromPrice ? Number(payload.expressFromPrice) : 2299,
        delivery_charge: Number(payload.deliveryCharge ?? 0),
        sold_out: false,
        is_active: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      };

      const { data: product, error } = await db
        .from("products")
        .insert(insertData)
        .select()
        .single();

      if (error || !product) {
        throw new Error(error?.message || "Failed to create product record in database");
      }

      // Handle custom size variants with exact stock
      if (Array.isArray(payload.variants) && payload.variants.length > 0) {
        const variantsToInsert = (payload.variants as { size: string; available?: boolean; stockQty?: number }[]).map((v) => {
          const isAvail = v.available !== false;
          const stockQty = v.stockQty !== undefined ? v.stockQty : (isAvail ? 1 : 0);
          return {
            product_id: product.id,
            size: v.size,
            is_active: isAvail,
            stock_qty: stockQty,
          };
        });
        const { error: variantErr } = await db.from("product_variants").insert(variantsToInsert);
        if (variantErr) {
          console.error(`[CatalogueRepository] Error inserting draft variants:`, variantErr);
          throw new Error(`Failed to insert product variants: ${variantErr.message}`);
        }
      } else {
        // Default size seeding
        const defaultSizes = ["S", "M", "L"];
        const { error: defaultVarErr } = await db.from("product_variants").insert(
          defaultSizes.map((size) => ({
            product_id: product.id,
            size,
            is_active: true,
            stock_qty: 1,
          }))
        );
        if (defaultVarErr) {
          console.error(`[CatalogueRepository] Error inserting default draft variants:`, defaultVarErr);
          throw new Error(`Failed to insert default product variants: ${defaultVarErr.message}`);
        }
      }

      // Handle initial image insertion if URLs provided
      if (Array.isArray(payload.images) && payload.images.length > 0) {
        const validUrls = (payload.images as string[]).filter((u) => !u.startsWith("data:"));
        if (validUrls.length > 0) {
          await db.from("product_images").insert(
            validUrls.map((url, idx) => ({
              product_id: product.id,
              url,
              sort_order: idx,
            }))
          );
        }
      }

      const reFetched = await this.getProductAdminById(product.id);
      if (reFetched) return reFetched;

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description || "",
        category: String(payload.category || payload.categoryId || ""),
        sub: String(payload.sub || payload.subCategoryId || ""),
        basePrice: product.base_price,
        mrp: product.mrp,
        blurb: product.blurb || "",
        badge: product.badge || "",
        expressFromPrice: product.express_from_price || 0,
        deliveryCharge: product.delivery_charge ?? 0,
        isActive: product.is_active || false,
        soldOut: product.sold_out || false,
        images: Array.isArray(payload.images) ? payload.images : [],
        variants: Array.isArray(payload.variants) ? payload.variants : [],
      };
    } catch (err) {
      throw err;
    }
  }

  static async deleteProduct(id: string) {
    try {
      const pid = this.isUUID(id) ? id : (await db.from("products").select("id").eq("slug", id).single()).data?.id;
      if (pid) {
        await db.from("products").delete().eq("id", pid);
      }
    } catch { /* ignore */ }
    return true;
  }

  static async toggleVariantAvailability(variantId: string, available: boolean) {
    try {
      const { data, error } = await db
        .from("product_variants")
        .update({
          is_active: available,
          stock_qty: available ? 1 : 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", variantId)
        .select()
        .single();
      if (error || !data) return null;
      return data;
    } catch { return null; }
  }

  static async insertProductImageRecord(productId: string, imageUrl: string, sortOrder: number) {
    try {
      const pid = this.isUUID(productId) ? productId : (await db.from("products").select("id").eq("slug", productId).single()).data?.id;
      if (!pid) return null;
      const { data, error } = await db
        .from("product_images")
        .insert({ product_id: pid, url: imageUrl, sort_order: sortOrder })
        .select()
        .single();
      if (error || !data) return null;
      return data;
    } catch { return null; }
  }

  // ──── Reels Admin CRUD ───────────────────────────────────────────────

  static async getAllReelsAdmin() {
    try {
      const { data, error } = await db
        .from("reels")
        .select("*, reel_products(sort_order, product_id, products(*))")
        .order("position", { ascending: true });
      if (error || !data) return [];
      return data.map((r: any) => {
        const taggedProduct = r.reel_products?.[0]?.products || null;
        const productId = r.reel_products?.[0]?.product_id || taggedProduct?.id || "";
        return {
          id: r.id,
          title: r.title || "Studio reel",
          videoUrl: r.video_url || "",
          video_url: r.video_url || "",
          posterUrl: r.poster_url || "",
          poster_url: r.poster_url || "",
          position: r.position ?? 0,
          isActive: r.is_active ?? true,
          productId,
          product: taggedProduct,
          products: taggedProduct ? [taggedProduct] : [],
        };
      });
    } catch { return []; }
  }

  static async createReel(payload: Record<string, unknown>) {
    try {
      const title = String(payload.title || "Studio reel");
      const video_url = String(payload.videoUrl || payload.video_url || "");
      const poster_url = payload.posterUrl || payload.poster_url ? String(payload.posterUrl || payload.poster_url) : null;
      const position = typeof payload.position === "number" ? payload.position : 0;
      const productId = payload.productId || payload.product_id ? String(payload.productId || payload.product_id) : null;

      const { data: reel, error } = await db
        .from("reels")
        .insert({
          title,
          video_url,
          poster_url,
          position,
          is_active: true,
        })
        .select()
        .single();

      if (error || !reel) {
        console.error("[CatalogueRepository] createReel DB insert error:", error);
        throw new Error(`Failed to insert reel record into database: ${error?.message || "DB error"}`);
      }

      if (productId) {
        const { error: tagErr } = await db.from("reel_products").insert({
          reel_id: reel.id,
          product_id: productId,
          sort_order: 0,
        });
        if (tagErr) {
          console.error("[CatalogueRepository] tag product error:", tagErr);
        }
      }

      return {
        id: reel.id,
        title: reel.title,
        videoUrl: reel.video_url,
        video_url: reel.video_url,
        posterUrl: reel.poster_url,
        poster_url: reel.poster_url,
        position: reel.position,
        isActive: reel.is_active,
        productId: productId || "",
      };
    } catch (err) {
      console.error("[CatalogueRepository] createReel exception:", err);
      throw err;
    }
  }

  static async updateReel(id: string, payload: Record<string, unknown>) {
    try {
      const updateData: Record<string, unknown> = {};
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.videoUrl !== undefined || payload.video_url !== undefined) {
        updateData.video_url = payload.videoUrl || payload.video_url;
      }
      if (payload.posterUrl !== undefined || payload.poster_url !== undefined) {
        updateData.poster_url = payload.posterUrl || payload.poster_url;
      }
      if (payload.position !== undefined) updateData.position = payload.position;
      if (payload.isActive !== undefined || payload.is_active !== undefined) {
        updateData.is_active = payload.isActive ?? payload.is_active;
      }

      if (Object.keys(updateData).length > 0) {
        await db.from("reels").update(updateData).eq("id", id);
      }

      const productId = payload.productId || payload.product_id;
      if (productId && typeof productId === "string") {
        await this.tagProductsToReel(id, [productId]);
      }

      return { id, ...updateData };
    } catch (err) {
      console.error("[CatalogueRepository] updateReel exception:", err);
      throw err;
    }
  }

  static async deleteReel(id: string) {
    try {
      await db.from("reel_products").delete().eq("reel_id", id);
      await db.from("reels").delete().eq("id", id);
    } catch { /* ignore */ }
    return true;
  }

  static async tagProductsToReel(reelId: string, productIds: string[]) {
    try {
      // Clear existing tags first
      await db.from("reel_products").delete().eq("reel_id", reelId);
      if (productIds.length > 0) {
        await db.from("reel_products").insert(
          productIds.map((pid, idx) => ({ reel_id: reelId, product_id: pid, sort_order: idx }))
        );
      }
      return true;
    } catch { return false; }
  }

  // ──── Featured Slots ─────────────────────────────────────────────────

  static async getFeaturedSlots() {
    try {
      const { data, error } = await db
        .from("featured_slots")
        .select("sort_order, product:products(*, images:product_images(*))")
        .order("sort_order", { ascending: true });
      if (error || !data) return [];
      return data;
    } catch { return []; }
  }

  static async setFeaturedProducts(productIds: string[]) {
    try {
      // Delete all existing featured slots
      await db.from("featured_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (productIds.length > 0) {
        await db.from("featured_slots").insert(
          productIds.map((pid, idx) => ({ product_id: pid, sort_order: idx }))
        );
      }
      return true;
    } catch { return false; }
  }

  // ──── Admin Meta (sizes, colours, timelines) ─────────────────────────

  static async getAdminMeta() {
    try {
      const [sizes, colours, timelines, stages] = await Promise.all([
        db.from("sizes").select("*").order("position", { ascending: true }),
        db.from("colours").select("*").order("name", { ascending: true }),
        db.from("stitching_timelines").select("*").order("sort_order", { ascending: true }),
        db.from("order_stages").select("*").order("position", { ascending: true }),
      ]);
      return {
        sizes: sizes.data ?? [],
        colours: colours.data ?? [],
        timelines: timelines.data ?? [],
        order_stages: stages.data ?? [],
      };
    } catch {
      return {
        sizes: ["XS", "S", "M", "L", "XL", "XXL"].map((s) => ({ code: s, label: s, position: 0 })),
        colours: [],
        timelines: [
          { id: "1hr", label: "1-Hour Express", price_add: 500 },
          { id: "1day", label: "1-Day Delivery", price_add: 250 },
          { id: "3day", label: "3-Day Standard", price_add: 0 },
        ],
        order_stages: [],
      };
    }
  }
}
