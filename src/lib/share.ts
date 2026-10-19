import { toast } from "sonner";
import { SITE_URL } from "./seo";

export function getProductShareUrl(productId: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/product/${productId}`;
  }
  return `${SITE_URL}/product/${productId}`;
}

export async function shareProduct(productId: string, productName?: string): Promise<void> {
  const url = getProductShareUrl(productId);
  const title = productName ? `${productName} — Pattu Kutty` : "Pattu Kutty";
  const text = productName ? `Take a look at ${productName} on Pattu Kutty:` : "Take a look at this on Pattu Kutty:";

  // Prefer Web Share API when supported (e.g. mobile Safari / Chrome)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return;
      }
    }
  }

  // Fallback: Copy link to clipboard
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    toast.success("Product link copied to clipboard!", {
      description: url,
    });
  } catch {
    toast.info("Product link:", {
      description: url,
    });
  }
}
