import { Router } from "express";
import { CatalogueService } from "../services/catalogue.service.js";
import { requireAuth, requireAdmin, type AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { env } from "../config/env.js";
import { r2 } from "../config/r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { db } from "../config/db.js";
import { parseAndValidateUpload } from "../middlewares/upload.middleware.js";

export const catalogueRouter = Router();

// Helper to safely cast Express params (always string in practice)
const p = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC STOREFRONT ENDPOINTS (no auth required)
// ═══════════════════════════════════════════════════════════════════

catalogueRouter.get("/storefront/categories", async (_req, res, next) => {
  try {
    const data = await CatalogueService.getStorefrontCategories();
    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/hero-banners", async (_req, res, next) => {
  try {
    const data = await CatalogueService.getStorefrontHeroBanners();
    res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=1800");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/featured", async (_req, res, next) => {
  try {
    const data = await CatalogueService.getFeaturedProducts();
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/products", async (req, res, next) => {
  try {
    const { category, sub } = req.query as { category?: string; sub?: string };
    const data = await CatalogueService.getProductsBySub(category ?? "", sub ?? "");
    res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/products/:id", async (req, res, next) => {
  try {
    const product = await CatalogueService.getProductById(p(req.params.id));
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/products/:id/related", async (req, res, next) => {
  try {
    const { category } = req.query as { category?: string };
    const data = await CatalogueService.getRelatedProducts(category ?? "", p(req.params.id));
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/reels", async (_req, res, next) => {
  try {
    const data = await CatalogueService.getReels();
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/testimonials", async (_req, res, next) => {
  try {
    const data = await CatalogueService.getTestimonials();
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/storefront/settings", async (_req, res, next) => {
  try {
    const data = await CatalogueService.getStoreSettings();
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════
//  ADMIN PROTECTED ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

catalogueRouter.get("/admin/meta", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const data = await CatalogueService.getAdminMeta();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/admin/settings", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const data = await CatalogueService.getStoreSettings();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.patch("/admin/settings", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = await CatalogueService.updateStoreSettings(req.body as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.get("/admin/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { categorySlug, subSlug, search, lowStockOnly } = req.query as Record<string, string>;
    const data = await CatalogueService.getAllProductsAdmin({
      categorySlug,
      subSlug,
      search,
      lowStockOnly: lowStockOnly === "true",
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.post("/admin/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = await CatalogueService.createDraftProductAdmin(req.body as Record<string, unknown>);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.patch("/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = await CatalogueService.saveProductAdmin({ ...(req.body as Record<string, unknown>), id: p(req.params.id) });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.delete("/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await CatalogueService.deleteProductAdmin(p(req.params.id));
    res.json({ success: true, message: "Product deleted" });
  } catch (err) { next(err); }
});

catalogueRouter.patch("/admin/products/:id/variants/:variantId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { available } = req.body as { available: boolean };
    const data = await CatalogueService.toggleVariantAvailability(p(req.params.variantId), available);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.post("/admin/products/:id/images", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { url, sort_order } = req.body as { url: string; sort_order: number };
    const data = await CatalogueService.insertProductImage(p(req.params.id), url, sort_order ?? 0);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

// ──── Supabase Storage Upload ──────────────────────────────────────────

catalogueRouter.post("/admin/upload/product-image", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  console.log("[PRODUCT-IMAGE-UPLOAD] Request received");
  console.log(`[PRODUCT-IMAGE-UPLOAD] Auth User ID: ${req.user?.id || "NONE"} | Role: ${req.user?.role || "NONE"}`);

  try {
    const filePayload = await parseAndValidateUpload(req, "image");
    console.log(`[PRODUCT-IMAGE-UPLOAD] Multipart parsed: filename='${filePayload.fileName}', mime='${filePayload.mimeType}', size=${filePayload.buffer.length} bytes`);

    const extMatch = filePayload.fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : filePayload.mimeType.includes("png") ? ".png" : filePayload.mimeType.includes("webp") ? ".webp" : ".jpg";
    const filename = `products/${Date.now()}_${randomUUID().slice(0, 8)}${ext}`;
    console.log(`[PRODUCT-IMAGE-UPLOAD] Storage target bucket: 'product-images' | Path: '${filename}'`);

    console.log("[PRODUCT-IMAGE-UPLOAD] Supabase Storage upload: START");
    const { error } = await db.storage.from("product-images").upload(filename, filePayload.buffer, {
      contentType: filePayload.mimeType,
      upsert: true,
    });

    if (error) {
      console.error(`[PRODUCT-IMAGE-UPLOAD] Storage upload FAILED: message='${error.message}', name='${error.name}'`);
      const err = new Error(`Product image storage upload failed: ${error.message}`);
      (err as unknown as { statusCode: number }).statusCode = 500;
      throw err;
    }

    console.log("[PRODUCT-IMAGE-UPLOAD] Storage upload: SUCCESS");

    const { data: publicUrlData } = db.storage.from("product-images").getPublicUrl(filename);
    const url = publicUrlData?.publicUrl || `${env.SUPABASE_URL}/storage/v1/object/public/product-images/${filename}`;
    console.log(`[PRODUCT-IMAGE-UPLOAD] Generated Public URL: '${url}'`);

    /*
    // ── FUTURE CLOUDFLARE R2 UPLOAD ALTERNATIVE (UNCOMMENT WHEN R2 IS ACTIVE) ──
    // const url = await R2StorageService.uploadFile(
    //   "R2_PRODUCT_IMAGES",
    //   filename,
    //   filePayload.buffer,
    //   filePayload.mimeType
    // );
    */

    // Optional DB Record Insertion if productId is passed
    const targetProductId = (req.query?.productId || (req.body && typeof req.body === "object" ? req.body.productId : undefined)) as string | undefined;
    if (targetProductId && typeof targetProductId === "string") {
      console.log(`[PRODUCT-IMAGE-UPLOAD] Inserting product_images DB record for product '${targetProductId}'...`);
      const { error: dbError } = await db.from("product_images").insert({
        product_id: targetProductId,
        url,
        sort_order: 99,
      });

      if (dbError) {
        console.error(`[PRODUCT-IMAGE-UPLOAD] DB Insert FAILED: ${dbError.message}. Rolling back storage object...`);
        // Storage cleanup on DB failure to prevent orphaned objects
        await db.storage.from("product-images").remove([filename]);
        const err = new Error(`Database record creation for product image failed: ${dbError.message}`);
        (err as unknown as { statusCode: number }).statusCode = 500;
        throw err;
      }
      console.log("[PRODUCT-IMAGE-UPLOAD] DB Insert: SUCCESS");
    }

    res.json({ success: true, url, data: { url } });
  } catch (err) {
    console.error("[PRODUCT-IMAGE-UPLOAD] Error handler reached:", err);
    next(err);
  }
});

catalogueRouter.post("/admin/delete/product-image", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { imageUrl, productId } = (req.body || {}) as { imageUrl?: string; productId?: string };

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      res.status(400).json({ success: false, error: { message: "Image URL is required for deletion", statusCode: 400 } });
      return;
    }

    const trimmedUrl = imageUrl.trim();

    // 1. Extract relative path in product-images bucket
    let pathInBucket = trimmedUrl;
    if (trimmedUrl.includes("/product-images/")) {
      pathInBucket = trimmedUrl.split("/product-images/").pop() || trimmedUrl;
    } else if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      const urlObj = new URL(trimmedUrl);
      const parts = urlObj.pathname.split("/product-images/");
      if (parts.length > 1) {
        pathInBucket = parts[1];
      }
    }

    // Strip leading slashes to match Supabase Storage relative key format
    pathInBucket = pathInBucket.replace(/^\/+/, "");

    // 2. Remove file from Supabase Storage product-images bucket
    const { error: storageError } = await db.storage.from("product-images").remove([pathInBucket, `/${pathInBucket}`]);
    if (storageError) {
      console.error("Supabase Storage Delete Error (product-images):", storageError.message);
      res.status(500).json({
        success: false,
        error: { message: `Failed to remove product image from storage: ${storageError.message}`, statusCode: 500 },
      });
      return;
    }

    // 3. Remove DB record from product_images table if productId is provided
    if (productId && typeof productId === "string") {
      const { error: dbError } = await db.from("product_images").delete().eq("product_id", productId).eq("url", trimmedUrl);
      if (dbError) {
        console.error(`[CatalogueRouter] Failed to delete product_images row for product ${productId}:`, dbError.message);
      }
    }

    res.status(200).json({ success: true, message: "Product image deleted successfully" });
  } catch (err) {
    next(err);
  }
});

catalogueRouter.delete("/admin/delete/product-image", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const imageUrl = (req.body?.imageUrl || req.query.imageUrl) as string | undefined;
    const productId = (req.body?.productId || req.query.productId) as string | undefined;

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      res.status(400).json({ success: false, error: { message: "Image URL is required for deletion", statusCode: 400 } });
      return;
    }

    const trimmedUrl = imageUrl.trim();

    let pathInBucket = trimmedUrl;
    if (trimmedUrl.includes("/product-images/")) {
      pathInBucket = trimmedUrl.split("/product-images/").pop() || trimmedUrl;
    } else if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      const urlObj = new URL(trimmedUrl);
      const parts = urlObj.pathname.split("/product-images/");
      if (parts.length > 1) {
        pathInBucket = parts[1];
      }
    }

    const { error: storageError } = await db.storage.from("product-images").remove([pathInBucket]);
    if (storageError) {
      console.error("Supabase Storage Delete Error (product-images):", storageError.message);
      res.status(500).json({
        success: false,
        error: { message: `Failed to remove product image from storage: ${storageError.message}`, statusCode: 500 },
      });
      return;
    }

    if (productId && typeof productId === "string") {
      await db.from("product_images").delete().eq("product_id", productId).eq("url", trimmedUrl);
    }

    res.status(200).json({ success: true, message: "Product image deleted successfully" });
  } catch (err) {
    next(err);
  }
});

catalogueRouter.post("/customer/upload/request-media", requireAuth, async (req, res, next) => {
  try {
    const filename = `requests/${randomUUID()}`;
    await r2.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: filename,
      Body: req.body as Buffer,
      ContentType: (req.headers["content-type"] as string) ?? "application/octet-stream",
    }));
    const url = `${env.R2_CDN_URL}/${filename}`;
    res.json({ success: true, url });
  } catch (err) { next(err); }
});

// ──── Admin Reels ─────────────────────────────────────────────────────

catalogueRouter.post("/admin/upload/reel-video", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const filePayload = await parseAndValidateUpload(req, "video");
    const fileExt = filePayload.fileName.split(".").pop() || "mp4";
    const uniqueFileName = `${Date.now()}_${randomUUID().slice(0, 8)}.${fileExt}`;

    const { error: storageError } = await db.storage
      .from("reels-section-videos")
      .upload(uniqueFileName, filePayload.buffer, {
        contentType: filePayload.mimeType || "video/mp4",
        upsert: true,
      });

    if (storageError) {
      res.status(500).json({
        success: false,
        error: { message: `Failed to upload reel video to reels-section-videos storage: ${storageError.message}`, statusCode: 500 },
      });
      return;
    }

    // Generate signed URL (1-year validity) so video streams even if bucket is non-public
    const { data: signedUrlData } = await db.storage
      .from("reels-section-videos")
      .createSignedUrl(uniqueFileName, 31536000);

    const { data: publicUrlData } = db.storage
      .from("reels-section-videos")
      .getPublicUrl(uniqueFileName);

    const videoUrl = signedUrlData?.signedUrl || publicUrlData?.publicUrl || `${env.SUPABASE_URL}/storage/v1/object/public/reels-section-videos/${uniqueFileName}`;

    res.status(200).json({
      success: true,
      url: videoUrl,
      message: "Reel video uploaded to reels-section-videos bucket successfully.",
    });
  } catch (err) {
    next(err);
  }
});

catalogueRouter.get("/admin/reels", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const data = await CatalogueService.getAllReelsAdmin();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.post("/admin/reels", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = await CatalogueService.createReelAdmin(req.body as Record<string, unknown>);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.patch("/admin/reels/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = await CatalogueService.updateReelAdmin(p(req.params.id), req.body as Record<string, unknown>);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.delete("/admin/reels/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await CatalogueService.deleteReelAdmin(p(req.params.id));
    res.json({ success: true, message: "Reel deleted" });
  } catch (err) { next(err); }
});

catalogueRouter.post("/admin/reels/:id/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { product_ids } = req.body as { product_ids: string[] };
    await CatalogueService.tagProductsToReel(p(req.params.id), product_ids);
    res.json({ success: true, message: "Products tagged to reel" });
  } catch (err) { next(err); }
});

// ──── Admin Featured Slots ────────────────────────────────────────────

catalogueRouter.get("/admin/featured", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const data = await CatalogueService.getFeaturedSlots();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

catalogueRouter.post("/admin/featured", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { product_ids } = req.body as { product_ids: string[] };
    await CatalogueService.setFeaturedProducts(product_ids);
    res.json({ success: true, message: "Featured slots updated" });
  } catch (err) { next(err); }
});
