import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, PackageCheck, Sparkles } from "lucide-react";

/**
 * Full-screen "order placed" celebration.
 * Purely presentational — the caller decides when to show it and what happens next.
 */
export function OrderCelebration({
  orderNo,
  total,
  onDone,
  duration = 3000,
}: {
  orderNo: string;
  total?: string;
  onDone: () => void;
  duration?: number;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => {
        const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 120 + Math.random() * 140;
        return {
          id: i,
          tx: `${Math.cos(angle) * distance}px`,
          ty: `${Math.sin(angle) * distance}px`,
          delay: `${Math.random() * 220}ms`,
          hue: i % 3 === 0 ? "bg-gold" : i % 3 === 1 ? "bg-primary" : "bg-gold-soft",
          size: i % 4 === 0 ? "h-3 w-3" : i % 3 === 0 ? "h-2 w-2" : "h-1.5 w-1.5",
          shape: i % 5 === 0 ? "rounded-sm" : "rounded-full",
        };
      }),
    [],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(onDone, duration);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [onDone, duration]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Order placed successfully"
      className="animate-guide-dim-in fixed inset-0 z-[120] grid place-items-center px-4"
      style={{ backgroundColor: "rgba(28, 10, 14, 0.72)", backdropFilter: "blur(6px)" }}
    >
      <div className="animate-guide-pop relative w-full max-w-md overflow-hidden rounded-[2rem] border border-gold/30 bg-card p-8 text-center shadow-lift sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative mx-auto grid h-32 w-32 place-items-center">
          <span className="animate-ring-burst absolute inset-0 rounded-full border-2 border-gold" />
          <span
            className="animate-ring-burst absolute inset-0 rounded-full border border-primary/50"
            style={{ animationDelay: "260ms" }}
          />
          <span className="animate-success-glow absolute inset-3 rounded-full bg-gold/15" />
          <span className="animate-success-pop relative z-10 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-maroon-deep shadow-lift">
            <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
          </span>
          {particles.map((p) => (
            <span
              key={p.id}
              className={`animate-particle-burst absolute left-1/2 top-1/2 ${p.size} ${p.shape} ${p.hue}`}
              style={{
                ["--tx" as string]: p.tx,
                ["--ty" as string]: p.ty,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        <p className="mt-7 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
          <Sparkles className="h-3.5 w-3.5" /> Order Confirmed
        </p>

        <h2 className="font-display mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          Hooray! Your order is placed
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you for choosing us. Our studio has started preparing your order with care — you&apos;ll get updates at
          every step.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 font-semibold text-foreground">
            <PackageCheck className="h-3.5 w-3.5 text-primary" /> {orderNo}
          </span>
          {total ? (
            <span className="rounded-full border border-border/70 bg-background px-3 py-1.5 font-semibold text-foreground">
              {total}
            </span>
          ) : null}
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          Taking you to your order tracking…
        </div>
      </div>
    </div>,
    document.body,
  );
}
