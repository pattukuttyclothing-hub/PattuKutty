import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Storefront data stays fresh for 5 minutes across navigations —
        // navigating back to homepage within this window hits cache, not Supabase.
        staleTime: 5 * 60 * 1000,
        // Cache garbage-collected 10 minutes after the last subscriber unmounts.
        gcTime: 10 * 60 * 1000,
        // One automatic retry on transient network errors.
        retry: 1,
        // Don't re-fetch when user tabs back into the window — staleTime handles freshness.
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Allow link-hover preloads to serve from cache for 30 seconds.
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
