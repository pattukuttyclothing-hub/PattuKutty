import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { Spec } from "@/components/custom/SpecForm";

const CELEBRATION_MS = 2800;

function CelebrationOverlay() {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const distance = 90 + Math.random() * 70;
        return {
          id: i,
          tx: `${Math.cos(angle) * distance}px`,
          ty: `${Math.sin(angle) * distance}px`,
          delay: `${Math.random() * 120}ms`,
          hue: i % 3 === 0 ? "bg-gold" : i % 3 === 1 ? "bg-maroon" : "bg-gold-soft",
          size: i % 2 === 0 ? "h-2.5 w-2.5" : "h-1.5 w-1.5",
        };
      }),
    []
  );

  return (
    <div className="animate-fade-in relative mx-auto max-w-lg rounded-3xl border border-primary/20 bg-card p-8 text-center shadow-lift sm:p-10">
      <div className="relative mx-auto grid h-28 w-28 place-items-center">
        <span className="animate-ring-burst absolute inset-0 rounded-full border-2 border-gold" />
        <span className="animate-success-glow absolute inset-2 rounded-full bg-gold/10" />
        <span className="animate-success-pop relative z-10 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary to-maroon-deep shadow-lift">
          <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
        </span>
        {particles.map((p) => (
          <span
            key={p.id}
            className={`animate-particle-burst absolute left-1/2 top-1/2 ${p.size} rounded-full ${p.hue}`}
            style={{
              ["--tx" as string]: p.tx,
              ["--ty" as string]: p.ty,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      <h2 className="font-display mt-8 text-2xl font-bold text-foreground sm:text-3xl">
        Design Successfully Submitted!
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Our studio team has received your request. We will review every detail and contact you soon with the next steps.
      </p>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-primary">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        Taking you to your request status…
      </div>
    </div>
  );
}

export function SubmissionCelebration({ requestId }: { requestId: string; spec?: Spec; onDesignAnother?: () => void }) {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = window.setTimeout(() => {
      void navigate({ to: "/requests/$id", params: { id: requestId } });
    }, CELEBRATION_MS);
    return () => window.clearTimeout(t);
  }, [navigate, requestId]);

  return (
    <div ref={wrapperRef}>
      <CelebrationOverlay />
    </div>
  );
}
