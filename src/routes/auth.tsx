import { useEffect, useState, useId } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell } from "@/components/shared/Page";
import { LotusMotif } from "@/components/boutique/Motifs";
import { useAuth, readStoredNext } from "@/lib/auth";

const title = "Sign in — Pattu Kutty";
const description =
  "Sign in to Pattu Kutty, Coimbatore to save designs, send custom stitching requests, place orders and track delivery.";

type Search = { next: string | undefined; reason: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const rawNext = search["next"];
    const rawReason = search["reason"];
    return {
      next: typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : undefined,
      reason: typeof rawReason === "string" ? rawReason : undefined,
    };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function Field({
  icon,
  action,
  id,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const inputName = name || id || inputId;
  return (
    <label htmlFor={inputId} className="block">
      <span className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 text-muted-foreground">{icon}</span>
        <input
          id={inputId}
          name={inputName}
          {...props}
          className={`w-full rounded-2xl border border-border bg-background py-3.5 pl-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ${
            action ? "pr-11" : "pr-4"
          }`}
        />
        {action ? <span className="absolute right-3.5 flex items-center">{action}</span> : null}
      </span>
    </label>
  );
}

function AuthPage() {
  const { next, reason } = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready, signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    const stored = readStoredNext();
    void navigate({ to: (next ?? stored ?? "/") as string });
  }, [ready, user, next, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "signin") {
      const res = await signIn(email.trim(), password);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success("Signed in successfully!");
      }
    } else {
      const cleanPhone = phone.replace(/\D/g, "");
      if (!fullName.trim() || cleanPhone.length !== 10) {
        setBusy(false);
        setError("Please enter your name and a valid 10-digit phone number.");
        return;
      }
      const res = await signUp(email.trim(), password, fullName.trim(), cleanPhone);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else if (res.needsConfirmation) {
        setUnconfirmedEmail(email.trim());
        setInfoModalOpen(true);
        setNotice("Almost there — check your inbox and confirm your email to finish signing up.");
        toast.info("Email confirmation sent to your inbox.");
      } else {
        toast.success("Account created successfully!");
      }
    }
    setBusy(false);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your Account"
        title={mode === "signin" ? "Welcome back" : "Create your account"}
        compact
        subtitle={
          reason ??
          "Sign in to save designs, send stitching requests, place orders and track every delivery."
        }
        crumbs={[{ label: "Account" }]}
      />

      <section className="bg-background py-10 lg:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
            <div className="flex gap-2 rounded-full bg-secondary p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                  }}
                  className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "signup" ? (
                <>
                  <Field
                    id="fullName"
                    name="fullName"
                    icon={<UserIcon className="h-4 w-4" />}
                    placeholder="Full name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <Field
                    id="phone"
                    name="phone"
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="Phone number"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={15}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </>
              ) : null}
              <Field
                id="email"
                name="email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="Email address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Field
                id="password"
                name="password"
                icon={<Lock className="h-4 w-4" />}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 shrink-0" />
                    ) : (
                      <Eye className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                }
              />

              {error ? (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p className="rounded-2xl bg-secondary px-4 py-3 text-xs text-foreground">{notice}</p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>

          <aside className="h-fit rounded-3xl border border-border/70 bg-secondary/60 p-6 sm:p-8">
            <LotusMotif className="h-8 w-8 text-primary" />
            <h2 className="font-display mt-4 text-xl font-semibold text-foreground">
              Why an account?
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Your measurements & saved addresses stay ready for the next order.",
                "Track every stitching stage and BlueDart delivery scan live.",
                "Design requests, loved designs and bag stay synced on every device.",
                "Leave a review with photos once your outfit is delivered.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Email Verification Required Info Popup Modal */}
      {infoModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              Check Your Email to Confirm Registration
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We have sent an email confirmation link to{" "}
              <strong className="text-foreground">{unconfirmedEmail}</strong>.
            </p>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground text-left space-y-2">
              <p className="font-semibold text-primary">Next steps to activate your account:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                <li>Open your email inbox (and check spam folder if needed).</li>
                <li>Click the <strong className="text-foreground">Confirm Email</strong> link inside the mail.</li>
                <li>Return here to sign in with your password.</li>
              </ol>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setInfoModalOpen(false);
                  setMode("signin");
                }}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
              >
                Got it, I'll Check My Email
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
