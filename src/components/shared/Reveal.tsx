import type { ElementType, ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";

/**
 * Presentation-only scroll reveal wrapper.
 * Pairs with the `reveal` utility in styles.css and honours reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  /** Stagger delay in ms — keep grids under ~400ms total. */
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Staggered delay helper: caps the stagger so long grids never feel slow. */
export const stagger = (index: number, step = 70, max = 420) =>
  Math.min(index * step, max);
