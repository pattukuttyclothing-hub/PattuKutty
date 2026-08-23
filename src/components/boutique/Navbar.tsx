import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Menu,
  X,
  MessageCircle,
  ShoppingBag,
  Heart,
  Scissors,
  Package,
  UserRound,
  LogOut,
} from "lucide-react";
import { storeInfo, waLink } from "@/data/boutique";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useRequests } from "@/lib/requests";
import { useOrders } from "@/lib/orders";
import { useAuth } from "@/lib/auth";
import { BrandLockup } from "./Brand";

const links = [
  { label: "Home", href: "/#home" },
  { label: "Collections", href: "/#collections" },
  { label: "Customise", href: "/#customise" },
  { label: "Reels", href: "/#reels" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/#faq" },
  { label: "Reviews", href: "/#reviews" },
];

function IconLink({
  to,
  label,
  count,
  children,
}: {
  to: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <Link
        to={to}
        aria-label={count ? `${label} (${count})` : label}
        className="relative grid h-11 w-11 place-items-center rounded-full border border-transparent text-foreground/80 transition-all duration-300 hover:border-accent/50 hover:bg-secondary hover:text-primary active:scale-95"
      >
        {children}
        {count && count > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.62rem] leading-none font-semibold text-primary-foreground ring-2 ring-background">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
      <span className="pointer-events-none absolute top-full left-1/2 z-40 mt-2 hidden -translate-x-1/2 translate-y-1 rounded-full border border-border bg-popover px-3 py-1 text-[0.68rem] font-medium whitespace-nowrap text-foreground opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:block">
        {label}
      </span>
    </div>
  );
}

export function Navbar({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(solid);
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { requests } = useRequests();
  const { count: orderCount } = useOrders();
  const { user, profile, signOut } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-accent/25 bg-background/85 shadow-soft backdrop-blur-xl"
          : "border-b border-transparent bg-background/60 backdrop-blur-md"
      }`}
    >
      <nav
        className={`mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 transition-all duration-500 sm:px-6 lg:grid-cols-[auto_1fr_auto] ${
          scrolled ? "py-1.5" : "py-2.5"
        }`}
      >
        <Link to="/" aria-label="Pattu Kutty — home" className="flex min-w-0 items-center">
          <BrandLockup
            priority
            className={`w-auto max-w-[52vw] transition-all duration-500 ${
              scrolled ? "h-9 sm:h-11" : "h-11 sm:h-14"
            }`}
          />
          <span className="sr-only">Pattu Kutty · பட்டு குட்டி</span>
        </Link>


        <ul className="hidden justify-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="gold-underline text-[0.8rem] font-medium tracking-wide text-foreground/75 transition-colors duration-300 hover:text-primary"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <IconLink to="/wishlist" label="Loved Designs" count={wishCount}>
            <Heart className="h-5 w-5" />
          </IconLink>
          <div className="hidden sm:contents">
            <IconLink to="/requests" label="My Design Requests" count={requests.length}>
              <Scissors className="h-5 w-5" />
            </IconLink>
            <IconLink to="/orders" label="My Orders" count={orderCount}>
              <Package className="h-5 w-5" />
            </IconLink>
          </div>
          <IconLink to="/cart" label="Your Bag" count={count}>
            <ShoppingBag className="h-5 w-5" />
          </IconLink>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full border border-border/70 text-foreground transition-colors duration-300 hover:bg-secondary lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {user ? (
            <div className="relative">
              <button
                type="button"
                aria-label="Your account"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((v) => !v)}
                className="grid h-11 w-11 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-transform duration-300 hover:scale-105 active:scale-95"
              >
                {(profile?.full_name || user.email || "?").trim().charAt(0).toUpperCase()}
              </button>
              {accountOpen ? (
                <>
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setAccountOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="animate-in fade-in slide-in-from-top-1 absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-popover shadow-lift duration-200">
                    <p className="truncate border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
                      {profile?.full_name || user.email}
                    </p>
                    <Link
                      to="/orders"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      My orders
                    </Link>
                    <Link
                      to="/requests"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      My design requests
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-3 text-left text-sm text-destructive transition-colors hover:bg-secondary"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <IconLink to="/auth" label="Sign in">
              <UserRound className="h-5 w-5" />
            </IconLink>
          )}
          <a
            href={waLink(`Hi ${storeInfo.name}, I'd like to enquire about stitching.`)}
            target="_blank"
            rel="noreferrer"
            className="ml-2 hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 xl:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </nav>

      <div
        className={`grid overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-xl transition-[grid-template-rows,opacity] duration-400 lg:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <div className="px-4 pt-2 pb-6">
            <ul className="divide-y divide-border/60">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-3.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
              <Link
                to="/requests"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border py-3 text-center text-sm font-medium text-foreground"
              >
                Design requests
              </Link>
              <Link
                to="/orders"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border py-3 text-center text-sm font-medium text-foreground"
              >
                My orders
              </Link>
            </div>
            <a
              href={waLink(`Hi ${storeInfo.name}, I'd like to enquire about stitching.`)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground shadow-soft"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
