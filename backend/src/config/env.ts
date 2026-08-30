import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const envSchema = z.object({
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ALLOWED_ORIGINS: z.string().optional(),
  SUPABASE_URL: z.string().url().default("https://tfdpnrdnoxriwdbzuxrv.supabase.co"),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // Cloudflare R2 storage
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default("butterflies-media"),
  R2_CDN_URL: z.string().default("https://media.butterfliestailoring.com"),
  // n8n webhook engine for WhatsApp broadcast dispatch
  N8N_WEBHOOK_URL: z.string().default("https://n8n.butterfliestailoring.com/webhook"),
  N8N_WEBHOOK_SECRET: z.string().optional(),
  // Razorpay Gateway
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  // Blue Dart Courier — credentials obtained from Blue Dart account portal
  // Leave empty in development; backend returns a config error when missing
  BLUEDART_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  BLUEDART_TIMEOUT_MS: z.coerce.number().default(10000),
  BLUEDART_CLIENT_ID: z.string().optional(),
  BLUEDART_CLIENT_SECRET: z.string().optional(),
  BLUEDART_API_KEY: z.string().optional(),
  BLUEDART_API_SECRET: z.string().optional(),
  BLUEDART_LOGIN_ID: z.string().optional(),
  BLUEDART_LICENSE_KEY: z.string().optional(),
  BLUEDART_LICENCE_KEY: z.string().optional(),
  BLUEDART_API_TYPE: z.string().default("S"),
  BLUEDART_API_URL: z.string().default("https://netconnect.bluedart.com"),
  BLUEDART_AUTH_BASE_URL: z.string().optional(),
  BLUEDART_WAYBILL_BASE_URL: z.string().optional(),
  BLUEDART_PICKUP_BASE_URL: z.string().optional(),
  BLUEDART_TRACKING_BASE_URL: z.string().optional(),
  BLUEDART_CANCEL_PICKUP_BASE_URL: z.string().optional(),
  BLUEDART_PRODUCT_BASE_URL: z.string().optional(),
  BLUEDART_ALLOW_PRODUCTION_TESTS: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .default("false"),
  // COD Guardrails
  COD_MAX_ORDER_VALUE: z.coerce.number().default(15000),
  // Blue Dart product codes — confirm with your account representative
  BLUEDART_PREPAID_PRODUCT_CODE: z.string().default("A"),   // e.g. "A" = Dart Apex
  BLUEDART_COD_PRODUCT_CODE: z.string().optional(),          // e.g. "D" = COD — confirm with BD
  BLUEDART_ORIGIN_AREA: z.string().optional(),               // e.g. "CJB" for Coimbatore
  BLUEDART_CUSTOMER_CODE: z.string().optional(),             // assigned by Blue Dart
});

export type EnvType = z.infer<typeof envSchema>;

export function getParsedEnv(): EnvType {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return result.data;
  }
  return envSchema.parse({});
}

export const env: EnvType = new Proxy({} as EnvType, {
  get(_target, prop: string | symbol) {
    const currentEnv = getParsedEnv();
    return (currentEnv as Record<string, unknown>)[prop as string];
  },
});

const DEFAULT_ALLOWED_ORIGINS = [
  "https://pattukutty.pattukuttyclothing.workers.dev",
  "https://pattukutty-admin.pattukuttyclothing.workers.dev",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
];

export function getAllowedOrigins(allowedOriginsStr?: string): string[] {
  const set = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  if (allowedOriginsStr && typeof allowedOriginsStr === "string") {
    allowedOriginsStr
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => set.add(o));
  }
  return Array.from(set);
}

export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return false;
  const allowedList = getAllowedOrigins(process.env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS);
  if (allowedList.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith(".pattukuttyclothing.workers.dev")) return true;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
  } catch {
    /* ignore invalid URL format */
  }
  return false;
}



