import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID ?? "dev"}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "dev-key",
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "dev-secret",
  },
});
