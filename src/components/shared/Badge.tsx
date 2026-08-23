import type { ReactNode } from "react";

export type Tone = "review" | "ok" | "bad" | "info" | "gold";

const tones: Record<Tone, string> = {
  review: "bg-accent/20 text-accent-foreground border-accent/50",
  ok: "bg-secondary text-primary border-primary/30",
  bad: "bg-destructive/12 text-destructive border-destructive/35",
  info: "bg-muted text-muted-foreground border-border",
  gold: "bg-accent text-accent-foreground border-accent",
};

export function StatusBadge({
  tone = "info",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-semibold tracking-[0.08em] uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function RotatedStampBadge({
  status,
  label,
  className = "",
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const norm = String(status || "").toLowerCase().replace(/_/g, "-");

  const stampStyles: Record<string, { border: string; text: string; bg: string }> = {
    submitted: { border: "border-amber-600/80 ring-2 ring-amber-500/30", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10" },
    "under-review": { border: "border-pink-600/80 ring-2 ring-pink-500/30", text: "text-pink-700 dark:text-pink-400", bg: "bg-pink-500/10" },
    quoted: { border: "border-pink-600/80 ring-2 ring-pink-500/30", text: "text-pink-700 dark:text-pink-400", bg: "bg-pink-500/10" },
    "quotation-updated": { border: "border-amber-600/80 ring-2 ring-amber-500/30", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10" },
    updated: { border: "border-amber-600/80 ring-2 ring-amber-500/30", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10" },
    accepted: { border: "border-emerald-600/80 ring-2 ring-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    ordered: { border: "border-emerald-600/80 ring-2 ring-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    cancelled: { border: "border-rose-600/80 ring-2 ring-rose-500/30", text: "text-rose-700 dark:text-rose-400", bg: "bg-rose-500/10" },
  };

  const fallback = { border: "border-amber-600/80 ring-2 ring-amber-500/30", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10" };
  const current = stampStyles[norm] ?? fallback;
  const displayLabel = label || norm.replace(/-/g, " ").toUpperCase();

  return (
    <div className={`inline-block -rotate-6 transform rounded-3xl border-2 p-1.5 shadow-xl ${current.border} ${current.bg} backdrop-blur-sm ${className}`}>
      <div className={`rounded-2xl border-2 border-dashed px-7 py-3 text-center font-display text-base font-black tracking-[0.22em] uppercase ${current.border} ${current.text}`}>
        {displayLabel}
      </div>
    </div>
  );
}
