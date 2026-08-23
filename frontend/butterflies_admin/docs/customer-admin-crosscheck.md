# Customer ↔ Admin Cross-Check — **decisions applied**

Inputs: `page-data-map.md` (customer app) · `docs/admin-backend-spec.md` (admin app) ·
`final_db_schema_2.txt`. This version records what we build, what we drop, and what is
already handled. It supersedes the earlier delta list.

---

## 0. Decision summary

| Area | Decision |
|---|---|
| Hero banners, stats strip, "Stitch It Your Way" cards, testimonials, About block/badges/hours/Instagram | **Maintenance-handled.** Tables exist for storage, but **no admin CRUD page**. Changed by us on request, billed as maintenance. |
| Hero / featured / reels rail *ordering* | Featured + Reels reorder already exists in admin ✅. Hero ordering = maintenance, **no admin form**. |
| Category / sub-category **blurb** | Written once at setup, **maintenance**. No admin editor. |
| Category / sub-category **images** | Handled by us (maintenance) — customer app reads `hero_image_url`. |
| Timeline `from_price` / badge / note | **Dropped as a separate feature.** Merged into the product form as a per-product blurb field (see §2). |
| Sizes / colours mismatch | **Fix now** — shared lookup tables. |
| Custom colour upload | **Fix now** — admin request detail must render it. |
| Request statuses | **Fix now** — one lookup with a `customer_label`. |
| Quote varies by timeline | **Already handled**, no change (see §3). |
| Order stages 9 vs 5 | **Fix now** — 9 customer-visible rows, 5 admin-controlled. |
| WhatsApp wishlist/cart audience | **Dropped** (client-side storage). Purchase-history segments only. |
| Missing admin reads (notes, landmark, payment ref, AWB, cancel reason) | **Fix now** — critical. |

---

## 1. Storefront content — storage only, no admin UI

Create the tables so content is data-driven, seed them once, and edit via migration:

`hero_banners`, `home_stats`, `home_highlights`, `testimonials`,
`store_badges`, plus `store_settings` columns `address_line`, `instagram_handle`,
`hours_weekday`, `hours_sunday`, `about_story`, `about_image_url`, and
`categories.blurb / hero_image_url / position`, `sub_categories.blurb / hero_image_url / position`.

All get `position INTEGER NOT NULL DEFAULT 0` (non-unique) and are read
`ORDER BY position, created_at`. **No admin routes, no reorder RPC for these.**
Reordering stays only where the admin already has it: `featured_slots.position`,
`reel_products.sort_order`, `product_images.sort_order`.

## 2. Product page — variants and the new blurb

**"15 size & colour variants"** on the product card is not a mystery field: it is
`COUNT(*)` over `product_variants` for that product (sizes × colours), and the editor's
stock grid is one cell per row. Nothing extra is needed — the read comes from
`v_product_admin.variant_count`, and each cell writes
`product_variants(product_id, size, colour, stock)`.

Add to the product form (replaces the timeline `from_price`/badge idea):

- `products.blurb TEXT` — the short line shown under the name on customer cards.
- `products.badge TEXT NULL` — optional tag ("Most Loved", "Specialised").
- `products.express_from_price NUMERIC NULL` — the "from ₹X" the customer sees for the
  express timeline on that design.

`stitching_timelines` stays a plain label lookup — no per-timeline pricing table.

## 3. Sizes, colours, statuses, quotes

1. **Sizes** — `sizes(code, label, position, is_custom)`; both apps read it;
   `product_variants.size` FKs to it instead of a CHECK list. Seed with the customer
   set (`XS, S, M, L, XL, Custom`) plus `XXL`, `Free Size` for stock garments.
2. **Colours** — `colours(name, hex, position)` is the single source for both apps.
   Add `custom_requests.custom_colour_image_url`; the **admin request detail must render
   it** next to the reference images, labelled "Customer's colour upload". Also surface
   it in the requests list as a small chip so it is never missed.
3. **Statuses** — keep the 7 DB values; add `request_statuses(code, admin_label,
   customer_label, position)` so the customer app never re-derives its 4 labels.
4. **Quotes by timeline — already handled, no change.** The customer picks *one*
   timeline (1 hr / 1 day / 2 day / 3 day) and one fulfilment mode (pickup / doorstep)
   **inside the request**; the admin request detail reads both and quotes a single price
   with delivery fee derived from the chosen mode. That is exactly the current
   `custom_requests.timeline_id + fulfilment` → `custom_request_quotes` model.
   **Do not add `custom_request_quote_options`.** The "₹3,499–₹5,499 by timeline" copy on
   the customer marketing page is a static range, not a quote.

## 4. Order stages — 9 customer rows, 5 admin buttons

`order_stages(code, customer_label, admin_label, position, is_admin_controlled)` seeded with:

```text
booked*            confirmed*        in_production*   qc
packed*            picked_up         in_transit       out_for_delivery
delivered
(* = is_admin_controlled = true → the 5 buttons the admin already has)
```

- Admin writes `order_stage_events(order_id, stage_code, actor, note, created_at)` for its 5.
- Courier scans land in `shipment_scans(shipment_id, stage_code, location, scanned_at)`.
- Customer tracking = union of both, ordered by `order_stages.position`.
- `orders.stage` stays a denormalised "latest" for list filtering.

## 5. Missing admin reads — build these

| Field | Where it must appear in admin |
|---|---|
| `addresses.landmark`, `address_type`, `is_default` | order detail address block |
| `orders.customer_notes` | order detail, above items ("Customer's fit notes") |
| `orders.payment_ref`, `payment_attempted_at` | order detail payment row + orders list column |
| `shipments(courier, service, awb, origin_hub, expected_date)` | order detail — **AWB entry field**, not read-only |
| `custom_requests.cancel_reason`, `cancelled_at` | request detail banner |
| `custom_requests.update_requested_at` | "Update requested" flag on request list + detail |
| `custom_requests.reference_image_urls`, `voice_note_url`, `custom_colour_image_url` | request detail media block |
| `customers(user_id, full_name, phone, district)` + `on_auth_user_created` trigger | every name/phone shown today |

`customers.district` is derived from the default address pincode, never typed by hand.

## 6. Dropped

- Wishlist/cart-based WhatsApp audiences (client-side storage). Segments come from
  orders and requests only.
- `custom_request_quote_options`.
- Per-timeline `from_price` / badge / note columns on `stitching_timelines`.
- Admin CRUD pages for hero, stats, highlights, testimonials, about, taxonomy.
- `reorder_rail()` generic RPC — only the three existing rails reorder, each with its own
  small update.

## 7. Unchanged from `admin-backend-spec.md`

Products / variants / images, orders + order_items, `custom_request_quotes` core, reels,
featured slots, and the whole `wa_*` WhatsApp layer.

---

### Order of work
1. Lookups (`sizes`, `colours`, `request_statuses`, `order_stages`) + `customers` + trigger.
2. Missing columns on `orders`, `addresses`, `custom_requests`, `products`; `shipments`,
   `shipment_scans`, `order_stage_events`.
3. Storefront content tables, seeded (no admin UI).
4. Views + functions, then migrate admin pages: Products → Requests → Orders → Reels → WhatsApp.
