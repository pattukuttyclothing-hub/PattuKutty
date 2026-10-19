import { toast } from "sonner";

export function getProductStorefrontUrl(productId: string): string {
  if (typeof window !== "undefined") {
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isDev) {
      return `http://${window.location.hostname}:5173/product/${productId}`;
    }
  }
  return `https://pattukuttyclothing.com/product/${productId}`;
}

export async function shareProduct(productId: string, productName?: string): Promise<void> {
  const url = getProductStorefrontUrl(productId);
  const title = productName ? `${productName} — Pattu Kutty` : "Pattu Kutty";
  const text = productName ? `Take a look at ${productName} on Pattu Kutty:` : "Take a look at this on Pattu Kutty:";

  // Prefer Web Share API when supported
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
    toast.info("Storefront product link:", {
      description: url,
    });
  }
}
