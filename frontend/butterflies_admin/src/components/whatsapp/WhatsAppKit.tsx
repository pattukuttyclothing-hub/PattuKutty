import type { ReactNode } from "react";
import { BadgeCheck, CheckCheck } from "lucide-react";
import type { Audience, AudienceOption } from "@/lib/whatsapp-notify";
import { storeInfo } from "@/data/boutique";

/** Compact metric tile used across overview and per-campaign analytics. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "plain",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "plain" | "gold" | "wa";
}) {
  const ring =
    tone === "gold"
      ? "border-accent/50 bg-accent/12"
      : tone === "wa"
        ? "border-wa/40 bg-wa/10"
        : "border-border bg-card";
  return (
    <div className={`rounded-3xl border p-4 shadow-soft ${ring}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="font-display mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-[0.7rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Pill({
  children,
  active = false,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.66rem] font-semibold tracking-[0.1em] uppercase ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-muted text-muted-foreground"
      } ${className}`}
    >
      {children}
    </span>
  );
}

/** Audience selector — shared by both send paths. */
export function AudiencePicker({
  value,
  onChange,
  options,
}: {
  value: Audience;
  onChange: (a: Audience) => void;
  options: AudienceOption[];
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {options.map((a) => {
        const active = a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.id)}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              active
                ? "border-primary bg-secondary shadow-soft"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">{a.label}</p>
            <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{a.hint}</p>
            <p className="mt-2 text-[0.66rem] font-semibold tracking-[0.1em] text-primary uppercase">
              {a.size.toLocaleString("en-IN")} contacts
            </p>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Faithful mock of the outgoing WhatsApp message. Purely presentational —
 * feed it any title/message/image/note/cta and it renders the chat bubble.
 */
export function WhatsAppPreview({
  title,
  priceLine,
  message,
  image,
  note,
  cta,
}: {
  title: string;
  priceLine?: string | undefined;
  message: string;
  image?: string | undefined;
  note?: string | undefined;
  cta?: string | undefined;
}) {
  const time = new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
      {/* chat header */}
      <div className="flex items-center gap-3 bg-wa-deep px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-wa text-sm font-bold text-wa-deep">
          BT
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-primary-foreground">
            {storeInfo.name}
            <BadgeCheck className="h-3.5 w-3.5 text-wa" />
          </p>
          <p className="text-[0.62rem] text-primary-foreground/70">Business account</p>
        </div>
      </div>

      {/* chat canvas */}
      <div className="bg-wa-chat px-3 py-5">
        <div className="ml-auto max-w-[86%] rounded-2xl rounded-tr-sm bg-wa-bubble p-2 shadow-soft">
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              className="mb-2 aspect-[4/5] w-full rounded-xl object-cover"
            />
          ) : null}
          <p className="px-1 text-sm leading-snug font-bold text-foreground">{title}</p>
          {priceLine ? (
            <p className="mt-0.5 px-1 text-sm font-semibold text-wa-deep">{priceLine}</p>
          ) : null}
          <p className="mt-1.5 px-1 text-[0.78rem] leading-relaxed whitespace-pre-line text-foreground/85">
            {message}
          </p>
          {note ? (
            <p className="mt-2 px-1 text-[0.74rem] leading-relaxed text-foreground/70 italic">
              {note}
            </p>
          ) : null}
          <p className="mt-1.5 flex items-center justify-end gap-1 px-1 text-[0.6rem] text-foreground/50">
            {time} <CheckCheck className="h-3.5 w-3.5 text-wa-tick" />
          </p>
          {cta ? (
            <div className="mt-2 border-t border-foreground/10 pt-2 text-center">
              <span className="text-[0.78rem] font-semibold text-wa-tick">{cta}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
