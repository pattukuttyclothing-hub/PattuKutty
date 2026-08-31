import { Router } from "express";
import { RequestsController } from "../controllers/requests.controller.js";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Customer Request Routes
router.post("/requests/upload-media", optionalAuth, RequestsController.uploadMedia);
router.post("/requests", requireAuth, RequestsController.submitCustomRequest);
router.get("/requests", requireAuth, RequestsController.getCustomerRequests);
router.get("/requests/:id", requireAuth, RequestsController.getRequestById);
router.patch("/requests/:id/request-changes", requireAuth, RequestsController.requestChanges);
router.patch("/requests/:id/accept", requireAuth, RequestsController.acceptQuotation);
router.patch("/requests/:id/cancel", requireAuth, RequestsController.cancelCustomRequest);

// Admin Management Routes
router.get("/admin/requests", requireAuth, requireAdmin, RequestsController.getAllRequestsAdmin);
router.post("/admin/requests/:id/quote", requireAuth, requireAdmin, RequestsController.submitQuoteAdmin);
router.patch("/admin/requests/:id/design", requireAuth, requireAdmin, RequestsController.updateDesignAdmin);
router.patch("/admin/requests/:id/cancel", requireAuth, requireAdmin, RequestsController.cancelCustomRequestAdmin);
router.post("/admin/requests/:id/notify-whatsapp", requireAuth, requireAdmin, RequestsController.notifyWhatsAppQuote);
router.post("/admin/requests/:id/convert", requireAuth, requireAdmin, RequestsController.convertToOrderAdmin);

export default router;

