import { Router } from "express";
import { MarketingService } from "../services/marketing.service.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

export const marketingRouter = Router();

// NOTE: requireAuth & requireAdmin applied per-route to avoid intercepting 404s

// Campaigns list (with stats)
marketingRouter.get("/admin/marketing/broadcasts", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const data = await MarketingService.getCampaigns();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Campaign analytics (funnel + district breakdown)
marketingRouter.get("/admin/marketing/broadcasts/:id/analytics", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await MarketingService.getCampaignById(id);
    if (!data) {
      res.status(404).json({ success: false, message: "Campaign not found" });
      return;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Real audience sizes from v_audience_sizes
marketingRouter.get("/admin/marketing/audiences", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const data = await MarketingService.getAudienceSizes();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Create broadcast campaign (product or custom) + invoke n8n
marketingRouter.post("/admin/marketing/broadcasts", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const data = await MarketingService.createBroadcastCampaign({
      ...req.body,
      sent_by: adminId,
    });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});
