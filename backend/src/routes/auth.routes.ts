import { Router, type Request, type Response } from "express";
import { db, authClient } from "../config/db.js";

export const authRouter = Router();

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

// Clean up expired rate limit entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of loginAttempts.entries()) {
      if (now > entry.resetTime) {
        loginAttempts.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Middleware: Rate limit admin login attempts (5 attempts per 15 minutes per IP + email combination)
 */
function adminLoginRateLimiter(req: Request, res: Response, next: () => void): void {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : req.ip || "127.0.0.1";
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "anonymous";
  const key = `admin_login:${ip}:${email}`;
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 5;

  const entry = loginAttempts.get(key) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + WINDOW_MS;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minutes.`,
    });
    return;
  }

  entry.count += 1;
  loginAttempts.set(key, entry);
  next();
}

/**
 * POST /api/v1/admin/login
 * Admin Login route. Authenticates against Supabase Auth and checks admin_roles authorization.
 * Protected with application-level rate limiting (5 attempts per 15 mins per IP+email).
 */
authRouter.post("/admin/login", adminLoginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  try {
    // 1. Authenticate with Supabase Auth using isolated authClient
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      res.status(401).json({ success: false, message: "Invalid admin credentials" });
      return;
    }

    // 2. Verify Admin Authorization against admin_roles table
    const { data: roleData, error: roleError } = await db
      .from("admin_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .in("role", ["admin", "staff"])
      .maybeSingle();

    if (roleError || !roleData) {
      res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
      return;
    }

    // 3. Retrieve Admin Profile Details
    const { data: profileData } = await db
      .from("admin_profiles")
      .select("full_name")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const fullName =
      profileData?.full_name ||
      data.user.user_metadata?.full_name ||
      data.user.email?.split("@")[0] ||
      "Admin";

    // 4. Return successful response with real Supabase access token and refresh token
    res.status(200).json({
      success: true,
      data: {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName,
          role: roleData.role,
        },
      },
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ success: false, message: "Internal server error during authentication" });
  }
});

/**
 * POST /api/v1/admin/refresh
 * Admin Session Refresh route. Uses dedicated authClient (isolated from service-role db)
 * to exchange a refresh_token for a fresh access_token & refresh_token.
 */
authRouter.post("/admin/refresh", async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body || {};

  if (!refreshToken || typeof refreshToken !== "string") {
    res.status(401).json({ success: false, message: "Unauthorized: Refresh token missing" });
    return;
  }

  try {
    const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session || !data.user) {
      res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
      return;
    }

    // Verify Admin Authorization against admin_roles table
    const { data: roleData, error: roleError } = await db
      .from("admin_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .in("role", ["admin", "staff"])
      .maybeSingle();

    if (roleError || !roleData) {
      res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
      return;
    }

    const { data: profileData } = await db
      .from("admin_profiles")
      .select("full_name")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const fullName =
      profileData?.full_name ||
      data.user.user_metadata?.full_name ||
      data.user.email?.split("@")[0] ||
      "Admin";

    res.status(200).json({
      success: true,
      data: {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email || "",
          full_name: fullName,
          role: roleData.role,
        },
      },
    });
  } catch (err) {
    console.error("Admin Refresh Error:", err);
    res.status(401).json({ success: false, message: "Token refresh failed" });
  }
});
