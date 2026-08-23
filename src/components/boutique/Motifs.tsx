import { useReveal } from "@/hooks/use-reveal";

/**
 * Legacy butterfly mark — retained so nothing that still imports it breaks.
 * Brand surfaces now use the Pattu Kutty lotus/leaf motif below.
 */
export function ButterflyMotif({ className = "" }: { className?: string }) {
  return <LotusMotif className={className} />;
}

/** Gold leaf crest lifted from the Pattu Kutty logo. */
export function LotusMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className} fill="none">
      <path
        d="M32 8c3.4 6.6 4.8 12.6 4.8 18.4 0 5.6-1.6 10.4-4.8 15-3.2-4.6-4.8-9.4-4.8-15C27.2 20.6 28.6 14.6 32 8Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M20.4 15.6c4.6 4 7.4 8.2 8.8 12.6 1.4 4.3 1.4 8.4 0 12.6-3.8-2.2-6.6-5.2-8.4-9-1.9-3.9-2.4-8.4-.4-16.2Z"
        fill="currentColor"
        opacity="0.65"
      />
      <path
        d="M43.6 15.6c2 7.8 1.5 12.3-.4 16.2-1.8 3.8-4.6 6.8-8.4 9-1.4-4.2-1.4-8.3 0-12.6 1.4-4.4 4.2-8.6 8.8-12.6Z"
        fill="currentColor"
        opacity="0.65"
      />
      <path d="M32 42.5 35.8 48 32 53.5 28.2 48 32 42.5Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/**
 * The gold rule from the logo: dot — line — leaf crest — line — dot.
 * The lines draw themselves in when the divider scrolls into view.
 */
export function FloralMotif({ className = "" }: { className?: string }) {
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      <svg viewBox="0 0 160 24" aria-hidden="true" className="h-full w-full" fill="none">
        <circle cx="4" cy="12" r="3" fill="currentColor" />
        <circle cx="156" cy="12" r="3" fill="currentColor" />
        <path
          d="M10 12h52M98 12h52"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="120"
          strokeDashoffset={revealed ? 0 : 120}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <path
          d="M80 2c2.6 4.4 3.7 8 3.7 11 0 3-1.1 5.6-3.7 8.2-2.6-2.6-3.7-5.2-3.7-8.2 0-3 1.1-6.6 3.7-11Z"
          fill="currentColor"
        />
        <path
          d="M71 6.5c3 2.7 4.8 5.4 5.6 8.2.5 1.8.6 3.5.3 5.3-2.6-1.5-4.5-3.5-5.7-6-1.2-2.5-1.5-4.9-.2-7.5Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M89 6.5c1.3 2.6 1 5-.2 7.5-1.2 2.5-3.1 4.5-5.7 6-.3-1.8-.2-3.5.3-5.3.8-2.8 2.6-5.5 5.6-8.2Z"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-revealed={revealed}
      className={`reveal ${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display mt-3 text-[2rem] leading-[1.1] font-semibold text-foreground sm:text-4xl md:text-[2.9rem]">
        {title}
      </h2>
      <FloralMotif
        className={`mt-4 h-5 w-40 text-accent ${align === "center" ? "mx-auto block" : ""}`}
      />
      {subtitle ? (
        <p className="text-balance-pretty mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
