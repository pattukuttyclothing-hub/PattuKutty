import { useFeaturedProducts } from "@/lib/useStorefront";
import { ProductCard } from "./ProductCard";
import { SectionHeading } from "./Motifs";
import { Reveal, stagger } from "@/components/shared/Reveal";

export function FeaturedProducts() {
  const products = useFeaturedProducts();

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Made to Order"
          title="Featured Designs"
          subtitle="Every piece is stitched to your measurements. Pick a design, choose size and colour, then confirm on WhatsApp."
        />

        <div className="mt-10 grid grid-cols-2 items-stretch gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={stagger(i, 70)} className="h-full">
              <ProductCard product={p} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
