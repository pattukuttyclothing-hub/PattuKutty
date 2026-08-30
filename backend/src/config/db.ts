import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getParsedEnv } from "./env.js";

let cachedDbClient: SupabaseClient | null = null;
let cachedAuthClient: SupabaseClient | null = null;
let lastDbKey: string | null = null;
let lastDbUrl: string | null = null;
let lastAuthKey: string | null = null;
let lastAuthUrl: string | null = null;

export function getDb(): SupabaseClient {
  const parsedEnv = getParsedEnv();
  const currentUrl = parsedEnv.SUPABASE_URL;
  const currentKey = parsedEnv.SUPABASE_SERVICE_ROLE_KEY || parsedEnv.SUPABASE_ANON_KEY || "";

  if (!cachedDbClient || lastDbKey !== currentKey || lastDbUrl !== currentUrl) {
    lastDbKey = currentKey;
    lastDbUrl = currentUrl;
    cachedDbClient = createClient(currentUrl, currentKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedDbClient;
}

export function getAuthClient(): SupabaseClient {
  const parsedEnv = getParsedEnv();
  const currentUrl = parsedEnv.SUPABASE_URL;
  const currentKey = parsedEnv.SUPABASE_ANON_KEY || parsedEnv.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!cachedAuthClient || lastAuthKey !== currentKey || lastAuthUrl !== currentUrl) {
    lastAuthKey = currentKey;
    lastAuthUrl = currentUrl;
    cachedAuthClient = createClient(currentUrl, currentKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedAuthClient;
}

export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol, receiver) {
    const client = getDb();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export const authClient = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol, receiver) {
    const client = getAuthClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

