import lockupAsset from "@/assets/pattu-kutty-lockup.png.asset.json";
import lockupLightAsset from "@/assets/pattu-kutty-lockup-light.png.asset.json";
import lockupGoldAsset from "@/assets/pattu-kutty-lockup-gold.png.asset.json";
import markAsset from "@/assets/pattu-kutty-mark.png.asset.json";
import markGoldAsset from "@/assets/pattu-kutty-mark-gold.png.asset.json";

export const brandAssets = {
  lockup: lockupAsset.url,
  lockupLight: lockupLightAsset.url,
  lockupGold: lockupGoldAsset.url,
  mark: markAsset.url,
  markGold: markGoldAsset.url,
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
