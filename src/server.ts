import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage, type ErrorDetail } from "./lib/error-page";

/** Extract a human-useful ErrorDetail from any thrown value */
function extractDetail(error: unknown, component: string): ErrorDetail {
  if (error instanceof Error) {
    const msg = error.message || String(error);
    // Detect Supabase / env config errors
    if (msg.includes("Missing Supabase environment variable")) {
      return {
        component: "SupabaseClient",
        message: msg,
        hint: "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in Cloudflare Build Variables.",
      };
    }
    // Detect favicon / asset 404 masking as 500
    if (msg.toLowerCase().includes("favicon") || msg.toLowerCase().includes("asset")) {
      return { component: "AssetLoader", message: msg, hint: "A static asset (favicon/image) failed to load. Check /public and R2 bucket config." };
    }
    return { component, message: msg };
  }
  return { component, message: String(error) };
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const captured = consumeLastCapturedError();
  const detail: ErrorDetail = captured instanceof Error
    ? extractDetail(captured, "SSR / h3 Handler")
    : { component: "SSR / h3 Handler", message: `h3 swallowed SSR error: ${body}`, hint: "A provider (Auth, Cart, Orders, Wishlist, Requests) threw during server-side render." };

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(detail), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: any, ctx: any) {
    try {
      if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
        const url = new URL(request.url);
        if (url.pathname.includes(".") || url.pathname === "/favicon.ico") {
          const assetRes = await env.ASSETS.fetch(request);
          if (assetRes && assetRes.status !== 404) {
            return assetRes;
          }
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error: any) {
      console.error("Worker fetch exception:", error?.stack || error?.message || error);
      return new Response(renderErrorPage(extractDetail(error, "Worker / SSR Entry")), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
