import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { BRAND, OG_IMAGE, SITE_URL } from "../lib/seo";
import { ENTITY_DEFINITION } from "../data/aeo";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import { WishlistProvider } from "../lib/wishlist";
import { RequestsProvider } from "../lib/requests";
import { OrdersProvider } from "../lib/orders";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  // Derive a helpful sub-message from the error
  const msg = error?.message || String(error);
  let component = "App";
  let hint: string | null = null;

  if (msg.includes("Missing Supabase environment variable") || msg.includes("SUPABASE")) {
    component = "SupabaseClient";
    hint = "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in your .env / Cloudflare Build Variables.";
  } else if (msg.includes("useAuth") || msg.includes("AuthProvider")) {
    component = "AuthProvider";
    hint = "The Auth context was used outside its provider. Ensure <AuthProvider> wraps the component tree.";
  } else if (msg.includes("useCart") || msg.includes("CartProvider")) {
    component = "CartProvider";
    hint = "The Cart context was used outside its provider.";
  } else if (msg.includes("useWishlist") || msg.includes("WishlistProvider")) {
    component = "WishlistProvider";
    hint = "The Wishlist context was used outside its provider.";
  } else if (msg.includes("useRequests") || msg.includes("RequestsProvider")) {
    component = "RequestsProvider";
    hint = "The Requests context was used outside its provider.";
  } else if (msg.includes("useOrders") || msg.includes("OrdersProvider")) {
    component = "OrdersProvider";
    hint = "The Orders context was used outside its provider.";
  } else if (msg.toLowerCase().includes("favicon") || msg.toLowerCase().includes("asset")) {
    component = "AssetLoader";
    hint = "A static asset (favicon / image) failed to load. Check /public and R2 CDN config.";
  } else if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
    component = "Network / API Call";
    hint = "A network request failed. Check if the backend worker is running and CORS is configured.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>

        {/* ── Diagnostic sub-message panel ── */}
        <div className="mt-4 text-left rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs space-y-1.5">
          <p className="font-semibold text-destructive uppercase tracking-wide text-[0.65rem]">🔍 Diagnostic Info</p>
          <div className="flex gap-2">
            <span className="min-w-[5rem] font-semibold text-muted-foreground">Component</span>
            <code className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 break-all font-mono text-[0.7rem]">{component}</code>
          </div>
          <div className="flex gap-2 items-start">
            <span className="min-w-[5rem] font-semibold text-muted-foreground">Error</span>
            <code className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 break-all font-mono text-[0.7rem]">{msg}</code>
          </div>
          {hint && (
            <div className="flex gap-2 items-start">
              <span className="min-w-[5rem] font-semibold text-muted-foreground">Hint</span>
              <span className="italic text-muted-foreground">{hint}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#951A1F" },
      { title: "Pattu Kutty — Women's Boutique in Coimbatore" },
      { name: "description", content: "Custom stitched women's clothing in Coimbatore — blouses, bridal lehengas, half sarees and silk sarees, express stitching, shipped across India." },
      { name: "author", content: "Pattu Kutty" },
      { property: "og:site_name", content: "Pattu Kutty" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:site", content: "@pattu.kutty" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: BRAND.name,
        legalName: BRAND.legalName,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.png`,
        image: OG_IMAGE,
        description: ENTITY_DEFINITION,
        telephone: BRAND.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: BRAND.street,
          addressLocality: BRAND.city,
          addressRegion: "Tamil Nadu",
          postalCode: BRAND.postalCode,
          addressCountry: "IN",
        },
        areaServed: { "@type": "Country", name: "India" },
        sameAs: [BRAND.instagram],
      },
      {
        "@type": ["ClothingStore", "LocalBusiness"],
        "@id": `${SITE_URL}/#store`,
        name: BRAND.name,
        url: SITE_URL,
        image: OG_IMAGE,
        telephone: BRAND.phone,
        priceRange: "₹₹",
        currenciesAccepted: "INR",
        description: ENTITY_DEFINITION,
        slogan: "Custom women's clothing in Coimbatore, stitched in as fast as 1 hour.",
        address: {
          "@type": "PostalAddress",
          streetAddress: BRAND.street,
          addressLocality: BRAND.city,
          addressRegion: "Tamil Nadu",
          postalCode: BRAND.postalCode,
          addressCountry: "IN",
        },
        geo: { "@type": "GeoCoordinates", latitude: 11.0168, longitude: 76.9558 },
        areaServed: { "@type": "Country", name: "India" },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
            opens: "09:30",
            closes: "20:30",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Sunday",
            opens: "10:00",
            closes: "14:00",
          },
        ],
        makesOffer: [
          "Custom blouse stitching",
          "Bridal lehenga stitching",
          "Half saree and pattu pavadai sets",
          "Silk and designer sarees",
          "1-hour express stitching",
          "Full garment customisation",
        ].map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, areaServed: "India" },
        })),
        sameAs: [BRAND.instagram],
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <WishlistProvider>
        <RequestsProvider>
          <CartProvider>
            <OrdersProvider>
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </OrdersProvider>
          </CartProvider>
        </RequestsProvider>
      </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
