import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Carousel3DProps<T> = {
  items: T[];
  renderItem: (item: T, isActive: boolean, index: number, settled: boolean) => ReactNode;
  /** width of a single card in px (desktop) */
  itemWidth?: number;
  /** height of the stage in px */
  height?: number;
  autoPlay?: boolean;
  interval?: number;
  onActiveChange?: (index: number) => void;
  /** fires true once the slide transition has settled (no drift for overlays) */
  onSettledChange?: (settled: boolean) => void;
  /** accessible name for the carousel region */
  label?: string;
  className?: string;
};

const TRANSITION_MS = 700;

export function Carousel3D<T>({
  items,
  renderItem,
  itemWidth = 300,
  height = 640,
  autoPlay = true,
  interval = 7000,
  onActiveChange,
  onSettledChange,
  label = "Carousel",
  className = "",
}: Carousel3DProps<T>) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [settled, setSettled] = useState(true);
  const [width, setWidth] = useState(itemWidth);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = items.length;

  useEffect(() => {
    const measure = () => {
      const stageEl = stageRef.current;
      const parentW = stageEl?.parentElement?.clientWidth || window.innerWidth;
      const w = stageEl?.clientWidth && stageEl.clientWidth > 100 ? stageEl.clientWidth : parentW;
      setWidth(Math.min(310, Math.max(220, w * 0.65)));
    };
    measure();
    window.addEventListener("resize", measure);
    // Zoom / breakpoint changes also fire through the visual viewport on mobile.
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [itemWidth]);

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + count) % count),
    [count],
  );

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // Overlays (coach-marks / halos) must only paint once the card has stopped
  // moving, otherwise they visually drift away from the card mid-transition.
  useEffect(() => {
    setSettled(false);
    onSettledChange?.(false);
    const id = window.setTimeout(() => {
      setSettled(true);
      onSettledChange?.(true);
    }, TRANSITION_MS + 40);
    return () => window.clearTimeout(id);
  }, [active, width, onSettledChange]);

  useEffect(() => {
    if (!autoPlay || paused || count < 2) return;
    const id = window.setInterval(() => go(1), interval);
    return () => window.clearInterval(id);
  }, [autoPlay, paused, interval, go, count]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (count < 2) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActive(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActive(count - 1);
      }
    },
    [count, go],
  );

  // swipe support
  const touch = useRef<number | null>(null);

  return (
    <div
      className={`relative ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-label={`${label}. Use the left and right arrow keys to change slides.`}
        onKeyDown={onKeyDown}
        className="relative w-full overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        style={{ height, perspective: "1400px" }}
        onTouchStart={(e) => {
          touch.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touch.current;
          if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
          touch.current = null;
        }}
      >
        {items.map((item, i) => {
          let offset = i - active;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;
          const abs = Math.abs(offset);
          const isActive = offset === 0;
          const hidden = abs > 2;
          return (
            <div
              key={i}
              // Only the active slide is reachable by keyboard / screen readers.
              {...(isActive ? {} : { inert: "" as unknown as boolean })}
              aria-hidden={isActive ? undefined : true}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${count}`}
              onClick={() => !isActive && setActive(i)}
              className="absolute top-1/2 left-1/2 transition-all duration-700 ease-out will-change-transform"
              style={{
                width,
                height: "100%",
                zIndex: 20 - abs,
                opacity: hidden ? 0 : 1 - abs * 0.25,
                pointerEvents: hidden ? "none" : "auto",
                cursor: isActive ? "default" : "pointer",
                transform: `translate3d(-50%, -50%, 0) translateX(${offset * width * 0.58}px) translateZ(${-abs * 180}px) rotateY(${offset * -28}deg) scale(${isActive ? 1 : 0.9})`,
                filter: isActive ? "none" : "brightness(0.75)",
              }}
            >
              {renderItem(item, isActive, i, settled)}
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-1 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:left-4"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute top-1/2 right-1 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:right-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => setActive(i)}
                className={`h-6 rounded-full px-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background before:block before:h-1.5 before:rounded-full before:transition-all before:content-[''] ${
                  i === active
                    ? "before:w-7 before:bg-primary"
                    : "before:w-2.5 before:bg-primary/25"
                } flex items-center`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
