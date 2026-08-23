import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal hook — pairs with the `reveal` utility in styles.css.
 * Presentation only: adds data-revealed once the element enters the viewport.
 * Respects prefers-reduced-motion (reveals immediately).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window === "undefined" ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            if (options?.once !== false) observer.disconnect();
          } else if (options?.once === false) {
            setRevealed(false);
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? "0px 0px -8% 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin, options?.once]);

  return { ref, revealed } as const;
}

/** Convenience props spread: <div {...revealProps(ref, revealed)} /> */
export function revealProps(revealed: boolean, delayMs = 0) {
  return {
    "data-revealed": revealed ? "true" : "false",
    style: delayMs ? { transitionDelay: `${delayMs}ms` } : undefined,
  } as const;
}
