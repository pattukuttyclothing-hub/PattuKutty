import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middleware.js";
import { catalogueRouter } from "./routes/catalogue.routes.js";
import requestsRouter from "./routes/requests.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { marketingRouter } from "./routes/marketing.routes.js";
import { customerRouter } from "./routes/customer.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { env } from "./config/env.js";

const app = express();

// ── Security & Parsing ────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: true, // Dynamically reflects request origin (e.g. pattukutty.pattukuttyclothing.workers.dev, localhost, etc.)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-File-Name",
      "X-Bucket-Name",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Length", "X-File-Name"],
  })
);
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(express.raw({ type: ["image/*", "video/*", "audio/*", "application/octet-stream"], limit: "100mb" }));

// ── DEV LOGGING MIDDLEWARE (Comment out lines 35-43 in production) ────
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[DEV LOG] ${req.method} ${req.originalUrl || req.url} -> Status: ${res.statusCode}`);
  });
  next();
});
// ── END DEV LOGGING MIDDLEWARE ──────────────────────────────────────────

// ── Health Check ──────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Butterflies Tailoring API Server",
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────
// Prefix all routes with /api/v1
app.use("/api/v1", authRouter);         // Admin Auth routes (/admin/login)
app.use("/api/v1", catalogueRouter);    // Storefront + Admin Catalogue + Reels + Featured
app.use("/api/v1", requestsRouter);     // Custom design requests (customer + admin)
app.use("/api/v1", ordersRouter);       // Orders (customer + admin)
app.use("/api/v1", marketingRouter);    // WhatsApp campaigns (admin)
app.use("/api/v1", customerRouter);     // Customer profile + addresses + reviews
app.use("/api/v1", dashboardRouter);    // Admin dashboard + profile

// ── 404 Catch-All (must come after all routes, before error handler) ──
app.use((_req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────
if (!process.env.CLOUDFLARE_WORKER && process.env.NODE_ENV !== "test") {
  const PORT = Number(env.PORT || 3001);
  app.listen(PORT, () => {
    console.log(`\n🦋 Butterflies Tailoring API Server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${env.NODE_ENV}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/v1/health\n`);
  });
}

export default app;
