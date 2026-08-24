import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const isServer = typeof window === "undefined";

const globalForSupabase = globalThis as unknown as { __supabaseInstance?: SupabaseClient | null };

function createAdminSupabaseClient(): SupabaseClient | null {
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] : undefined);

  const SUPABASE_ANON_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.SUPABASE_ANON_KEY ||
    (typeof process !== "undefined" ? process.env["VITE_SUPABASE_ANON_KEY"] || process.env["SUPABASE_ANON_KEY"] : undefined);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("[Admin Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured.");
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    ...(isServer ? { realtime: { transport: class DummyWebSocket {} as any } } : {}),
  });
}

let _adminSupabaseInstance: SupabaseClient | null | undefined;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    if (_adminSupabaseInstance === undefined) {
      _adminSupabaseInstance = globalForSupabase.__supabaseInstance ?? createAdminSupabaseClient();
      if (!isServer && _adminSupabaseInstance) {
        globalForSupabase.__supabaseInstance = _adminSupabaseInstance;
      }
    }
    if (!_adminSupabaseInstance) {
      throw new Error(
        "Supabase client is not initialized. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Cloudflare Build Variables."
      );
    }
    return Reflect.get(_adminSupabaseInstance, prop, receiver);
  },
});
