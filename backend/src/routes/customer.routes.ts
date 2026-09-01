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

import { z } from "zod";

const addressBodySchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").optional(),
  full_name: z.string().trim().min(1, "Full name is required").optional(),
  phone: z.string().transform((val) => val.replace(/\D/g, "")).pipe(z.string().regex(/^[0-9]{10,15}$/, "Valid mobile number (10-15 digits) is required")),
  line1: z.string().trim().min(3, "Address line 1 is required"),
  line2: z.string().trim().optional().nullable(),
  line_2: z.string().trim().optional().nullable(),
  landmark: z.string().trim().optional().nullable(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "PIN code must be a valid 6-digit number"),
  addressType: z.enum(["home", "work", "other"]).optional(),
  address_type: z.enum(["home", "work", "other"]).optional(),
  isDefault: z.boolean().optional(),
  is_default: z.boolean().optional(),
}).refine((data) => !!((data.fullName && data.fullName.trim().length > 0) || (data.full_name && data.full_name.trim().length > 0)), {
  message: "Full name is required",
  path: ["fullName"],
});

customerRouter.post("/customer/addresses", requireAuth, async (req, res, next) => {
  try {
    const customerId = (req as unknown as { user: { id: string } }).user.id;
    const parsed = addressBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      return;
    }
    const data = await CustomerService.createAddress(customerId, req.body as Record<string, unknown>);
    if (!data) {
      res.status(400).json({ success: false, message: "Invalid or incomplete address fields provided." });
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
