import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Clapperboard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Scissors,
  Truck,
} from "lucide-react";
import logoHeader from "@/assets/LOGO -Header.png";
import { storeInfo } from "@/data/boutique";
import { fetchBlueDartHealthAdmin, type BlueDartHealthResult } from "@/lib/api/orders";

function BlueDartHealthPill() {
  const [health, setHealth] = useState<BlueDartHealthResult | null>(null);

  useEffect(() => {
    let active = true;
    void fetchBlueDartHealthAdmin()
      .then((res) => {
        if (active) setHealth(res);
      })
      .catch(() => {
        if (active) setHealth({ status: "error", mode: "sandbox", message: "Unavailable" });
      });
    return () => {
      active = false;
    };
  }, []);

  const isActive = health?.status === "active";
  const modeLabel = health?.mode === "production" ? "Prod" : "Sandbox";

  return (
    <div
      className="hidden lg:flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-2.5 py-1.5 text-[0.68rem] text-muted-foreground"
      title={health?.message || `Blue Dart Gateway Status (${modeLabel})`}
    >
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${
          isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
        }`}
      />
      <span className="truncate font-medium">
        Blue Dart: {isActive ? `Active (${modeLabel})` : "Connecting..."}
      </span>
    </div>
  );
}

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/requests", label: "Customer Requests", icon: Scissors },
  { to: "/orders", label: "Orders", icon: Truck },
  { to: "/reels", label: "Reels & Featured", icon: Clapperboard },
  { to: "/whatsapp", label: "WhatsApp Studio", icon: MessageCircle },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("butterflies_admin_token");
    localStorage.removeItem("butterflies_admin_refresh_token");
    localStorage.removeItem("butterflies_admin_user");
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Icon rail — visual navigation, no heavy text */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[76px] flex-col items-center gap-2 border-r border-border/80 bg-card py-4 transition-[width] duration-200 lg:w-[220px] lg:items-stretch lg:px-4">
        <Link to="/" className="mb-4 block rounded-2xl p-1 transition-opacity hover:opacity-90">
          <div className="hidden lg:flex flex-col items-start gap-1.5 px-1">
            <img
              src={logoHeader}
              alt="Pattu Kutty Logo"
              className="h-10 w-auto object-contain shrink-0 max-w-[170px]"
            />
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-secondary px-2.5 py-0.5 text-[0.58rem] font-semibold tracking-[0.2em] text-primary uppercase shadow-sm">
              ✦ Admin Portal
            </span>
          </div>
          <div className="flex lg:hidden items-center justify-center">
            <img
              src={logoHeader}
              alt="Pattu Kutty Logo"
              className="h-9 w-auto object-contain shrink-0"
            />
          </div>
        </Link>

        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact ?? false }}
              activeProps={{
                className: "bg-secondary text-primary shadow-soft",
              }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors lg:justify-start"
              title={n.label}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden text-sm font-medium lg:block">{n.label}</span>
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col items-center px-1 lg:items-stretch lg:px-3 space-y-3">
          <BlueDartHealthPill />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 rounded-2xl p-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 lg:w-full lg:justify-start lg:px-3 lg:py-2.5"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden text-sm font-medium lg:block">Sign Out</span>
          </button>
          <p className="hidden text-[0.62rem] leading-relaxed text-muted-foreground lg:block">
            Catalogue, quotations and order stages shown here are what the storefront displays.
          </p>
        </div>
      </aside>

      <div className="pl-[76px] lg:pl-[220px]">{children}</div>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-blush">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-7 sm:px-6">
        <div>
          {eyebrow ? (
            <p className="text-[0.65rem] font-semibold tracking-[0.3em] text-primary uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display mt-1.5 text-2xl font-semibold text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function StockPill({ stock, threshold = 3 }: { stock: number; threshold?: number }) {
  const tone =
    stock === 0
      ? "bg-destructive/12 text-destructive border-destructive/35"
      : stock <= threshold
        ? "bg-accent/25 text-accent-foreground border-accent/60"
        : "bg-secondary text-primary border-primary/25";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {stock === 0 ? "Out of stock" : `${stock} in stock`}
    </span>
  );
}
