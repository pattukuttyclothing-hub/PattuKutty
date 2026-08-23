import { CatalogueRepository } from "../repositories/catalogue.repository.js";

export class CatalogueService {
  // ──── Storefront Public ───────────────────────────────────────────────

  static async getStorefrontCategories() {
    return await CatalogueRepository.getCategories();
  }

  static async getStorefrontHeroBanners() {
    return await CatalogueRepository.getHeroBanners();
  }

  static async getFeaturedProducts() {
    return await CatalogueRepository.getFeaturedProducts();
  }

  static async getProductsBySub(categoryId: string, subCategoryId: string) {
    return await CatalogueRepository.getProductsBySub(categoryId, subCategoryId);
  }

  static async getProductById(id: string) {
    const product = await CatalogueRepository.getProductById(id);
    if (!product) {
      const err = new Error("Product not found");
      (err as unknown as { statusCode: number }).statusCode = 404;
      throw err;
    }
    return product;
  }

  static async getRelatedProducts(categoryId: string, excludeId: string) {
    return await CatalogueRepository.getRelatedProducts(categoryId, excludeId);
  }

  static async getReels() {
    return await CatalogueRepository.getReels();
  }

  static async getTestimonials() {
    return await CatalogueRepository.getTestimonials();
  }

  static async getStoreSettings() {
    return await CatalogueRepository.getStoreSettings();
  }

  // ──── Admin Catalogue ─────────────────────────────────────────────────

  static async getAllProductsAdmin(filters?: { categorySlug?: string; subSlug?: string; search?: string; lowStockOnly?: boolean }) {
    return await CatalogueRepository.getAllProductsAdmin(filters);
  }

  static async createDraftProductAdmin(payload: Record<string, unknown>) {
    const product = await CatalogueRepository.createDraftProduct(payload);
    if (!product) {
      const err = new Error("Failed to create product draft");
      (err as unknown as { statusCode: number }).statusCode = 500;
      throw err;
    }
    return product;
  }

  static async saveProductAdmin(productPayload: Record<string, unknown>) {
    return await CatalogueRepository.upsertProduct(productPayload);
  }

  static async deleteProductAdmin(id: string) {
    return await CatalogueRepository.deleteProduct(id);
  }

  static async toggleVariantAvailability(variantId: string, available: boolean) {
    return await CatalogueRepository.toggleVariantAvailability(variantId, available);
  }

  static async insertProductImage(productId: string, imageUrl: string, sortOrder: number) {
    return await CatalogueRepository.insertProductImageRecord(productId, imageUrl, sortOrder);
  }

  // ──── Admin Reels ─────────────────────────────────────────────────────

  static async getAllReelsAdmin() {
    return await CatalogueRepository.getAllReelsAdmin();
  }

  static async createReelAdmin(payload: Record<string, unknown>) {
    return await CatalogueRepository.createReel(payload);
  }

  static async updateReelAdmin(id: string, payload: Record<string, unknown>) {
    return await CatalogueRepository.updateReel(id, payload);
  }

  static async deleteReelAdmin(id: string) {
    return await CatalogueRepository.deleteReel(id);
  }

  static async tagProductsToReel(reelId: string, productIds: string[]) {
    return await CatalogueRepository.tagProductsToReel(reelId, productIds);
  }

  // ──── Admin Featured Slots ────────────────────────────────────────────

  static async getFeaturedSlots() {
    return await CatalogueRepository.getFeaturedSlots();
  }

  static async setFeaturedProducts(productIds: string[]) {
    return await CatalogueRepository.setFeaturedProducts(productIds);
  }

  // ──── Admin Settings & Meta ───────────────────────────────────────────

  static async updateStoreSettings(payload: Record<string, unknown>) {
    return await CatalogueRepository.updateStoreSettings(payload);
  }

  static async getAdminMeta() {
    return await CatalogueRepository.getAdminMeta();
  }
}
