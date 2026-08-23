# Merge plan: new customer frontend → existing Pattu Kutty stack

## What I found

**full-project.zip** — `Pattu_Kutty_Project-main/`
- `backend/` — Express + TypeScript API, mounted at `/api/v1` (auth, catalogue, requests, orders, marketing, customer, dashboard). Supabase for DB/auth, Razorpay, Blue Dart, Cloudflare R2, n8n webhooks. Port 3001.
- `frontend/butterflies_admin/` — admin TanStack Start app.
- `frontend/butterflies_customer/` — customer TanStack Start app (this is the one being redesigned).

Customer → backend wiring today:
- `src/lib/api/client.ts` — base URL `VITE_API_BASE_URL` (default `http://localhost:3001/api/v1`), attaches Supabase access token, on 401 clears the token and redirects to `/auth`.
- `src/integrations/supabase/client.ts` — browser Supabase client, throws if `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` missing.
- `src/integrations/supabase/auth-middleware.ts` — `requireSupabaseAuth` for server functions.
- `src/lib/auth.tsx` — AuthProvider, profile load, `requireAuth(action)` gate that redirects to `/auth?next=…`.

**new-frontend.zip** — a redesign of `butterflies_customer` itself, not a foreign codebase. Same routes, same `src/lib` API layer, same `src/integrations`. 139 files vs 125; only additions and edits, no removals.

Changed files fall into three buckets:
1. **Pure visual/UI** (keep as-is): Hero, Navbar, Footer, About, Collections, Carousel3D, Motifs, ReelsCarousel, Reviews, Customisation, FeaturedProducts, ProductCard, Page, Brand, Reveal, OrderCelebration, SubmissionCelebration, StudioSpotlight, `styles.css` (237 → 652 lines), new logo assets, `use-reveal` hook, a11y test + vitest setup.
2. **Preview mocks that MUST be stripped** (`src/lib/preview-mock.ts`, `PREVIEW_MODE = true`) — currently touching: `lib/auth.tsx` (fake signed-in user, auth gate bypass), `lib/api/client.ts` (suppresses the 401 → `/auth` redirect), `lib/requests.tsx` (fake request creation instead of `POST /requests`), `routes/cart.tsx`, `routes/wishlist.tsx`, `routes/orders.index.tsx`, `routes/orders.$id.tsx`, `routes/requests.index.tsx`, `routes/requests.$id.tsx`.
3. **Env/regressions to revert** — the new `supabase/client.ts` swallows missing credentials and returns an inert "offline" client (silent data loss in production) and drops the `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` fallbacks; `auth-middleware.ts` likewise dropped its fallbacks. `useStorefront.ts` now falls back to hardcoded seed products whenever the API returns an empty list.

## Plan

**a) Removed:** the whole old `butterflies_customer/src`, `public`, and its `package.json`/config — replaced by the new frontend's equivalents. `backend/` and `butterflies_admin/` untouched.

**b) Placement:** new frontend becomes the customer app in the same slot, keeping the existing repo layout.

**c) Backend wiring:** no rewiring needed — the new frontend already ships the identical `src/lib/api/*`, `src/lib/auth.tsx`, `src/lib/orders.ts`, `src/lib/requests.tsx`, `src/lib/useStorefront.ts` modules calling the same `/api/v1` endpoints (`/storefront/*`, `/products`, `/featured`, `/reels`, `/requests*`, `/orders*`, `/customer/*`). Work is restoring the paths the mocks short-circuit:
- `requests.tsx` submit → real `POST /api/v1/requests` (+ `/requests/upload-media`)
- `cart`, `wishlist` → real local cart/wishlist state only
- `orders.index` / `orders.$id` → `GET /api/v1/orders`, `/orders/:id`
- `requests.index` / `requests.$id` → `GET /api/v1/requests`, `/requests/:id`
- `auth.tsx` → real Supabase session; `requireAuth` redirects to `/auth?next=…` again
- `api/client.ts` → restore 401 → clear token → `/auth` redirect

**d) Mismatches:** none in data shape — the new UI consumes the same types. The three regressions in bucket 3 get reverted to the old, fail-loud behaviour: Supabase client throws on missing env, anon-key fallbacks restored, and featured/storefront queries stop masking an empty API response with seed data (seed data stays only as the pre-fetch placeholder).

**e) Env vars:** no new names. Existing: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`), `VITE_CLOUDFLARE_R2_PUBLIC_URL`. Nothing hardcoded. Note: the credentials file you pasted in chat contains a live **service-role key** and Razorpay/Blue Dart secrets — those are exposed and should be rotated regardless of this merge.

## Verification after merge
Typecheck + build, vitest suite, then page-by-page: home/storefront, category, product, cart, wishlist, design studio submit, auth sign-in/out and protected redirects, orders list/detail, requests list/detail, 404 and error boundary. I'll report each with its result and flag anything that needs a live backend to confirm.

## One decision I need from you
This Lovable project currently holds a blank template, and a Lovable project runs exactly one app. Where should the merged result live? (see the question below)
