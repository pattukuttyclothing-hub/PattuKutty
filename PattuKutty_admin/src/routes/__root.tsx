import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AdminStoreProvider } from "../lib/admin-store";

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

function parseStackFrame(stack?: string): { file: string; line: string } | null {
  if (!stack) return null;
  const match = stack.match(/(?:at\s+(?:\S+\s+)?\(?)([^\s()]+\.[jt]sx?):(\d+):\d+/);
  if (!match || !match[1] || !match[2]) return null;
  const file = match[1].replace(/^\/.*\/src\//, "src/").replace(/^\/.*\/dist\//, "dist/");
  return { file, line: match[2] };
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const msg = error?.message || String(error);
  const stack = (error as any)?.stack as string | undefined;
  const cause = (error as any)?.cause;
  const causeMsg = cause instanceof Error ? cause.message : (cause ? String(cause) : null);
  const frame = parseStackFrame(stack);

  let component = "AdminApp";
  let hint: string | null = null;

  if (msg.includes("Missing Supabase environment variable") || msg.includes("SUPABASE")) {
    component = "SupabaseClient";
    hint = "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in the admin Cloudflare Build Variables.";
  } else if (msg.includes("useAdmin") || msg.includes("AdminStore")) {
    component = "AdminStoreProvider";
    hint = "The Admin Store context was used outside its provider. Ensure <AdminStoreProvider> wraps the component tree.";
  } else if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized") || msg.includes("Forbidden")) {
    component = "AdminAuth";
    hint = "The admin session token is missing or expired. Log out and log back in.";
  } else if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
    component = "Network / API Call";
    hint = "A network request failed. Check if the backend worker is running and CORS is configured.";
  } else if (!frame || !stack || stack.trim() === msg) {
    component = "SSR / h3 Handler";
    hint = "The crash happened during module initialisation (before React rendered). Check env variables and top-level module imports.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Admin panel didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Check the diagnostic info below.
        </p>

        {/* ── Diagnostic sub-message panel ── */}
        <div className="mt-4 text-left rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs space-y-1.5">
          <p className="font-semibold text-destructive uppercase tracking-wide text-[0.65rem]">🔍 Diagnostic Info</p>

          <div className="flex gap-2 items-start">
            <span className="min-w-[5rem] shrink-0 font-semibold text-muted-foreground">Component</span>
            <code className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 break-all font-mono text-[0.7rem]">{component}</code>
          </div>

          <div className="flex gap-2 items-start">
            <span className="min-w-[5rem] shrink-0 font-semibold text-muted-foreground">Error</span>
            <code className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 break-all font-mono text-[0.7rem]">{msg}</code>
          </div>

          {frame && (
            <div className="flex gap-2 items-start">
              <span className="min-w-[5rem] shrink-0 font-semibold text-muted-foreground">Location</span>
              <code className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 break-all font-mono text-[0.7rem]">
                {frame.file} : line {frame.line}
              </code>
            </div>
          )}

          {causeMsg && (
            <div className="flex gap-2 items-start">
              <span className="min-w-[5rem] shrink-0 font-semibold text-muted-foreground">Cause</span>
              <code className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 break-all font-mono text-[0.7rem]">{causeMsg}</code>
            </div>
          )}

          {hint && (
            <div className="flex gap-2 items-start">
              <span className="min-w-[5rem] shrink-0 font-semibold text-muted-foreground">Hint</span>
              <span className="italic text-muted-foreground">{hint}</span>
            </div>
          )}

          {stack && (
            <details className="mt-1">
              <summary className="cursor-pointer text-[0.65rem] uppercase tracking-wide text-muted-foreground font-semibold select-none">
                Full stack trace ▸
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[0.65rem] text-muted-foreground leading-4 max-h-48 overflow-y-auto">
                {stack}
              </pre>
            </details>
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
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("butterflies_admin_token");
      if (!token && location.pathname !== "/login") {
        throw redirect({
          to: "/login",
          search: { next: location.pathname },
        });
      }
      if (token && location.pathname === "/login") {
        throw redirect({ to: "/" });
      }
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Pattu Kutty — Admin Console" },
      {
        name: "description",
        content:
          "Admin console for Pattu Kutty: catalogue stock, custom design quotations and order stages.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&family=Poppins:wght@300;400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "shortcut icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AdminStoreProvider>
          {children}
          <Scripts />
        </AdminStoreProvider>
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AdminStoreProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" richColors />
      </AdminStoreProvider>
    </QueryClientProvider>
  );
}
