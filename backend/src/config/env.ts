import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const envSchema = z.object({
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ALLOWED_ORIGINS: z.string().optional(),
  SUPABASE_URL: z.string().url().default("https://stxpfjevdmwwonczkccb.supabase.co"),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy"),
  // Cloudflare R2 storage
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default("butterflies-media"),
  R2_CDN_URL: z.string().default("https://media.butterfliestailoring.com"),
  // n8n webhook engine for WhatsApp broadcast dispatch
  N8N_WEBHOOK_URL: z.string().default("https://n8n.butterfliestailoring.com/webhook"),
  N8N_WEBHOOK_SECRET: z.string().default("dev-secret"),
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


