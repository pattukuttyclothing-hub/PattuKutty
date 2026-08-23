import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string) || "";
const SUPABASE_ANON_KEY = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) || "";

const isServer = typeof window === "undefined";

const globalForSupabase = globalThis as unknown as { __supabaseInstance?: SupabaseClient };

// NOTE: This Supabase client is a leftover scaffold — the admin app authenticates
// entirely through the backend JWT API (/admin/login, /admin/refresh).
// autoRefreshToken and persistSession are both disabled to prevent this client
// from firing background token-refresh calls to Supabase using stale localStorage tokens.
export const supabase =
  globalForSupabase.__supabaseInstance ??
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    ...(isServer ? { realtime: { transport: class DummyWebSocket {} as any } } : {}),
  });

if (!isServer) {
  globalForSupabase.__supabaseInstance = supabase;
}
