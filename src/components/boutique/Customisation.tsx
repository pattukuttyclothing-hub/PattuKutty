import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock3, Palette, Ruler, Sparkles } from "lucide-react";
import { customHighlights, customServices, timelines } from "@/data/boutique";
import { InfoTip } from "@/components/shared/Dialogs";
import { StatusBadge } from "@/components/shared/Badge";
import { AutoImageFade } from "@/components/shared/AutoImageFade";
import { Reveal, stagger } from "@/components/shared/Reveal";
import { SectionHeading } from "./Motifs";

const highlightIcons = [Clock3, Palette, Ruler];

/** "Stitch It Your Way" — the customisation pitch + CTA into the Design Studio. */
export function Customisation() {
  const collage = customServices.map((s) => s.image);

  return (
    <section
      id="customise"
      className="relative overflow-hidden bg-gradient-to-b from-background via-blush to-background py-20 lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-secondary blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-gold-soft/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Pattu Kutty Design Studio"
            title="Stitch It Your Way"
            subtitle="Bring a photo, a colour or just an idea. We cut, stitch and finish it to your measurements — with express service when the function is tomorrow."
          />
        </Reveal>

        <div className="mt-10 grid items-stretch gap-8 sm:mt-12 lg:mt-16 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          {/* ---------- collage ---------- */}
          <Reveal className="relative flex flex-col gap-4">

            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-lift">
              <AutoImageFade
                images={collage}
                alt="Custom stitched designs from our studio"
                className="aspect-[5/4] w-full"
                interval={7000}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon/75 via-maroon/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[0.62rem] font-semibold tracking-[0.32em] text-accent uppercase">
                  Made only for you
                </p>
                <p className="font-display mt-1 text-2xl font-semibold text-primary-foreground">
                  One design. One woman. One perfect fit.
                </p>
              </div>
            </div>

            {/* floating service chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {customServices.map((s, i) => (
                <Reveal key={s.id} delay={stagger(i, 90)}>
                  <article className="card-lift h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                    <AutoImageFade
                      images={[s.image, collage[(i + 1) % collage.length]!]}
                      alt={s.title}
                      className="aspect-square w-full"
                      interval={8000}
                      offset={i * 1200}
                      showDots={false}
                    />
                    <p className="px-2.5 py-2 text-center text-[0.68rem] font-semibold text-foreground">
                      {s.title}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* ---------- pitch ---------- */}
          <div className="flex h-full flex-col">
            <div className="space-y-3">

              {customHighlights.map((h, i) => {
                const Icon = highlightIcons[i % highlightIcons.length]!;
                return (
                  <Reveal key={h.title} delay={stagger(i, 90)}>
                    <div className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-all duration-500 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lift">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-primary transition-transform duration-500 group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {h.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {h.desc}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* timelines */}
            <Reveal delay={120}>
              <div className="mt-6 rounded-3xl border border-border/70 bg-card/80 p-5 backdrop-blur sm:p-6">
                <div className="flex items-center gap-2">
                  <p className="text-[0.66rem] font-semibold tracking-[0.3em] text-primary uppercase">
                    Turnaround Windows Available
                  </p>
                  <InfoTip text="Custom stitching rates are quoted by our designer after reviewing your fabric & embroidery choices." />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {timelines.map((t, i) => (
                    <Reveal key={t.id} delay={stagger(i, 80)}>
                      <div className="relative h-full rounded-2xl border border-border/70 bg-blush px-4 py-3 transition-colors duration-400 hover:border-gold/60">
                        {t.badge ? (
                          <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[0.55rem] font-bold tracking-[0.12em] text-accent-foreground uppercase">
                            {t.badge}
                          </span>
                        ) : null}
                        <p className="font-display text-lg font-semibold text-foreground">
                          {t.label}
                        </p>
                        <p className="text-[0.68rem] leading-snug text-muted-foreground">
                          {t.note}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="mt-6 flex flex-col items-start gap-3">
                <Link
                  to="/design-studio"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-9 py-4 text-sm font-semibold tracking-[0.08em] text-primary-foreground uppercase shadow-lift transition-transform duration-500 hover:scale-[1.02] sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" /> Design My Own Outfit
                  <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="ok">Authenticated Studio Request</StatusBadge>
                  <p className="text-xs text-muted-foreground">
                    Stitched to your exact fit with live studio updates.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
