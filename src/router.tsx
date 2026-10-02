import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Storefront data stays fresh for 10 seconds across navigations —
        // rapid clicks hit cache, but stock and sold out updates reflect quickly.
        staleTime: 10 * 1000,
        // Cache garbage-collected 5 minutes after the last subscriber unmounts.
        gcTime: 5 * 60 * 1000,
        // One automatic retry on transient network errors.
        retry: 1,
        // Re-fetch when user tabs back into the window so stock and sold out changes reflect.
        refetchOnWindowFocus: true,
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
