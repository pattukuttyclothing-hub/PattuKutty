# Publish checklist — Pattu Kutty

Run top to bottom. Steps 4–6 must be repeated **after** the domain is connected,
because social platforms and Google cache the first version of a page they scrape.

## 1. Pre-publish (local / CI)

- [ ] `npm run test`
- [ ] `npm run sitemap` (regenerates `public/sitemap.xml`; the `build` script also does this)
- [ ] `npm run dev`, then `npm run seo:smoke` — must exit 0
- [ ] Confirm `SITE_URL` in the deploy environment matches the live domain
      (defaults to `https://pattukuttyclothing.com`; it drives every canonical,
      `og:url`, sitemap entry and the smoke check)

## 2. Publish

- [ ] Publish the project, then connect the custom domain
- [ ] Wait for DNS + certificate to go green

## 3. Live file checks

- [ ] `https://<domain>/robots.txt` loads and lists the `Sitemap:` line
- [ ] `https://<domain>/sitemap.xml` loads and lists all 4 categories,
      12 sub-categories and every product URL
- [ ] `SEO_SMOKE_BASE=https://<domain> node scripts/seo-smoke.js` exits 0

## 4. Refresh social caches (re-run after domain connect)

Run each of these for the homepage, one category page, one sub-category page and
two product pages:

- [ ] **Facebook / WhatsApp / Instagram** — [Sharing Debugger](https://developers.facebook.com/tools/debug/)
      → paste URL → **Scrape Again**. WhatsApp and Instagram read the same
      Open Graph cache, so this one action refreshes all three.
- [ ] **X / Twitter** — [Card Validator](https://cards-dev.twitter.com/validator)
      (or post the link in a draft) → confirm `summary_large_image` renders the
      right image and title.
- [ ] **LinkedIn** (optional) — [Post Inspector](https://www.linkedin.com/post-inspector/)

Expected: homepage shows the branded 1200×630 card (`/og-cover.jpg`); category
and product pages show their own outfit photo; titles are under 60 chars and
descriptions under 155.

## 5. Validate structured data (re-run after domain connect)

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) —
      homepage (Organization / ClothingStore / WebSite), a category page
      (BreadcrumbList), a product page (Product + BreadcrumbList, with price and
      availability)
- [ ] [Schema.org validator](https://validator.schema.org/) — same pages, zero errors

## 6. Search Console

- [ ] Add and verify the domain property
- [ ] Submit `https://<domain>/sitemap.xml`
- [ ] Request indexing for the homepage and the 4 category pages

## Notes

- Caches: a changed `og:image` or title will not appear in already-shared links
  until the platform re-scrapes. The debuggers in step 4 force that refresh —
  there is no other way to speed it up.
- Re-run steps 4 and 5 any time the share card, page titles or descriptions change.
