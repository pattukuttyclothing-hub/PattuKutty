import { Router } from "express";
import { CustomerService } from "../services/customer.service.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const customerRouter = Router();

// NOTE: requireAuth applied per-route (not router.use) to avoid catching 404s
// as a broad router.use() middleware would block the 404 catch-all in server.ts.

// ── Profile ──────────────────────────────────────────────────────────

customerRouter.get("/customer/profile", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const data = await CustomerService.getProfile(customerId);
    if (!data) {
      res.status(404).json({ success: false, message: "Customer profile not found" });
      return;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

customerRouter.patch("/customer/profile", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const data = await CustomerService.updateProfile(customerId, req.body as { full_name?: string; phone?: string });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── Addresses ─────────────────────────────────────────────────────────

customerRouter.get("/customer/addresses", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const data = await CustomerService.getAddresses(customerId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

customerRouter.post("/customer/addresses", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const data = await CustomerService.createAddress(customerId, req.body as Record<string, unknown>);
    if (!data) {
      res.status(500).json({ success: false, message: "Failed to create address" });
      return;
    }
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

customerRouter.delete("/customer/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await CustomerService.deleteAddress(id, customerId);
    res.json({ success: true, message: "Address deleted" });
  } catch (err) { next(err); }
});

customerRouter.patch("/customer/addresses/:id", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await CustomerService.updateAddress(id, customerId, req.body as Record<string, unknown>);
    if (!data) {
      res.status(404).json({ success: false, message: "Address not found or not owned by this customer" });
      return;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ── Reviews ───────────────────────────────────────────────────────────

customerRouter.post("/reviews", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const { product_id, rating, title, comment } = req.body as {
      product_id: string;
      rating: number;
      title: string;
      comment: string;
    };
    const data = await CustomerService.submitReview({ product_id, customer_id: customerId, rating, title, comment });
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});
