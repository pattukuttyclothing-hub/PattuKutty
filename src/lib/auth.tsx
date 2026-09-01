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
  resendConfirmationEmail: (email: string) => Promise<{ error?: string }>;
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
      .then(async ({ data }) => {
        if (!active) return;
        let userProfile = data as Profile | null;
        const meta = session?.user?.user_metadata as { full_name?: string; phone?: string } | undefined;
        const nameFromMeta = meta?.full_name?.trim();
        const phoneFromMeta = meta?.phone?.trim();

        if ((!userProfile || !userProfile.full_name || !userProfile.phone) && (nameFromMeta || phoneFromMeta)) {
          try {
            await supabase.from("customers").upsert({
              id: userId,
              full_name: nameFromMeta || userProfile?.full_name || null,
              phone: phoneFromMeta || userProfile?.phone || null,
              updated_at: new Date().toISOString(),
            });
            userProfile = {
              id: userId,
              full_name: nameFromMeta || userProfile?.full_name || null,
              phone: phoneFromMeta || userProfile?.phone || null,
            };
          } catch {
            /* ignore auto-sync error */
          }
        }

        setProfile(userProfile ?? { id: userId, full_name: nameFromMeta || null, phone: phoneFromMeta || null });

        // Broadcast signin event to sync other open tabs
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("pk_auth_broadcast", JSON.stringify({ userId, timestamp: Date.now() }));
          }
        } catch {
          /* ignore */
        }
      });
    return () => {
      active = false;
    };
  }, [userId, session]);

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
        const cleanPhone = phone.replace(/\D/g, "").trim();
        const prodWorkerUrl = "https://pattukutty.pattukuttyclothing.workers.dev";
        const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
        const isLocal = !currentOrigin || currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1");
        const redirectOrigin = isLocal ? prodWorkerUrl : currentOrigin;

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${redirectOrigin}/auth`,
            data: { full_name: fullName.trim(), phone: cleanPhone },
          },
        });

        if (error) {
          console.error("[Supabase Auth SignUp Error]", error);
          if ((error as any).status === 429 || error.message?.toLowerCase().includes("rate limit")) {
            return {
              error:
                "Email rate limit reached (Supabase limits default emails to 3 per hour). Please wait or try again shortly.",
            };
          }
          return { error: error.message };
        }

        // If user already exists in auth.users as unconfirmed, identities is empty array.
        // We force-trigger resend so Supabase sends the confirmation email immediately!
        const isUnconfirmedDuplicate = data?.user && (!data.user.identities || data.user.identities.length === 0);
        if (!data?.session && (isUnconfirmedDuplicate || data?.user?.id)) {
          try {
            await supabase.auth.resend({
              type: "signup",
              email: email.trim(),
              options: {
                emailRedirectTo: `${redirectOrigin}/auth`,
              },
            });
          } catch (resendErr) {
            console.warn("[Supabase Auth Resend Warning]", resendErr);
          }
        }

        if (data?.session && data?.user?.id) {
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

  const resendConfirmationEmail = useCallback(async (email: string) => {
    try {
      const prodWorkerUrl = "https://pattukutty.pattukuttyclothing.workers.dev";
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const isLocal = !currentOrigin || currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1");
      const redirectOrigin = isLocal ? prodWorkerUrl : currentOrigin;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${redirectOrigin}/auth`,
        },
      });

      if (error) {
        if ((error as any).status === 429 || error.message?.toLowerCase().includes("rate limit")) {
          return { error: "Please wait a minute before requesting another confirmation link." };
        }
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || "Failed to resend confirmation email." };
    }
  }, []);

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
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    try {
      localStorage.removeItem("butterflies-phone");
      localStorage.removeItem("butterflies-auth-next");
      localStorage.removeItem("pk_customer_orders");
      Object.keys(localStorage).forEach((key) => {
        if (key.endsWith("-auth-token") || key.includes("butterflies")) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
    } catch {
      /* ignore */
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
      resendConfirmationEmail,
    }),
    [session, profile, ready, signIn, signUp, signInWithGoogle, signOut, saveProfile, resendConfirmationEmail],
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
