import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage, type ErrorDetail } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    const detail: ErrorDetail = error instanceof Error
      ? {
          component: "RequestMiddleware / ServerFn",
          message: error.message,
          hint: "A server function or middleware threw an unhandled error. Check AuthProvider, CartProvider, or API route.",
        }
      : { component: "RequestMiddleware", message: String(error) };
    return new Response(renderErrorPage(detail), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
