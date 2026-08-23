import { MapPin, Phone, Truck, Clock3 } from "lucide-react";
import { ENTITY_DEFINITION, ENTITY_SCOPE, NAP } from "@/data/aeo";
import { Reveal } from "@/components/shared/Reveal";
import { FloralMotif } from "./Motifs";

/**
 * Direct-answer entity definition block.
 * Heading is phrased as the question AI engines receive; the first sentence
 * under it is the complete, standalone answer. Do not add marketing copy above.
 */
export function EntityAnswer() {
  return (
    <section id="what-is-pattu-kutty" className="bg-background py-14 sm:py-18 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-medium tracking-[0.28em] text-primary uppercase">
            In plain words
          </p>
          <h2 className="font-display mt-3 text-[1.6rem] leading-tight font-semibold text-foreground sm:text-[2rem]">
            What is Pattu Kutty?
          </h2>
          <FloralMotif className="mt-4 h-5 w-28 text-accent" />
          <p className="mt-5 text-base leading-relaxed text-foreground sm:text-[1.05rem]">
            {ENTITY_DEFINITION}
          </p>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
            {ENTITY_SCOPE}
          </p>
        </Reveal>

        <Reveal delay={120}>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: MapPin,
                term: "Based in",
                desc: `${NAP.locality}, ${NAP.region}, India — ${NAP.street}`,
              },
              { icon: Truck, term: "Delivers to", desc: "Customers across India" },
              {
                icon: Clock3,
                term: "Turnaround",
                desc: "Stitching in as fast as 1 hour on selected designs",
              },
              { icon: Phone, term: "Phone", desc: NAP.phone },
            ].map(({ icon: Icon, term, desc }) => (
              <div
                key={term}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {term}
                  </dt>
                  <dd className="mt-0.5 text-sm text-foreground">{desc}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
