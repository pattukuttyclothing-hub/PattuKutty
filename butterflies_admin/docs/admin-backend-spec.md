# Butterflies Tailoring — Admin App: Mock → Real Data Specification

Purpose: remove **every** mock value from the admin app. This document lists, page by
page, each individual data point rendered on screen, where it must come from in the
database, what the API contract is, and what is **missing** from the uploaded schema
(`final_db_schema_2.txt`, which was designed for the customer app only).

Legend:
- ✅ = already available in the uploaded schema
- ⚠️ = derivable, but needs a view / join / aggregate to be practical
- ❌ = **not in the schema** — new table / column / view required

---

## 0. Current mock sources (to be deleted at the end of migration)

| File | What it fakes |
|---|---|
| `src/data/boutique.ts` | store info, GST/delivery settings, categories, sub-categories, 48 seeded products, colour swatches, sizes, timelines, Cloudinary image pools |
| `src/data/reels.ts` | 4 reels + 8 featured product ids |
| `src/lib/admin-store.tsx` | localStorage-persisted products/requests/orders + all mutations |
| `src/lib/whatsapp-notify.ts` | campaigns, audiences (hash-generated sizes), districts, funnels (`funnel()` math), `ALL_CUSTOMERS.size = 1420` |

Everything below replaces these.

---

## 1. Page-by-page data inventory

### 1.1 Dashboard — `/` (`src/routes/index.tsx`)

| Data point on screen | Source | Status |
|---|---|---|
| Studio eyebrow ("Coimbatore Studio") | `store_settings` (needs `store_name`, `area`, `tagline`) | ❌ columns |
| "Good morning, **Revathi**" | logged-in admin's display name | ❌ (`auth.users` has email only) |
| Tile 1: count of requests with `status='submitted'` | `custom_requests` | ✅ |
| Tile 2: orders in stage `placed`/`confirmed` + how many are custom | `orders` (+ `is_custom` flag) | ⚠️ `is_custom` ❌ |
| Tile 3: products with any variant at/below `low_stock_threshold` | `products` × `product_variants` | ⚠️ needs view |
| Tile 4: revenue this month (paid, non-cancelled) | `orders` | ⚠️ aggregate |
| "Waiting on you" rail: request cards | `custom_requests` sorted status→date | ✅ |
| "Recent orders" rail: order cards | `orders` newest first | ✅ |
| "Running low" rail: 12 lowest-stock products | low-stock view | ⚠️ |

**One endpoint** should serve this whole page (`GET /api/admin/dashboard`) so the
page is a single round-trip.

### 1.2 Products list — `/products`

Per card: product id, name, first image, category + sub name, base price, MRP,
total stock across variants, min-stock/low-stock flag, active toggle.

| Field | Source | Status |
|---|---|---|
| id, slug, name, description, base_price, low_stock_threshold, is_active | `products` | ✅ |
| **MRP / strike-through price** | — | ❌ add `products.mrp` |
| category name, sub name | `categories`, `sub_categories` | ✅ |
| images (ordered) | `product_images.sort_order` | ✅ |
| total stock, per-colour stock | `product_variants.stock_qty` | ⚠️ aggregate |
| rating / review count (if shown later) | `products.avg_rating`, `review_count` | ✅ |

### 1.3 Product editor — `/products/$id`

Adds: per-size × per-colour stock grid, colour→image mapping, image upload,
colour swatch palette, size option list, GST preview from store settings.

| Field | Source | Status |
|---|---|---|
| variant grid (size, colour, stock) | `product_variants` | ✅ |
| colour palette (name + hex) | `colours` | ✅ |
| allowed sizes | `product_variants.size` CHECK list — expose via `GET /api/admin/meta` | ⚠️ better as a `sizes` lookup table |
| **colour → hero image mapping** | — | ❌ add `product_images.colour_id` (nullable) |
| image upload target | Cloud storage bucket + `product_images` row | ❌ storage bucket + upload endpoint |
| GST %, delivery fee, free-above | `store_settings` (`free_above` ❌) | ⚠️ |

### 1.4 Requests list — `/requests` and detail `/requests/$id`

| Field | Source | Status |
|---|---|---|
| request_no, status, created_at, fabric_notes, reference_image_urls, timeline | `custom_requests`, `stitching_timelines` | ✅ |
| **customer name, phone** | `auth.users` has email only | ❌ needs `customers` profile table |
| **category + sub-category of the request** | — | ❌ add `category_id`, `sub_category_id` |
| **colour requested** | — | ❌ add `colour_id` |
| **size, qty** | `measurements` JSONB only | ❌ add `size`, `qty` columns |
| **fulfilment (pickup / doorstep)** | — | ❌ add `fulfilment` CHECK column |
| **voice note URL** | — | ❌ add `voice_note_url` |
| quote (name, size, price, gst, delivery, total, ready_by, quoted_at) | `custom_request_quotes` | ✅ |
| **customer's uploaded colour swatch** | — | ❌ add `custom_requests.custom_colour_image_url` — rendered in the media block + chip in the list |
| **cancel reason / cancelled_at** | — | ❌ add columns; shown as a banner on the detail |
| **"update requested" flag** | — | ❌ add `update_requested_at`; badge on list + detail |
| "send quote on WhatsApp" action | writes quote + logs message | ⚠️ see §3.4 |


### 1.5 Orders list — `/orders` and detail `/orders/$id`

| Field | Source | Status |
|---|---|---|
| order_no, stage, payment_method, payment_status, subtotal, gst_amount, delivery_fee, total, created_at | `orders` | ✅ |
| items: name/size/colour snapshot, unit_price, qty | `order_items` | ✅ |
| **item thumbnail image** | — | ⚠️ join `product_variants → product_images` (add `image_url_snapshot` for history safety) |
| address line1, city, state, pincode | `addresses` | ✅ |
| **landmark, address_type, is_default** | — | ❌ add columns; full address block on the detail |
| **customer's fit notes** | — | ❌ add `orders.customer_notes`; shown above the items |
| **Razorpay payment ref + attempted_at** | — | ❌ add `orders.payment_ref`, `payment_attempted_at`; detail payment row + list column |
| **courier / AWB / expected date** | — | ❌ `shipments` table; AWB is an **editable field** on the detail |
| **customer name, phone** | — | ❌ `customers` table |
| **is_custom + linked request_no** | — | ❌ add `orders.custom_request_id` |
| stage timeline labels/hints | `order_stages` lookup (9 rows, 5 admin-controlled) | ❌ see §2.2b |
| stage change action | `UPDATE orders.stage` + audit row | ⚠️ add `order_stage_events` |


### 1.6 Reels & Featured — `/reels`, `/reels/edit`, `/reels/featured`

| Field | Source | Status |
|---|---|---|
| reel video URL, sort order, linked product | `reel_products` | ✅ |
| **reel title** | — | ❌ add `reel_products.title` |
| **reel active/published flag, thumbnail/poster** | — | ❌ add `is_active`, `poster_url` |
| featured product list + order | `featured_slots` | ✅ |
| featured card data (name, image, price) | `products` join | ✅ |
| video upload | storage bucket | ❌ |

### 1.7 WhatsApp Studio — `/whatsapp`, `/whatsapp/send/$itemId`, `/whatsapp/item/$itemId`, `/whatsapp/broadcast`, `/whatsapp/analytics/$notificationId`

**This entire feature has zero backing in the schema.** Everything below is ❌.

Screen data: campaigns sent count, campaigns in last 48h, total viewers, click
rate, orders attributed, per-campaign card (item name/image/price/MRP/discount,
audience label + size, note, sent_on), message funnel (delivered/opened/clicked),
business funnel (reached/visited/bought), district-wise visitor bar chart,
audience picker options with real contact counts, custom broadcast (name,
image, message).

Real replacements:
- **Audience sizes** must be real counts (`COUNT(DISTINCT customer_id)` of buyers
  of that sub-category / category), not `segmentSize()` hashing.
- **Funnels** must come from real delivery webhooks + click tracking, not
  `funnel()` math.
- **Districts** must come from the customer's address pincode/city on the click
  or resulting order, not `decay()`.

---

## 2. Schema changes required

### 2.1 New columns on existing tables

```sql
ALTER TABLE products            ADD COLUMN mrp INTEGER CHECK (mrp >= base_price);
ALTER TABLE product_images      ADD COLUMN colour_id INTEGER REFERENCES colours(id);
ALTER TABLE store_settings      ADD COLUMN store_name   VARCHAR(120) NOT NULL DEFAULT 'Butterflies Tailoring',
                                ADD COLUMN tagline      VARCHAR(200),
                                ADD COLUMN area         VARCHAR(120),
                                ADD COLUMN whatsapp_no  VARCHAR(15),
                                ADD COLUMN free_above   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products            ADD COLUMN blurb TEXT,                      -- short line under the name
                                ADD COLUMN badge VARCHAR(40),               -- "Most Loved" / "Specialised"
                                ADD COLUMN express_from_price INTEGER;      -- "from ₹X" for the express timeline
ALTER TABLE custom_requests     ADD COLUMN category_id     UUID REFERENCES categories(id),
                                ADD COLUMN sub_category_id UUID REFERENCES sub_categories(id),
                                ADD COLUMN colour_id       INTEGER REFERENCES colours(id),
                                ADD COLUMN size            VARCHAR(20),
                                ADD COLUMN qty             INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
                                ADD COLUMN fulfilment      TEXT CHECK (fulfilment IN ('pickup','doorstep')),
                                ADD COLUMN voice_note_url  TEXT,
                                ADD COLUMN custom_colour_image_url TEXT,
                                ADD COLUMN cancel_reason   TEXT,
                                ADD COLUMN cancelled_at    TIMESTAMPTZ,
                                ADD COLUMN update_requested_at TIMESTAMPTZ;
ALTER TABLE orders              ADD COLUMN custom_request_id UUID REFERENCES custom_requests(id),
                                ADD COLUMN customer_notes    TEXT,
                                ADD COLUMN payment_ref       VARCHAR(80),
                                ADD COLUMN payment_attempted_at TIMESTAMPTZ;
ALTER TABLE addresses           ADD COLUMN landmark     VARCHAR(160),
                                ADD COLUMN address_type TEXT CHECK (address_type IN ('home','work','other')),
                                ADD COLUMN is_default   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE order_items         ADD COLUMN image_url_snapshot TEXT;
ALTER TABLE reel_products       ADD COLUMN title VARCHAR(120),
                                ADD COLUMN poster_url TEXT,
                                ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

### 2.1b Lookups, shipments and storefront content

```sql
-- Shared lookups: one source of truth for both apps (fixes the size/colour/status drift).
CREATE TABLE sizes            (code VARCHAR(12) PRIMARY KEY, label VARCHAR(30) NOT NULL,
                               position INT NOT NULL DEFAULT 0, is_custom BOOLEAN NOT NULL DEFAULT FALSE);
CREATE TABLE request_statuses (code TEXT PRIMARY KEY, admin_label TEXT NOT NULL,
                               customer_label TEXT NOT NULL, position INT NOT NULL DEFAULT 0);
CREATE TABLE order_stages     (code TEXT PRIMARY KEY, admin_label TEXT, customer_label TEXT NOT NULL,
                               position INT NOT NULL DEFAULT 0,
                               is_admin_controlled BOOLEAN NOT NULL DEFAULT FALSE);
-- 9 rows: booked*, confirmed*, in_production*, qc, packed*, picked_up, in_transit,
--         out_for_delivery, shipped*/delivered   (* = the 5 the admin can set)

-- Courier layer: admin enters the AWB, scans arrive from the courier.
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier VARCHAR(60), service VARCHAR(60), awb VARCHAR(60),
  origin_hub VARCHAR(80), expected_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE shipment_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  stage_code TEXT NOT NULL REFERENCES order_stages(code),
  location VARCHAR(120), scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Storefront content: STORAGE ONLY — no admin CRUD page, edited by us as maintenance.
CREATE TABLE hero_banners   (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), image_url TEXT NOT NULL,
                             eyebrow TEXT, headline TEXT, subtext TEXT, cta_label TEXT, cta_link TEXT,
                             position INT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE home_stats      (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), label TEXT, value TEXT, position INT NOT NULL DEFAULT 0);
CREATE TABLE home_highlights (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), icon TEXT, title TEXT, blurb TEXT,
                              kind TEXT, position INT NOT NULL DEFAULT 0);
CREATE TABLE testimonials    (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, initials TEXT,
                              rating INT, quote TEXT, position INT NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE store_badges    (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), icon TEXT, label TEXT, position INT NOT NULL DEFAULT 0);

ALTER TABLE store_settings   ADD COLUMN address_line TEXT, ADD COLUMN instagram_handle TEXT,
                             ADD COLUMN hours_weekday TEXT, ADD COLUMN hours_sunday TEXT,
                             ADD COLUMN about_story TEXT, ADD COLUMN about_image_url TEXT;
ALTER TABLE categories       ADD COLUMN blurb TEXT, ADD COLUMN hero_image_url TEXT, ADD COLUMN position INT NOT NULL DEFAULT 0;
ALTER TABLE sub_categories   ADD COLUMN blurb TEXT, ADD COLUMN hero_image_url TEXT, ADD COLUMN position INT NOT NULL DEFAULT 0;
```

All content tables are `SELECT TO anon` (public storefront read) + admin-all; positions are
non-unique and read `ORDER BY position, created_at`.


### 2.2 New tables

```sql
-- Customer profile: name + phone the admin actually displays everywhere.
CREATE TABLE customers (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(120) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  city        VARCHAR(80),
  district    VARCHAR(80),
  wa_opt_in   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_customers_phone ON customers(phone);

-- Admin display name for the greeting + "quoted_by" attribution.
CREATE TABLE admin_profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   VARCHAR(120) NOT NULL,
  avatar_url  TEXT
);

-- Order stage audit (who moved it, when) — powers the timeline UI honestly.
CREATE TABLE order_stage_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage       TEXT NOT NULL,
  changed_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- WhatsApp Studio ----------------
CREATE TABLE wa_campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_no    VARCHAR(20) UNIQUE NOT NULL DEFAULT next_daily_number('WN'),
  product_id     UUID REFERENCES products(id),      -- NULL for freeform broadcast
  custom_name    VARCHAR(160),
  custom_image   TEXT,
  custom_message TEXT,
  audience_kind  TEXT NOT NULL CHECK (audience_kind IN ('all','sub_category','category')),
  audience_ref   TEXT,                              -- slug of the sub/category
  audience_label VARCHAR(120) NOT NULL,
  audience_size  INTEGER NOT NULL,                  -- frozen at send time
  note           TEXT,
  status         TEXT NOT NULL DEFAULT 'queued'
                   CHECK (status IN ('queued','sending','sent','failed')),
  sent_by        UUID NOT NULL REFERENCES auth.users(id),
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per recipient: the ONLY honest source of the message funnel.
CREATE TABLE wa_campaign_recipients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES wa_campaigns(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id),
  phone         VARCHAR(15) NOT NULL,
  wa_message_id VARCHAR(80),
  status        TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','sent','delivered','read','failed')),
  delivered_at  TIMESTAMPTZ,
  read_at       TIMESTAMPTZ,
  clicked_at    TIMESTAMPTZ,
  error_text    TEXT,
  UNIQUE (campaign_id, customer_id)
);
CREATE INDEX idx_wa_recipients_campaign ON wa_campaign_recipients(campaign_id);

-- Click / visit attribution from the tracked short link in the message.
CREATE TABLE wa_campaign_clicks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES wa_campaigns(id) ON DELETE CASCADE,
  customer_id  UUID REFERENCES customers(id),
  district     VARCHAR(80),
  order_id     UUID REFERENCES orders(id),   -- set when the visit converts
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_clicks_campaign ON wa_campaign_clicks(campaign_id);
```

Every new public-schema table needs its grants + RLS in the same migration:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT ALL ON public.<table> TO service_role;
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
-- admin-only tables:
CREATE POLICY <t>_admin ON public.<t> FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
```

`wa_*`, `order_stage_events`, `admin_profiles`, `daily_counters` → admin-only.
`customers` → owner-read + admin-all.

### 2.3 Views (keep the API thin)

```sql
-- Product row exactly as both admin list and editor need it.
CREATE VIEW v_admin_products AS
SELECT p.id, p.slug, p.name, p.description, p.base_price, p.mrp, p.is_active,
       p.low_stock_threshold, c.slug AS category_slug, c.name AS category_name,
       s.slug AS sub_slug, s.name AS sub_name,
       COALESCE(SUM(v.stock_qty),0)          AS total_stock,
       COUNT(v.id)                           AS variant_count,
       COALESCE(MIN(v.stock_qty),0)          AS min_stock,
       (COALESCE(MIN(v.stock_qty),0) <= p.low_stock_threshold) AS is_low_stock,
       (SELECT url FROM product_images pi WHERE pi.product_id = p.id
         ORDER BY sort_order LIMIT 1)        AS hero_image
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN sub_categories s ON s.id = p.sub_category_id
LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active
GROUP BY p.id, c.slug, c.name, s.slug, s.name;

-- Order header + customer + address, one row per order.
CREATE VIEW v_admin_orders AS
SELECT o.*, cu.full_name AS customer_name, cu.phone AS customer_phone,
       a.line1, a.city, a.state, a.pincode,
       (o.custom_request_id IS NOT NULL) AS is_custom,
       cr.request_no
FROM orders o
JOIN customers cu ON cu.id = o.customer_id
JOIN addresses a  ON a.id = o.address_id
LEFT JOIN custom_requests cr ON cr.id = o.custom_request_id;

-- Request header + customer + taxonomy + current quote.
CREATE VIEW v_admin_requests AS
SELECT r.*, cu.full_name AS customer_name, cu.phone AS customer_phone,
       c.name AS category_name, s.name AS sub_name, col.name AS colour_name, col.hex AS colour_hex,
       q.name AS quote_name, q.price, q.gst_amount, q.delivery_fee,
       q.total_payable, q.ready_by, q.quoted_at
FROM custom_requests r
JOIN customers cu ON cu.id = r.customer_id
LEFT JOIN categories c ON c.id = r.category_id
LEFT JOIN sub_categories s ON s.id = r.sub_category_id
LEFT JOIN colours col ON col.id = r.colour_id
LEFT JOIN custom_request_quotes q ON q.request_id = r.id AND q.is_current;

-- Real audience sizes (replaces segmentSize()).
CREATE VIEW v_audience_sizes AS
SELECT s.slug AS ref, 'sub_category' AS kind, COUNT(DISTINCT o.customer_id) AS size
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.payment_status <> 'failed'
JOIN product_variants v ON v.id = oi.variant_id
JOIN products p ON p.id = v.product_id
JOIN sub_categories s ON s.id = p.sub_category_id
GROUP BY s.slug
UNION ALL
SELECT c.slug, 'category', COUNT(DISTINCT o.customer_id)
FROM order_items oi
JOIN orders o ON o.id = oi.order_id AND o.payment_status <> 'failed'
JOIN product_variants v ON v.id = oi.variant_id
JOIN products p ON p.id = v.product_id
JOIN categories c ON c.id = p.category_id
GROUP BY c.slug;

-- Campaign funnel, computed not invented.
CREATE VIEW v_campaign_stats AS
SELECT k.id AS campaign_id,
       COUNT(r.*) FILTER (WHERE r.status IN ('sent','delivered','read'))  AS delivered,
       COUNT(r.*) FILTER (WHERE r.read_at IS NOT NULL)                    AS opened,
       COUNT(r.*) FILTER (WHERE r.clicked_at IS NOT NULL)                 AS clicked,
       (SELECT COUNT(*) FROM wa_campaign_clicks cl WHERE cl.campaign_id = k.id)                          AS visited,
       (SELECT COUNT(*) FROM wa_campaign_clicks cl WHERE cl.campaign_id = k.id AND cl.order_id IS NOT NULL) AS bought
FROM wa_campaigns k
LEFT JOIN wa_campaign_recipients r ON r.campaign_id = k.id
GROUP BY k.id;
```

### 2.4 Functions / procedures

| Function | Why |
|---|---|
| `admin_dashboard()` returns JSON | single round-trip for `/` (4 tiles + 3 rails) |
| `save_product(jsonb)` | upsert product + images + variants atomically (the editor saves all three together) |
| `adjust_stock(variant_id, delta, reason)` | writes `product_variants` **and** `stock_adjustments` in one transaction — never a bare UPDATE |
| `send_quote(request_id, jsonb)` | flips old quote `is_current=false`, inserts new one, sets `custom_requests.status='quoted'` |
| `set_order_stage(order_id, stage)` | update + `order_stage_events` audit row |
| `resolve_audience(kind, ref)` returns customer set | used both for the picker count and for fan-out at send time |
| `next_daily_number('WN')` | already exists ✅ — reuse for campaign numbers |
| `reorder_featured(uuid[])` / `reorder_reels(uuid[])` | rewrite `sort_order` in one statement |

---

## 3. API surface

All admin endpoints are TanStack `createServerFn` with `.middleware([requireSupabaseAuth])`
plus an in-handler `has_role(uid,'admin')` check. Webhooks are TSS server routes
under `src/routes/api/public/*` with signature verification.

### 3.1 Reference / meta
| Endpoint | Returns |
|---|---|
| `getStoreMeta` | store_settings, categories + subs, colours, sizes, stitching timelines, order-stage config |
| `getAdminProfile` | admin full_name (dashboard greeting) |

### 3.2 Catalogue
| Endpoint | Notes |
|---|---|
| `listProducts({ search, category, sub, lowStockOnly, page })` | from `v_admin_products` |
| `getProduct({ id })` | product + ordered images (+colour_id) + variants + colours |
| `saveProduct({ product, images, variants })` | calls `save_product()` |
| `createProduct(...)` / `setProductActive({id, isActive})` | |
| `adjustStock({ variantId, delta, reason })` | writes audit row |
| `uploadProductImage(file)` | storage bucket → returns URL, then `product_images` row |

### 3.3 Requests
| Endpoint | Notes |
|---|---|
| `listRequests({ status })` | `v_admin_requests` |
| `getRequest({ id })` | + reference images + voice note URL |
| `sendQuote({ requestId, name, price, deliveryFee, readyBy })` | `send_quote()`; GST computed server-side from `store_settings`, never trusted from the client |
| `setRequestStatus({ id, status })` | |

### 3.4 Orders
| Endpoint | Notes |
|---|---|
| `listOrders({ stage, page })` / `getOrder({ id })` | `v_admin_orders` + items |
| `setOrderStage({ id, stage })` | `set_order_stage()`; `delivered` is courier-driven, block manual set |

### 3.5 Storefront sections
| Endpoint | Notes |
|---|---|
| `listReels` / `createReel` / `updateReel` / `deleteReel` / `reorderReels` | `reel_products` |
| `listFeatured` / `setFeatured({ productIds })` | `featured_slots`, rewrite sort order |

### 3.6 WhatsApp Studio
| Endpoint | Notes |
|---|---|
| `getWhatsAppOverview` | campaign count, 48h count, viewers, click rate, orders attributed, recent rail |
| `getAudiences({ productId })` | `v_audience_sizes` — real counts for "All Customers", "Bought <Sub> before", "Bought any <Category>" |
| `previewCampaign({ productId, note })` | exact rendered message body |
| `sendCampaign({ productId, audienceKind, audienceRef, note })` | insert `wa_campaigns`, fan out `wa_campaign_recipients`, enqueue provider send |
| `sendCustomCampaign({ name, image, message, audience, note })` | same, product_id NULL |
| `getCampaignReport({ id })` | `v_campaign_stats` + district breakdown from `wa_campaign_clicks` |
| `POST /api/public/webhooks/whatsapp` | provider delivery/read receipts → update recipients (HMAC-verified) |
| `GET  /api/public/wa/c/:campaignId/:recipientId` | tracked link: log click + district, then 302 to the design page |

Response shapes stay flat DTOs (no ORM objects, no Dates — ISO strings) so they
serialize through SSR.

---

## 4. Honest gaps you must decide on

1. **Customer identity** — the schema has no name/phone anywhere. Every admin
   screen shows both. `customers` is mandatory, not optional.
2. **Districts** — currently invented. Real ones require capturing the district on
   the click (IP/pincode) or deriving from the customer's default address; that
   is an approximation, and the UI should label it as such.
3. **"Orders attributed"** — only truthful with a tracked link + attribution
   window (suggest: order placed within 72h of a campaign click).
4. **Delivered stage** — marked non-admin-controlled in the UI; without a courier
   integration nothing will ever set it. Either wire the courier webhook or make
   it manual and drop the "automatic" copy.
5. **MRP** — the storefront shows discounts off MRP but no column exists; adding
   `products.mrp` is required or the discount UI must go.
6. **Product ids** — mock ids are slugs (`lehenga-1`); the DB uses UUID PKs with a
   `slug` column. Admin routes should switch to UUIDs (or resolve by slug).

---

## 5. Suggested migration order

1. Enable Lovable Cloud; apply the customer schema.
2. Migration A: new columns + `customers` + `admin_profiles` + grants/RLS.
3. Migration B: views + functions (§2.3, §2.4).
4. Seed real catalogue data (categories, subs, colours, timelines, store_settings,
   products/images/variants) via literal INSERTs in a migration.
5. Replace `admin-store.tsx` with server functions + TanStack Query, page by page:
   products → requests → orders → reels/featured → dashboard.
6. Migration C: `wa_*` tables; build the WhatsApp endpoints + webhook last.
7. Delete `src/data/boutique.ts`, `src/data/reels.ts`, and all seed helpers.

---

## 6. Decisions folded in (from the customer-app cross-check)

See `docs/customer-admin-crosscheck.md` for the full rationale. Net effect on this spec:

**Added (build these):**
- `custom_requests.custom_colour_image_url`, `cancel_reason`, `cancelled_at`, `update_requested_at` — all surfaced on the request detail; colour-upload also as a list chip.
- `orders.customer_notes`, `payment_ref`, `payment_attempted_at`; `addresses.landmark`, `address_type`, `is_default`.
- `shipments` + `shipment_scans`; the order detail gets an **editable AWB / courier** block.
- Lookups `sizes`, `request_statuses`, `order_stages` (9 rows, 5 admin-controlled) — plus the existing `colours` table is the single source for both apps.
- `products.blurb`, `products.badge`, `products.express_from_price` — edited on the product form. This replaces the per-timeline pricing idea entirely.
- Storefront content tables (§2.1b) as **storage only**.

**Dropped (do not build):**
- Admin CRUD pages for hero banners, stats, highlights, testimonials, about block, taxonomy blurbs/images — maintenance-handled by us.
- Generic `reorder_rail()` RPC and hero ordering UI; only Featured + Reels reorder (already built) plus `product_images.sort_order`.
- `custom_request_quote_options` — **quotes-by-timeline is already handled**: the customer picks one timeline and one fulfilment mode inside the request, and the admin quotes one price against it. No change to `custom_request_quotes`.
- Per-timeline `from_price` / badge / note on `stitching_timelines`.
- Wishlist/cart WhatsApp audiences (client-side storage) — purchase-history segments only.

**Clarification — "15 size & colour variants":** not a stored number. It is
`COUNT(*)` over `product_variants` for the product (sizes × colours), exposed as
`v_admin_products.variant_count`; the editor's stock grid is one cell per row.

**Frontend status:** none of the §6 "Added" fields exist in the admin UI yet — the
pages still render `admin-store.tsx` mock data. Building them is the next step,
either against mocks now or directly against Lovable Cloud once it is enabled.
