import logoHeader from "@/assets/LOGO -Header.png";
import logoFooter from "@/assets/Logo Footer.png";

export const brandAssets = {
  header: logoHeader,
  footer: logoFooter,
  lockup: logoHeader,
  lockupLight: logoHeader,
  lockupGold: logoFooter,
  mark: logoHeader,
  markGold: logoFooter,
};

/**
 * Brand mark — the embroidered dancer from the Pattu Kutty logo.
 * `tone="light"` returns the gold-thread variant for dark surfaces.
 */
export function BrandMark({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <img
      src={tone === "light" ? brandAssets.markGold : brandAssets.mark}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={`select-none object-contain ${className}`}
      draggable={false}
    />
  );
}

/** Full horizontal lockup: dancer + Pattu Kutty + பட்டு குட்டி. */
export function BrandLockup({
  className = "",
  tone = "dark",
  priority = false,
}: {
  className?: string;
  tone?: "dark" | "light" | "gold";
  priority?: boolean;
}) {
  const src =
    tone === "gold"
      ? brandAssets.lockupGold
      : tone === "light"
        ? brandAssets.lockupLight
        : brandAssets.lockup;
  return (
    <img
      src={src}
      alt="Pattu Kutty"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
