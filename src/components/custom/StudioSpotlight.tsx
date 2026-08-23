import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MousePointerClick, X } from "lucide-react";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 14;

/**
 * Presentation-only onboarding spotlight.
 * Dims the whole page and keeps the given target (Step 1 · Pick Category)
 * at full brightness with an animated arrow + prompt pointing at it.
 */
export function StudioSpotlight({
  targetRef,
  active,
  onDismiss,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  active: boolean;
  onDismiss: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const frame = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect((prev) => {
      if (
        prev &&
        Math.abs(prev.top - r.top) < 0.5 &&
        Math.abs(prev.left - r.left) < 0.5 &&
        Math.abs(prev.width - r.width) < 0.5 &&
        Math.abs(prev.height - r.height) < 0.5
      ) {
        return prev;
      }
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    });
  }, [targetRef]);

  // Track the target every frame so the cut-out stays glued to it while the
  // user scrolls — no CSS transition lag, no motion "collapse".
  useEffect(() => {
    if (!active) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      measure();
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [active, measure]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onDismiss]);

  if (!active || !rect) return null;

  const box = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Place the callout above the target when there is room, otherwise below.
  const placeAbove = box.top > 190;
  const calloutTop = placeAbove ? box.top - 20 : box.top + box.height + 20;

  return createPortal(
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="false"
      aria-label="Start by picking a category"
    >
      {/* Dim panels around the cut-out (four bands = no clipping issues) */}
      {[
        { top: 0, left: 0, right: 0, height: Math.max(box.top, 0) },
        { top: box.top + box.height, left: 0, right: 0, bottom: 0 },
        { top: box.top, left: 0, width: Math.max(box.left, 0), height: box.height },
        { top: box.top, left: box.left + box.width, right: 0, height: box.height },
      ].map((s, i) => (
        <div
          key={i}
          onClick={onDismiss}
          className="absolute animate-guide-dim-in"
          style={{ backgroundColor: "rgba(28,10,12,0.6)", ...(s as React.CSSProperties) }}
        />
      ))}
      <div
        className="pointer-events-none absolute rounded-[28px] animate-guide-dim-in"
        style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
      >
        <span className="absolute inset-0 rounded-[28px] animate-guide-halo" />
      </div>

      {/* Callout */}
      <div
        className="pointer-events-none absolute left-0 right-0 flex justify-center px-4"
        style={{
          top: calloutTop,
          transform: placeAbove ? "translateY(-100%)" : undefined,
        }}
      >
        <div className="animate-guide-pop flex max-w-full flex-col items-center gap-2">
          <div className="animate-guide-float flex max-w-full flex-col items-center gap-2" style={{ animationDelay: "0.62s" }}>
          {!placeAbove && <GuideArrow direction="up" />}
          <div className="pointer-events-auto relative flex max-w-[min(28rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-primary/25 bg-card/95 px-4 py-3 text-left shadow-soft backdrop-blur-md sm:px-5 sm:py-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary animate-guide-tap">
              <MousePointerClick className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-primary">
                Step 1 of 2
              </p>
              <p className="font-display text-base font-semibold leading-snug text-foreground sm:text-lg">
                Pick the category you want to customise
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Choose Half Saree, Frocks, Sarees or Blouses — then we&rsquo;ll open the
                measurement and reference form for you.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Skip guide"
              className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {placeAbove && <GuideArrow direction="down" />}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function GuideArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <span
      aria-hidden="true"
      className="animate-guide-bob text-primary"
      style={{ transform: direction === "up" ? "rotate(180deg)" : undefined }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v14" />
        <path d="m6 13 6 6 6-6" />
      </svg>
    </span>
  );
}
