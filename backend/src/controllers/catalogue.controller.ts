import type { Request, Response, NextFunction } from "express";
import { CatalogueService } from "../services/catalogue.service.js";

export class CatalogueController {
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CatalogueService.getStorefrontCategories();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getHeroBanners(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CatalogueService.getStorefrontHeroBanners();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getFeaturedProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CatalogueService.getFeaturedProducts();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getProductsBySubCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = String(req.query.category || "");
      const sub = String(req.query.sub || "");
      const data = await CatalogueService.getProductsBySub(category, sub);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const data = await CatalogueService.getProductById(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAllProductsAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CatalogueService.getAllProductsAdmin();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async saveProductAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CatalogueService.saveProductAdmin(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteProductAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await CatalogueService.deleteProductAdmin(id);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async getReels(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CatalogueService.getReels();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTestimonials(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await CatalogueService.getTestimonials();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
