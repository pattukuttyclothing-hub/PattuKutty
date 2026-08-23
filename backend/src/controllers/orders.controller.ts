// OrdersController is superseded by inline route handlers in orders.routes.ts
// Kept for backwards compatibility with any existing router references.
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { OrdersService } from "../services/orders.service.js";

export class OrdersController {
  static async placeOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.id ?? "guest-customer";
      const data = await OrdersService.placeOrder(customerId, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getCustomerOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.id ?? "guest-customer";
      const data = await OrdersService.getCustomerOrders(customerId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const customerId = req.user?.id ?? "guest-customer";
      const data = await OrdersService.getCustomerOrderById(id, customerId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async getAllOrdersAdmin(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await OrdersService.getAllOrdersAdmin();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async setOrderStageAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { stage, notes } = req.body as { stage: string; notes?: string };
      const adminId = req.user?.id ?? "system";
      const data = await OrdersService.setOrderStageAdmin(id, String(stage), adminId, notes);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  static async createShipmentAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { courier, awb, service, expected_date } = req.body as {
        courier: string;
        awb: string;
        service?: string;
        expected_date?: string;
      };
      const data = await OrdersService.createShipmentAdmin(id, { courier, awb, service, expected_date });
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
}
