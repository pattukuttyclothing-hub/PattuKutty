import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { MarketingService } from "../services/marketing.service.js";

export class MarketingController {
  static async createBroadcast(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user?.id ?? "system";
      const data = await MarketingService.createBroadcastCampaign({ ...req.body, sent_by: adminId });
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getCampaigns(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MarketingService.getCampaigns();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getAudienceSizes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MarketingService.getAudienceSizes();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}
