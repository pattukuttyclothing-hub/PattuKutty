import { Router } from "express";
import { DashboardService } from "../services/dashboard.service.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

export const dashboardRouter = Router();

// Single round-trip dashboard endpoint (4 KPIs + 3 rails)
dashboardRouter.get("/admin/dashboard", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const [summary, profile] = await Promise.all([
      DashboardService.getDashboard(),
      DashboardService.getAdminProfile(adminId),
    ]);
    res.json({ success: true, data: { ...summary, admin_profile: profile } });
  } catch (err) { next(err); }
});

// Admin profile endpoint
dashboardRouter.get("/admin/profile", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const adminId = (req as unknown as { user: { id: string } }).user.id;
    const data = await DashboardService.getAdminProfile(adminId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});
