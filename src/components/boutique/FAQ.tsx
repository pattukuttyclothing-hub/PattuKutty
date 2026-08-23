import { faqs, services } from "@/data/aeo";
import { Reveal, stagger } from "@/components/shared/Reveal";
import { SectionHeading } from "./Motifs";

/**
 * FAQ section. Every heading is a real question; the first sentence of each
 * answer is the complete answer. Marked up as FAQPage JSON-LD from the route.
 */
export function FAQ() {
  return (
    <section id="faq" className="bg-blush py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Questions & Answers"
            title="Pattu Kutty — Frequently Asked Questions"
            subtitle="Direct answers about custom silk sarees, bridal wear, 1-hour stitching and delivery across India."
          />
        </Reveal>

        {/* Services stated as distinct, quotable answers */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={stagger(i, 90)}>
              <article className="h-full rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-soft">
                <h3 className="font-display text-base font-semibold text-foreground">{s.name}</h3>
                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {s.answer}
                </p>
                <p className="mt-2 text-[0.68rem] font-semibold tracking-[0.1em] text-primary uppercase">
                  {s.turnaround}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 divide-y divide-border/70 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={stagger(i, 60)}>
              <details className="group px-5 py-4 sm:px-6 sm:py-5" open={i < 2}>
                <summary className="cursor-pointer list-none">
                  <h3 className="font-display inline text-[1rem] font-semibold text-foreground sm:text-[1.05rem]">
                    {f.q}
                  </h3>
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
