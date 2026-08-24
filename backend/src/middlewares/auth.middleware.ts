import type { Request, Response, NextFunction } from "express";
import { db } from "../config/db.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "customer" | "admin" | "tailor_staff";
  };
}

/**
 * Checks whether explicit local development auth bypass is enabled.
 * Spec §5: NEVER bypass authentication implicitly based on NODE_ENV !== "production".
 *
 * ONLY the explicit ALLOW_DEV_AUTH_BYPASS=true flag enables bypass.
 * NODE_ENV alone MUST NOT open the gate — staging/preview deployments where
 * NODE_ENV is not "production" would otherwise serve every request as a hardcoded admin.
 */
function isDevBypassAllowed(): boolean {
  return process.env.ALLOW_DEV_AUTH_BYPASS === "true";
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (isDevBypassAllowed()) {
      req.user = { id: "cdd8a189-a7ce-4b44-86d6-03f65b0573c6", email: "admin@butterflies.com", role: "admin" };
      return next();
    }
    res.status(401).json({ success: false, error: { message: "Unauthorized: Missing token" } });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) {
      if (isDevBypassAllowed()) {
        req.user = { id: "cdd8a189-a7ce-4b44-86d6-03f65b0573c6", email: "admin@butterflies.com", role: "admin" };
        return next();
      }
      res.status(401).json({ success: false, error: { message: "Invalid or expired token" } });
      return;
    }

    let role: "customer" | "admin" | "tailor_staff" = "customer";
    const { data: roleData } = await db
      .from("admin_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .in("role", ["admin", "staff"])
      .maybeSingle();

    if (roleData) {
      role = roleData.role === "staff" ? "tailor_staff" : "admin";
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || "",
      role,
    };
    next();
  } catch {
    if (isDevBypassAllowed()) {
      req.user = { id: "cdd8a189-a7ce-4b44-86d6-03f65b0573c6", email: "admin@butterflies.com", role: "admin" };
      return next();
    }
    res.status(401).json({ success: false, error: { message: "Authentication failure" } });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data } = await db.auth.getUser(token);
    if (data?.user) {
      req.user = {
        id: data.user.id,
        email: data.user.email || "",
        role: "customer",
      };
    }
  } catch {
    /* ignore optional token decode failure */
  }
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "tailor_staff")) {
    res.status(403).json({ success: false, error: { message: "Forbidden: Admin access required" } });
    return;
  }
  next();
}
