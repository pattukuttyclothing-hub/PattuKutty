/**
 * Continuously scrolling image strip (no 3D) — used inside sub-category cards.
 * `offset` staggers each card so no two strips look alike.
 */
export function MarqueeStrip({
  images,
  alt,
  speed = 26,
  offset = 0,
  className = "",
  reverse = false,
}: {
  images: string[];
  alt: string;
  speed?: number;
  offset?: number;
  className?: string;
  reverse?: boolean;
}) {
  const loop = [...images, ...images];
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="flex h-full w-max gap-2"
        style={{
          animation: `marquee-x ${speed}s linear infinite${reverse ? " reverse" : ""}`,
          animationDelay: `-${offset}s`,
        }}
      >
        {loop.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={alt}
            loading="lazy"
            className="h-full w-28 shrink-0 rounded-xl object-cover sm:w-32"
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
    </div>
  );
}
