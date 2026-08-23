import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { RequestsService } from "../services/requests.service.js";
import { parseAndValidateUpload } from "../middlewares/upload.middleware.js";

function createAuthError(): Error {
  const err = new Error("Please log in to submit or view design requests.");
  (err as unknown as { statusCode: number }).statusCode = 401;
  return err;
}

export class RequestsController {
  static async submitCustomRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        throw createAuthError();
      }
      const data = await RequestsService.submitCustomRequest(customerId, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getCustomerRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        throw createAuthError();
      }
      const data = await RequestsService.getCustomerRequests(customerId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const customerId = req.user?.id;
      if (!customerId) {
        throw createAuthError();
      }
      const data = await RequestsService.getRequestById(id, customerId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async requestChanges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const customerId = req.user?.id;
      if (!customerId) {
        throw createAuthError();
      }
      const { note } = req.body;
      const data = await RequestsService.requestChanges(id, customerId, note);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async cancelCustomRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const customerId = req.user?.id;
      if (!customerId) {
        throw createAuthError();
      }
      const { reason } = req.body;
      const data = await RequestsService.cancelCustomRequest(id, customerId, reason);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async cancelCustomRequestAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason } = req.body;
      const result = await RequestsService.cancelCustomRequestAdmin(id, reason);
      res.json({ success: true, data: result.request, whatsapp: result.whatsapp });
    } catch (err) {
      next(err);
    }
  }

  static async getAllRequestsAdmin(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await RequestsService.getAllRequestsAdmin();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async submitQuoteAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const adminUserId = req.user?.id || "admin-user";
      const result = await RequestsService.submitQuoteAdmin(id, adminUserId, req.body);
      res.json({ success: true, data: result, whatsapp: result.whatsapp });
    } catch (err) {
      next(err);
    }
  }

  static async notifyWhatsAppQuote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await RequestsService.notifyWhatsAppQuote(id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async convertToOrderAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const adminUserId = req.user?.id || "admin-user";
      const data = await RequestsService.convertToOrder(id, adminUserId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async uploadMedia(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bucketHeader = (req.headers["x-bucket-name"] as string) || (req.query["bucket"] as string) || req.body?.bucket;
      const bucketType = String(bucketHeader || "").toLowerCase().includes("audio") ? "audio" : "image";

      const filePayload = await parseAndValidateUpload(req, bucketType);
      const publicUrl = await RequestsService.uploadMediaPayload(filePayload, bucketType);

      res.json({ success: true, url: publicUrl, publicUrl });
    } catch (err) {
      next(err);
    }
  }
}

