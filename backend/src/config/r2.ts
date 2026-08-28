import { S3Client } from "@aws-sdk/client-s3";
import { getParsedEnv } from "./env.js";

let cachedR2Client: S3Client | null = null;
let lastR2AccountId: string | null = null;

export function getR2Client(): S3Client {
  const parsedEnv = getParsedEnv();
  const accountId = parsedEnv.CLOUDFLARE_R2_ACCOUNT_ID ?? "dev";

  if (!cachedR2Client || lastR2AccountId !== accountId) {
    lastR2AccountId = accountId;
    cachedR2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: parsedEnv.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "dev-key",
        secretAccessKey: parsedEnv.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "dev-secret",
      },
    });
  }
  return cachedR2Client;
}

export const r2 = new Proxy({} as S3Client, {
  get(_target, prop: string | symbol, receiver) {
    const client = getR2Client();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

