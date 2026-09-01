import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useCategories } from "@/lib/useStorefront";
import { findCategory } from "@/data/boutique";
import { SectionHeading } from "./Motifs";
import { Reveal, stagger } from "@/components/shared/Reveal";

export function Collections() {
  const categories = useCategories();

  return (
    <section id="collections" className="relative overflow-hidden bg-blush py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Our Collections"
          title="Shop by Category"
          subtitle="Tap a collection to browse the designs we stitch, with photos straight from the studio."
        />

        <div className="mt-10 flex flex-wrap justify-center gap-4 sm:mt-12 sm:gap-6 lg:gap-8">
          {categories.map((c, i) => {
            const designCount =
              c.designCount != null
                ? c.designCount
                : c.design_count != null
                  ? c.design_count
                  : c.subs.reduce((sum, s) => sum + (s.designCount || 0), 0);

            return (
              <Reveal
                key={c.id}
                delay={stagger(i, 80)}
                className="w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1.35rem)] max-w-[420px] min-w-[260px]"
              >
                <Link
                  to="/category/$category"
                  params={{ category: c.id }}
                  aria-label={`${c.name} — view designs`}
                  className="card-lift group relative flex aspect-[4/5] sm:aspect-[3/3.8] w-full flex-col justify-end overflow-hidden rounded-3xl bg-card text-left shadow-lift ring-1 ring-accent/15 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:ring-accent/45 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >

                  <img
                    src={
                      c.image && c.image.startsWith("http")
                        ? c.image
                        : findCategory(c.id)?.image || c.image
                    }
                    alt={`${c.name} collection at Pattu Kutty`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-maroon/92 via-maroon/45 to-maroon/5 transition-opacity duration-500 group-hover:from-maroon/95" />
                  {/* gold sheen sweep */}
                  <div className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-accent/25 to-transparent transition-transform duration-[1100ms] ease-out group-hover:translate-x-[120%]" />

                  {designCount > 0 ? (
                    <span className="absolute top-2.5 left-2.5 z-10 rounded-full border border-accent/40 bg-background/85 px-2.5 py-1 text-[0.58rem] font-bold tracking-[0.12em] text-primary uppercase backdrop-blur-sm sm:top-4 sm:left-4 sm:text-[0.62rem]">
                      {designCount} {designCount === 1 ? "design" : "designs"}
                    </span>
                  ) : null}

                  <div className="relative z-10 p-3.5 sm:p-6">
                    <h3 className="font-display text-base leading-snug font-semibold text-primary-foreground sm:text-2xl">
                      {c.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[0.68rem] leading-relaxed text-primary-foreground/80 sm:mt-1.5 sm:text-sm">
                      {c.blurb}
                    </p>
                    <span className="mt-2.5 inline-flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.18em] text-accent uppercase sm:mt-4 sm:text-[0.68rem]">
                      View Designs
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-accent/50 transition-all duration-300 group-hover:bg-accent group-hover:text-maroon sm:h-6 sm:w-6">
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
