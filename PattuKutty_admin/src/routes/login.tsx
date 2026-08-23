import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { adminLogin } from "@/lib/api/auth";
import { toast } from "sonner";
import { storeInfo } from "@/data/boutique";

import logoHeader from "@/assets/LOGO -Header.png";

const title = "Admin Login — Pattu Kutty";
const description = "Sign in to access the Pattu Kutty Admin Console.";

type Search = { next?: string | undefined; returnTo?: string | undefined };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const rawNext = search["next"] || search["returnTo"];
    return {
      next: typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : undefined,
      returnTo: typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : undefined,
    };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { next, returnTo } = Route.useSearch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await adminLogin({ email: email.trim(), password });
      if (res.success && res.data?.token) {
        localStorage.setItem("butterflies_admin_token", res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem("butterflies_admin_refresh_token", res.data.refreshToken);
        }
        localStorage.setItem("butterflies_admin_user", JSON.stringify(res.data.user));
        toast.success("Signed in to Admin Console");
        const targetRoute = next || returnTo || "/";
        void navigate({ to: targetRoute });
      } else {
        const msg = res.message || "Invalid admin credentials";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <img src={logoHeader} alt="Pattu Kutty Logo" className="h-16 w-auto object-contain mb-2" />
          <h1 className="font-display text-2xl font-bold text-primary">
            {storeInfo.name}
          </h1>
          <p className="mt-1 text-xs tracking-[0.18em] font-medium text-accent uppercase">
            Admin Console Sign In
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Admin Email
              </label>
              <div className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pattukutty.com"
                  className="w-full rounded-2xl border border-border bg-background py-3 pr-4 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border bg-background py-3 pr-4 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Sign In to Admin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
