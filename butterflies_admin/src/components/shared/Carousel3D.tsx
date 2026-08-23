import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Carousel3DProps<T> = {
  items: T[];
  renderItem: (item: T, isActive: boolean, index: number) => ReactNode;
  /** width of a single card in px (desktop) */
  itemWidth?: number;
  /** height of the stage in px */
  height?: number;
  autoPlay?: boolean;
  interval?: number;
  onActiveChange?: (index: number) => void;
  className?: string;
};

export function Carousel3D<T>({
  items,
  renderItem,
  itemWidth = 300,
  height = 420,
  autoPlay = true,
  interval = 4000,
  onActiveChange,
  className = "",
}: Carousel3DProps<T>) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [width, setWidth] = useState(itemWidth);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = items.length;

  useEffect(() => {
    const measure = () => {
      const w = stageRef.current?.clientWidth ?? itemWidth;
      setWidth(Math.min(itemWidth, Math.max(180, w * 0.62)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [itemWidth]);

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + count) % count),
    [count],
  );

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  useEffect(() => {
    if (!autoPlay || hovered || count < 2) return;
    const id = window.setInterval(() => go(1), interval);
    return () => window.clearInterval(id);
  }, [autoPlay, hovered, interval, go, count]);

  // swipe support
  const touch = useRef<number | null>(null);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={stageRef}
        className="relative w-full overflow-hidden"
        style={{ height, perspective: "1400px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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
              onClick={() => !isActive && setActive(i)}
              className="absolute top-1/2 left-1/2 transition-all duration-700 ease-out"
              style={{
                width,
                height: "100%",
                zIndex: 20 - abs,
                opacity: hidden ? 0 : 1 - abs * 0.25,
                pointerEvents: hidden ? "none" : "auto",
                cursor: isActive ? "default" : "pointer",
                transform: `translate(-50%, -50%) translateX(${offset * width * 0.58}px) translateZ(${-abs * 180}px) rotateY(${offset * -28}deg) scale(${isActive ? 1 : 0.9})`,
                filter: isActive ? "none" : "brightness(0.75)",
              }}
            >
              {renderItem(item, isActive, i)}
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-1 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105 sm:left-4"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute top-1/2 right-1 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform hover:scale-105 sm:right-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to item ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-7 bg-primary" : "w-2.5 bg-primary/25"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
