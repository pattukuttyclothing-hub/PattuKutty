import { useEffect, useState, useId } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, Lock, Mail, Phone, User as UserIcon } from "lucide-react";
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
  const { user, ready, signIn, signUp, signInWithGoogle, resendConfirmationEmail } = useAuth();

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
  const [registrationSuccessModalOpen, setRegistrationSuccessModalOpen] = useState(false);
  const [linkExpiredModalOpen, setLinkExpiredModalOpen] = useState(false);
  const [resendEmailInput, setResendEmailInput] = useState("");
  const [resendBusy, setResendBusy] = useState(false);

  // Detect URL hash or query errors (e.g. otp_expired or access_denied) on page load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const isExpired =
      hash.includes("otp_expired") ||
      search.includes("otp_expired") ||
      hash.includes("error_code=otp_expired") ||
      search.includes("error_code=otp_expired") ||
      hash.includes("Email+link+is+invalid+or+has+expired");

    if (isExpired) {
      setLinkExpiredModalOpen(true);
    }
  }, []);

  // Cross-tab authentication listener (detects when user confirms in another tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "pk_auth_broadcast" && e.newValue) {
        setInfoModalOpen(false);
        setLinkExpiredModalOpen(false);
        setRegistrationSuccessModalOpen(true);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Process authenticated user state & email confirmation redirects
  useEffect(() => {
    if (!ready || !user) return;
    const isConfirmationRedirect =
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token") || window.location.search.includes("code="));

    if (isConfirmationRedirect || infoModalOpen) {
      setInfoModalOpen(false);
      setLinkExpiredModalOpen(false);
      setRegistrationSuccessModalOpen(true);
    } else if (!registrationSuccessModalOpen && !linkExpiredModalOpen) {
      const stored = readStoredNext();
      void navigate({ to: (next ?? stored ?? "/") as string });
    }
  }, [ready, user, next, navigate, registrationSuccessModalOpen, infoModalOpen, linkExpiredModalOpen]);

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
                <li>Open your email inbox (or spam folder).</li>
                <li>Click <strong className="text-foreground">Confirm Email</strong> inside the message.</li>
                <li>Return to this tab or continue where you left off.</li>
              </ol>
            </div>
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
              >
                <ExternalLink className="h-4 w-4" /> Open Email Inbox
              </button>
              <button
                type="button"
                onClick={() => {
                  setInfoModalOpen(false);
                  setMode("signin");
                }}
                className="w-full rounded-full border border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                I'll Check My Email Later
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Zero False Success — Verified Registration Success Modal */}
      {registrationSuccessModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-card p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-foreground">
              Registration Confirmed!
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Thank you for registering with <strong className="text-foreground font-medium">Pattu Kutty</strong>. Your email has been verified successfully and your account is active.
            </p>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-foreground text-left">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">Account Active & Synced:</p>
              <p className="mt-1 text-muted-foreground">
                Your saved measurements, delivery address, and design requests are ready for your orders.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setRegistrationSuccessModalOpen(false);
                  const stored = readStoredNext();
                  const target = (next ?? stored ?? "/") as string;
                  void navigate({ to: target });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
              >
                {next?.includes("checkout") || readStoredNext()?.includes("checkout")
                  ? "Continue to Checkout"
                  : "Explore Collections"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Verification Link Expired Modal */}
      {linkExpiredModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Mail className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              Verification Link Expired
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This email confirmation link has expired or has already been used by an anti-spam scanner.
            </p>

            <div className="space-y-3 pt-2 text-left">
              <label className="block text-xs font-medium text-muted-foreground">
                Enter your email address to request a fresh confirmation link:
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={resendEmailInput || email || unconfirmedEmail}
                onChange={(e) => setResendEmailInput(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={resendBusy}
                onClick={async () => {
                  const targetEmail = (resendEmailInput || email || unconfirmedEmail).trim();
                  if (!targetEmail) {
                    toast.error("Please enter your email address to resend the confirmation link.");
                    return;
                  }
                  setResendBusy(true);
                  const res = await resendConfirmationEmail(targetEmail);
                  setResendBusy(false);
                  if (res.error) {
                    toast.error(res.error);
                  } else {
                    setLinkExpiredModalOpen(false);
                    setUnconfirmedEmail(targetEmail);
                    setInfoModalOpen(true);
                    toast.success("A new confirmation link has been sent to your inbox!");
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {resendBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Resend Confirmation Email
              </button>

              <button
                type="button"
                onClick={() => {
                  setLinkExpiredModalOpen(false);
                  setMode("signin");
                }}
                className="w-full rounded-full border border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Account Already Active? Sign In
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
