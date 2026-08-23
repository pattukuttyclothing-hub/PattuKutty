import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Compass, Home } from "lucide-react";
import { Navbar } from "@/components/boutique/Navbar";
import { Footer } from "@/components/boutique/Footer";
import { FloralMotif } from "@/components/boutique/Motifs";

/** Standard inner-page shell: solid navbar, padded main, footer. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar solid />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
    </div>
  );
}

export type Crumb = { label: string; to?: string; params?: Record<string, string> };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/" className="inline-flex items-center gap-1 hover:text-primary">
        <Home className="h-3.5 w-3.5" /> Home
      </Link>
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          {c.to ? (
            <Link
              to={c.to}
              params={c.params as never}
              className="hover:text-primary"
            >
              {c.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  crumbs,
  actions,
  compact = false,
  showMotif = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  compact?: boolean;
  showMotif?: boolean;
}) {
  return (
    <header
      className={`silk-texture relative border-b border-accent/25 bg-blush ${
        compact ? "py-5 sm:py-7" : "py-7 sm:py-10"
      }`}
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {crumbs ? (
          <div className="mb-3">
            <Breadcrumbs items={crumbs} />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-6">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="eyebrow">{eyebrow}</p>
            ) : null}
            <h1
              className={`font-display mt-2 leading-tight font-semibold text-foreground ${
                compact ? "text-2xl sm:text-[1.75rem]" : "text-[1.75rem] sm:text-4xl"
              }`}
            >
              {title}
            </h1>
            {showMotif ? <FloralMotif className="mt-3 h-4 w-28 text-accent" /> : null}
            {subtitle ? (
              <div className="text-balance-pretty mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {subtitle}
              </div>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
          ) : null}
        </div>
      </div>
      <div className="gold-divider absolute inset-x-0 bottom-0 opacity-70" />
    </header>
  );
}

/** Consistent content band used under every PageHeader. */
export function PageSection({
  children,
  width = "wide",
  className = "",
}: {
  children: ReactNode;
  width?: "narrow" | "medium" | "wide";
  className?: string;
}) {
  const max =
    width === "narrow" ? "max-w-3xl" : width === "medium" ? "max-w-5xl" : "max-w-7xl";
  return (
    <section className={`bg-background py-10 sm:py-14 lg:py-16 ${className}`}>
      <div className={`mx-auto ${max} px-4 sm:px-6`}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel = "Browse collections",
  actionTo = "/",
  icon,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="animate-fade-in mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft sm:p-10">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary ring-1 ring-accent/30">
        {icon ?? <Compass className="h-6 w-6" />}
      </div>
      <h2 className="font-display mt-5 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link
        to={actionTo}
        className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
