import { useEffect, useState } from "react";

/**
 * Auto-advancing image stack — the image itself changes inside the card
 * (crossfade + gentle ken-burns), so no separate carousel chrome is needed.
 * `offset` staggers cards so no two cards flip on the same beat.
 */
export function AutoImageFade({
  images,
  alt,
  interval = 6000,
  offset = 0,
  className = "",
  imgClassName = "",
  showDots = true,
}: {
  images: string[];
  alt: string;
  interval?: number;
  offset?: number;
  className?: string;
  imgClassName?: string;
  showDots?: boolean;
}) {
  const list = images?.filter(Boolean) ?? [];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (list.length < 2 || paused) return;
    let id: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      setI((v) => (v + 1) % list.length);
      id = setInterval(() => setI((v) => (v + 1) % list.length), interval);
    }, offset % interval);
    return () => {
      clearTimeout(start);
      if (id) clearInterval(id);
    };
  }, [list.length, interval, offset, paused]);

  if (!list.length) {
    return (
      <div className={`relative overflow-hidden bg-muted/30 ${className}`}>
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          No image
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {list.map((src, k) => (
        <img
          key={`${src}-${k}`}
          src={src}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full ${imgClassName || "object-cover object-top"} transition-all duration-[1800ms] ease-out ${
            k === i ? "scale-105 opacity-100" : "scale-100 opacity-0"
          }`}
        />
      ))}
      {showDots && list.length > 1 ? (
        <div className="pointer-events-none absolute top-3 right-3 z-10 flex gap-1">
          {list.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 rounded-full bg-primary-foreground transition-all duration-500 ${
                k === i ? "w-4 opacity-95" : "w-1.5 opacity-45"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
