import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Product image viewer: big slide + thumbnail rail below. */
export function ProductGallery({
  images,
  alt,
  overlay,
}: {
  images: string[];
  alt: string;
  overlay?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const list = images?.filter(Boolean) ?? [];
  useEffect(() => setI(0), [list.join("|")]);
  const n = list.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);

  if (!n) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-card border border-border flex items-center justify-center text-muted-foreground text-xs shadow-lift">
        No photo available
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-[3/4] sm:aspect-[3/4] lg:aspect-[3/4.2] w-full overflow-hidden rounded-3xl bg-card border border-border/70 shadow-lift min-h-[380px] sm:min-h-[460px] lg:min-h-[580px] max-h-[600px] lg:max-h-[720px]">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {images.map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              src={src}
              alt={`${alt} — view ${idx + 1}`}
              loading={idx === 0 ? "eager" : "lazy"}
              className="h-full w-full shrink-0 object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          ))}
        </div>

        {overlay ? <div className="absolute top-3 right-3 z-10">{overlay}</div> : null}

        {n > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-primary shadow-soft transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-primary shadow-soft transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i ? "w-6 bg-primary" : "w-1.5 bg-card/80"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {n > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button
              key={`${src}-thumb-${idx}`}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show image ${idx + 1}`}
              className={`shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                idx === i ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" loading="lazy" className="h-20 w-16 object-cover object-top rounded-xl border border-border/60" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
