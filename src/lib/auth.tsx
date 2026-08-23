import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export type Profile = { id: string; full_name: string | null; phone: string | null };

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: (nextPath?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  saveProfile: (patch: { full_name?: string; phone?: string }) => Promise<void>;
};

const Ctx = createContext<AuthValue | null>(null);

const NEXT_KEY = "butterflies-auth-next";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      if (next?.access_token) {
        localStorage.setItem("butterflies_customer_token", next.access_token);
      } else if (next === null) {
        localStorage.removeItem("butterflies_customer_token");
      }
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.access_token) {
        localStorage.setItem("butterflies_customer_token", data.session.access_token);
      }
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let active = true;
    void supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile((data as Profile | null) ?? { id: userId, full_name: null, phone: null });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.toLowerCase().includes("invalid")
        ? "Invalid login credentials"
        : error.message;
      return { error: msg };
    }
    return {};
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, phone: string) => {
      try {
        const cleanPhone = phone.trim();
        if (cleanPhone) {
          const { data: existingPhone } = await supabase
            .from("customers")
            .select("id")
            .eq("phone", cleanPhone)
            .maybeSingle();

          if (existingPhone) {
            return {
              error:
                "An account with this phone number already exists. Please sign in instead.",
            };
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: fullName, phone: cleanPhone },
          },
        });

        if (error) {
          if (error.message?.toLowerCase().includes("database error saving new user")) {
            return {
              error:
                "An account with this email or phone number already exists. Please sign in instead.",
            };
          }
          if ((error as any).status === 429 || error.message?.toLowerCase().includes("rate limit")) {
            return {
              error:
                "Too many signup requests sent in a short time. Please wait a minute and try again.",
            };
          }
          return { error: error.message };
        }

        if (data?.user?.id) {
          try {
            await supabase.from("customers").upsert({
              id: data.user.id,
              full_name: fullName.trim() || null,
              phone: cleanPhone || null,
              updated_at: new Date().toISOString(),
            });
          } catch {
            /* profile insert catch */
          }
        }
        return { needsConfirmation: !data.session };
      } catch (err: any) {
        return { error: err?.message || "An unexpected error occurred during signup." };
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async (nextPath?: string) => {
    try {
      if (nextPath) window.sessionStorage.setItem(NEXT_KEY, nextPath);
    } catch {
      /* ignore */
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return { error: String(result.error) };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setProfile(null);
    setSession(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("butterflies_customer_token");
        localStorage.removeItem("butterflies-custom-requests");
        localStorage.removeItem("butterflies-cart");
        localStorage.removeItem("butterflies-phone");
        localStorage.removeItem("butterflies-auth-next");
        Object.keys(localStorage).forEach((key) => {
          if (key.endsWith("-auth-token") || key.includes("butterflies")) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const saveProfile = useCallback(
    async (patch: { full_name?: string; phone?: string }) => {
      if (!userId) return;
      await supabase.from("customers").upsert({ id: userId, ...patch, updated_at: new Date().toISOString() });
      setProfile((prev) => ({ id: userId, full_name: null, phone: null, ...prev, ...patch }));
    },
    [userId],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      ready,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      saveProfile,
    }),
    [session, profile, ready, signIn, signUp, signInWithGoogle, signOut, saveProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const readStoredNext = () => {
  try {
    const v = window.sessionStorage.getItem(NEXT_KEY);
    window.sessionStorage.removeItem(NEXT_KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
};

/**
 * Returns a guard for any action that needs a signed-in customer
 * (add to cart, love a design, send a design request, checkout).
 * When signed out it sends the shopper to /auth and brings them back.
 */
export function useAuthGate() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return useCallback(
    (action: () => void, options?: { reason?: string; next?: string }) => {
      if (user) {
        action();
        return true;
      }
      if (!ready) return false;
      void navigate({
        to: "/auth",
        search: { next: options?.next ?? pathname, reason: options?.reason },
      });
      return false;
    },
    [user, ready, navigate, pathname],
  );
}
