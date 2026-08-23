import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PenLine, Quote, Star } from "lucide-react";
import { useTestimonials } from "@/lib/useStorefront";
import { usePersistentState, uid } from "@/lib/persist";
import { useIsMobile } from "@/hooks/use-mobile";
import { Modal } from "@/components/shared/Dialogs";
import { Reveal, stagger } from "@/components/shared/Reveal";
import { SectionHeading } from "./Motifs";

type ReviewCard = {
  id: string;
  name: string;
  initials?: string;
  rating: number;
  quote: string;
  mine?: boolean;
};

/** Interactive star row — read-only by default, clickable when onChange is given. */
function Stars({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const dim = size === "lg" ? "h-8 w-8" : "h-4 w-4";

  return (
    <div className="flex gap-0.5" role={onChange ? "radiogroup" : undefined}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < shown;
        const icon = (
          <Star
            className={`${dim} transition-all duration-300 ${
              filled ? "scale-100 fill-accent text-accent" : "text-border"
            }`}
          />
        );
        if (!onChange) return <span key={i}>{icon}</span>;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i + 1}
            aria-label={`${i + 1} star${i ? "s" : ""}`}
            onMouseEnter={() => setHover(i + 1)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i + 1)}
            className="rounded-full p-0.5 transition-transform duration-200 hover:scale-115 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

function ReviewTile({ r, delay }: { r: ReviewCard; delay: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lift">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ backgroundImage: "var(--gradient-gold)" }}
        />
        <Quote className="absolute top-5 right-5 h-8 w-8 text-secondary transition-transform duration-500 group-hover:scale-110" />
        <Stars value={r.rating} />
        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">"{r.quote}"</p>
        <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary ring-1 ring-gold/30">
            {r.initials || r.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">{r.name}</span>
            <span className="block text-[0.7rem] text-muted-foreground">
              {r.mine ? "Your review" : "Verified customer"}
            </span>
          </span>
        </div>
      </article>
    </Reveal>
  );
}

export function Reviews() {
  const fetched = useTestimonials();
  const isMobile = useIsMobile();
  const perPage = isMobile ? 1 : 3;
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);

  const { value: mine, setValue: setMine } = usePersistentState<ReviewCard[]>(
    "pattukutty.local-reviews",
    [],
  );

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [saved, setSaved] = useState(false);

  const reviews: ReviewCard[] = useMemo(
    () => [...mine.map((m) => ({ ...m, mine: true })), ...fetched],
    [mine, fetched],
  );

  const pages = Math.max(1, Math.ceil(reviews.length / perPage));
  const current = Math.min(page, pages - 1);
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  const canSubmit = name.trim().length > 1 && quote.trim().length > 4;

  const submit = () => {
    if (!canSubmit) return;
    const initials = name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    setMine([
      { id: uid("rev-local"), name: name.trim(), initials, rating, quote: quote.trim() },
      ...mine,
    ]);
    setName("");
    setQuote("");
    setRating(5);
    setPage(0);
    setSaved(true);
    setOpen(false);
    window.setTimeout(() => setSaved(false), 4000);
  };

  return (
    <section id="reviews" className="relative overflow-hidden bg-background py-20 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Loved in Coimbatore"
            title="What Our Customers Say"
            subtitle="Fitting accuracy, fast turnaround and finishing you can feel — in their words."
          />
        </Reveal>

        {/* ── Rating summary + write CTA ─────────────────────────────── */}
        <Reveal delay={80}>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-soft backdrop-blur sm:flex sm:justify-between sm:gap-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="text-center">
                <p className="font-display text-3xl leading-none font-semibold text-primary tabular-nums">
                  {average ? average.toFixed(1) : "—"}
                </p>
                <p className="mt-1 text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase">
                  Average
                </p>
              </div>
              <span className="h-10 w-px shrink-0 bg-border" />
              <div className="min-w-0">
                <Stars value={Math.round(average)} />
                <p className="mt-1.5 truncate text-xs text-muted-foreground">
                  {reviews.length} review{reviews.length === 1 ? "" : "s"} from our studio guests
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:col-span-1"
            >
              <PenLine className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
              Write a review
            </button>
          </div>
        </Reveal>

        {saved ? (
          <p className="animate-fade-in mt-4 text-center text-xs font-medium text-primary">
            Thank you — your review is now showing at the top.
          </p>
        ) : null}

        {/* ── Carousel ───────────────────────────────────────────────── */}
        <div className="mt-10 overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {Array.from({ length: pages }).map((_, p) => (
              <div
                key={p}
                className="grid w-full shrink-0 gap-4 px-0.5 sm:gap-6 lg:grid-cols-3"
              >
                {reviews.slice(p * perPage, p * perPage + perPage).map((r, i) => (
                  <ReviewTile key={r.id} r={r} delay={stagger(i, 90)} />
                ))}
              </div>
            ))}
          </div>

          {pages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPage(Math.max(0, current - 1))}
                disabled={current === 0}
                aria-label="Previous reviews"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-soft transition-all duration-300 hover:border-gold/60 hover:text-primary disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: pages }).map((_, p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-label={`Go to review page ${p + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      p === current ? "w-8 bg-primary" : "w-3 bg-border hover:bg-gold/60"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPage(Math.min(pages - 1, current + 1))}
                disabled={current === pages - 1}
                aria-label="Next reviews"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-foreground shadow-soft transition-all duration-300 hover:border-gold/60 hover:text-primary disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Write a review modal ─────────────────────────────────────── */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Share your experience"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-border px-6 py-2.5 text-xs font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:border-gold/60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-soft transition-transform duration-300 hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100"
            >
              Post review
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Your rating
            </label>
            <div className="mt-2 flex items-center gap-3">
              <Stars value={rating} onChange={setRating} size="lg" />
              <span className="text-sm text-muted-foreground tabular-nums">{rating}/5</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="review-name"
              className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            >
              Your name
            </label>
            <input
              id="review-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Divya Ramesh"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold"
            />
          </div>

          <div>
            <label
              htmlFor="review-text"
              className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            >
              Your review
            </label>
            <textarea
              id="review-text"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              rows={4}
              placeholder="Tell us about the fit, finishing and delivery time…"
              className="mt-2 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold"
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
