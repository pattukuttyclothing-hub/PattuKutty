import { MapPin, Sparkles } from "lucide-react";
import { aboutBadges, aboutImage, storeInfo, waLink } from "@/data/boutique";
import { Reveal, stagger } from "@/components/shared/Reveal";
import { LotusMotif, FloralMotif } from "./Motifs";

export function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-blush py-14 sm:py-20 lg:py-28">
      <LotusMotif className="pointer-events-none absolute -top-6 right-4 hidden h-40 w-40 text-primary/8 sm:block" />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-gold-soft/40 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-2 lg:gap-16">
        {/* ── Portrait ─────────────────────────────────────────────── */}
        <Reveal className="relative">
          <div className="group relative overflow-hidden rounded-[2rem] border border-border/70 shadow-lift">
            <img
              src={aboutImage}
              alt="Inside the Pattu Kutty boutique in Coimbatore"
              width={1200}
              height={1000}
              loading="lazy"
              className="aspect-[5/4] h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon/55 via-transparent to-transparent" />
            <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-maroon/45 px-3.5 py-1.5 text-[0.58rem] font-semibold tracking-[0.24em] text-accent uppercase backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> Since Day One
            </span>
          </div>

          {/* floating stat cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 lg:absolute lg:-bottom-8 lg:left-6 lg:mt-0 lg:w-[86%]">
            {[
              { value: "1 Hour", label: "Express Stitching" },
              { value: "100%", label: "Perfect Fitting" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={stagger(i, 120)}>
                <div className="card-lift h-full rounded-2xl border border-accent/25 bg-card px-4 py-3.5 shadow-soft sm:px-5 sm:py-4">
                  <p className="font-display text-xl leading-none font-semibold text-primary sm:text-2xl">
                    {s.value}
                  </p>
                  <p className="mt-1.5 text-[0.58rem] leading-snug tracking-[0.14em] text-muted-foreground uppercase sm:text-[0.62rem] sm:tracking-[0.16em]">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ── Story ────────────────────────────────────────────────── */}
        <div className="min-w-0 lg:pl-2 lg:pt-6">
          <Reveal>
            <p className="text-xs font-medium tracking-[0.28em] text-primary uppercase">
              About the brand
            </p>
            <h2 className="font-display mt-3 text-[1.75rem] leading-tight font-semibold text-foreground sm:text-4xl">
              Who is Pattu Kutty, and what do they do?
            </h2>
            <p className="mt-1.5 text-sm text-accent-foreground/80 italic">"{storeInfo.tagline}"</p>
            <FloralMotif className="mt-4 h-5 w-28 text-accent" />
          </Reveal>

          <div className="mt-5 space-y-4 text-[0.9rem] leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
            {[
              <>{ENTITY_DEFINITION}</>,
              <>
                Pattu Kutty customizes any women's garment to an exact requirement — custom silk
                sarees, bridal wear and kalyana pattu sarees, designer blouses, bridal lehengas,
                half sarees, pattu pavadai and frocks. Selected designs are stitched in{" "}
                <span className="font-medium text-foreground">as fast as one hour</span>, and most
                other garments are ready <span className="font-medium text-foreground">the next day</span>.
              </>,
              <>
                The studio is in Pappanaicken Palayam, Coimbatore, near Gandhipuram, and finished
                garments are shipped to customers across India — including brides working to tight
                wedding timelines and NRI families visiting for a single week of functions.
              </>,
            ].map((node, i) => (
              <Reveal key={i} delay={stagger(i, 100)}>
                <p className="border-l-2 border-gold/30 pl-3.5 sm:pl-4">{node}</p>
              </Reveal>
            ))}
          </div>

          <ul className="mt-7 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:mt-8 sm:gap-3">
            {/* aboutBadges is controlled by System Admin */}
            {aboutBadges.map((b, i) => (
              <Reveal key={b.label} delay={stagger(i, 80)} as="li" className="h-full">
                <div className="group flex h-full items-center gap-2.5 rounded-2xl border border-border/70 bg-card px-3.5 py-3 shadow-soft transition-all duration-500 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lift">
                  <span className="text-base transition-transform duration-500 group-hover:scale-125">
                    {b.icon}
                  </span>
                  <span className="min-w-0 text-xs font-medium text-foreground sm:text-sm">
                    {b.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <div className="mt-7 flex flex-col items-start gap-4 sm:mt-8 sm:flex-row sm:items-center">
              <a
                href={waLink(`Hi ${storeInfo.name}, I'd like to book a stitching appointment.`)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:w-auto"
              >
                Book an Appointment
              </a>
              <p className="flex max-w-xs items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {storeInfo.address}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
