/**
 * SEO smoke check — run in CI against a running app.
 *
 *   SEO_SMOKE_BASE=http://localhost:8080 node scripts/seo-smoke.js
 *
 * What it does:
 *  1. Reads /sitemap.xml and crawls EVERY listed URL (home, categories,
 *     sub-categories, products) — not just a hand-picked sample.
 *  2. Per page: unique <title> under 60 chars, meta description under 155,
 *     exactly one self-referencing canonical, complete og:/twitter: cards with
 *     absolute images and correct dimensions where declared.
 *  3. Canonical consistency across http/https and with/without www, following
 *     redirect chains and asserting the final destination + canonical agree.
 *  4. JSON-LD: every block must parse, and WebSite / BreadcrumbList / Product
 *     blocks must carry their required fields in the right shape.
 *  5. robots.txt and sitemap.xml sanity.
 * Exits non-zero on any failure.
 *
 * Env:
 *   SEO_SMOKE_BASE   origin to crawl (default http://localhost:8080)
 *   SITE_URL         canonical production origin (default the live domain)
 *   SEO_SMOKE_PAGES  comma-separated paths to crawl INSTEAD of the sitemap
 *   SEO_SMOKE_LIMIT  cap on crawled sitemap URLs (default 0 = no cap)
 *   SEO_SMOKE_CONCURRENCY  parallel requests (default 8)
 */

const BASE = (process.env.SEO_SMOKE_BASE || "http://localhost:8080").replace(/\/$/, "");
const SITE_URL = (process.env.SITE_URL || "https://pattukuttyclothing.com").replace(/\/$/, "");
const TITLE_MAX = 60;
const DESC_MAX = 155;
const LIMIT = Number(process.env.SEO_SMOKE_LIMIT || 0);
const CONCURRENCY = Math.max(1, Number(process.env.SEO_SMOKE_CONCURRENCY || 8));

const failures = [];
const notes = [];
const seenTitles = new Map();
const seenImages = new Map();

const fail = (page, msg) => failures.push(`${page}: ${msg}`);
const note = (page, msg) => notes.push(`${page}: ${msg}`);

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1] : null;
};

/** Decode common HTML entities so length checks match what search engines see. */
const decodeEntities = (str) =>
  str
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

function parseHead(html) {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const meta = {};
  for (const tag of metas) {
    const key = attr(tag, "property") || attr(tag, "name");
    if (key) meta[key.toLowerCase()] = attr(tag, "content") ?? "";
  }
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const canonicals = links
    .filter((l) => (attr(l, "rel") || "").toLowerCase() === "canonical")
    .map((l) => attr(l, "href"));
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const jsonLd = [
    ...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((m) => m[1]);
  return { meta, canonicals, title: titleMatch ? titleMatch[1].trim() : null, jsonLd };
}

/* ── structured data ──────────────────────────────────────────────────── */

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isAbsoluteUrl = (v) => isNonEmptyString(v) && /^https?:\/\//.test(v);

/** Flatten @graph containers and arrays into a flat list of typed nodes. */
function flattenNodes(parsed) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (Array.isArray(node["@graph"])) node["@graph"].forEach(walk);
    if (node["@type"]) out.push(node);
  };
  walk(parsed);
  return out;
}

const typesOf = (node) => (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]);
const hasType = (node, type) => typesOf(node).includes(type);

function validateWebSite(node, f) {
  if (!isNonEmptyString(node.name)) f("WebSite schema missing name");
  if (!isAbsoluteUrl(node.url)) f("WebSite schema url must be absolute");
  const action = node.potentialAction;
  if (action) {
    const actions = Array.isArray(action) ? action : [action];
    for (const a of actions) {
      if (a["@type"] === "SearchAction" && !a.target) f("WebSite SearchAction missing target");
    }
  }
}

function validateBreadcrumbs(node, f, path) {
  const items = node.itemListElement;
  if (!Array.isArray(items) || items.length < 2) {
    f("BreadcrumbList needs at least 2 itemListElement entries");
    return;
  }
  const positions = [];
  items.forEach((it, i) => {
    if (it["@type"] !== "ListItem") f(`BreadcrumbList item ${i + 1} is not a ListItem`);
    if (!isNonEmptyString(it.name)) f(`BreadcrumbList item ${i + 1} missing name`);
    const item = typeof it.item === "object" && it.item ? it.item["@id"] : it.item;
    if (!isAbsoluteUrl(item)) f(`BreadcrumbList item ${i + 1} item must be an absolute URL`);
    else if (!item.startsWith(SITE_URL)) f(`BreadcrumbList item ${i + 1} is off-domain: ${item}`);
    if (typeof it.position !== "number") f(`BreadcrumbList item ${i + 1} missing numeric position`);
    else positions.push(it.position);
  });
  const expected = items.map((_, i) => i + 1).join(",");
  if (positions.length === items.length && positions.join(",") !== expected) {
    f(`BreadcrumbList positions are not sequential from 1 (got ${positions.join(",")})`);
  }
  const last = items[items.length - 1];
  const lastItem = typeof last.item === "object" && last.item ? last.item["@id"] : last.item;
  if (isAbsoluteUrl(lastItem)) {
    const lastPath = lastItem.slice(SITE_URL.length) || "/";
    if (lastPath.replace(/\/$/, "") !== path.replace(/\/$/, "")) {
      note(path, `BreadcrumbList tail points at ${lastPath} rather than the page itself`);
    }
  }
}

function validateProduct(node, f) {
  if (!isNonEmptyString(node.name)) f("Product schema missing name");
  const images = Array.isArray(node.image) ? node.image : node.image ? [node.image] : [];
  if (!images.length) f("Product schema missing image");
  for (const img of images) {
    if (!isAbsoluteUrl(img)) f(`Product schema image must be absolute: "${img}"`);
  }
  if (!isNonEmptyString(node.description)) f("Product schema missing description");
  const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
  if (!offers) {
    f("Product schema missing offers");
    return;
  }
  if (offers["@type"] && offers["@type"] !== "Offer" && offers["@type"] !== "AggregateOffer") {
    f(`Product offer has unexpected @type "${offers["@type"]}"`);
  }
  const price = offers.price ?? offers.lowPrice;
  if (price === undefined || price === null || price === "") f("Product offer missing price");
  else if (!/^\d+(\.\d+)?$/.test(String(price))) f(`Product offer price is malformed: "${price}"`);
  if (offers.priceCurrency !== "INR") f("Product offer currency is not INR");
  if (!/schema\.org\/(In|OutOf)Stock/.test(offers.availability || "")) {
    f("Product offer missing/malformed availability");
  }
  if (offers.url && !isAbsoluteUrl(offers.url)) f("Product offer url must be absolute");
}

function validateStructuredData(page, jsonLd) {
  const f = (msg) => fail(page, msg);
  const nodes = [];
  for (const raw of jsonLd) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      f("invalid JSON-LD block (does not parse)");
      continue;
    }
    const flat = flattenNodes(parsed);
    if (!flat.length) f("JSON-LD block has no @type node");
    for (const node of flat) {
      if (!isNonEmptyString(node["@context"]) && !parsed["@context"]) {
        note(page, `JSON-LD ${typesOf(node).join("/")} node has no @context`);
      }
      nodes.push(node);
    }
  }

  for (const node of nodes) {
    if (hasType(node, "WebSite")) validateWebSite(node, f);
    if (hasType(node, "BreadcrumbList")) validateBreadcrumbs(node, f, page);
    if (hasType(node, "Product")) validateProduct(node, f);
  }

  const types = nodes.flatMap(typesOf);
  if (page === "/") {
    if (!types.includes("WebSite")) f("missing WebSite structured data");
  } else if (!types.includes("BreadcrumbList")) {
    f("missing BreadcrumbList structured data");
  }
  if (page.startsWith("/product/") && !types.includes("Product")) {
    f("missing Product structured data");
  }
  return types;
}

/* ── per-page checks ──────────────────────────────────────────────────── */

async function checkPage(page) {
  const url = `${BASE}${page}`;
  let res;
  try {
    res = await fetch(url, { headers: { "user-agent": "seo-smoke/2.0" } });
  } catch (err) {
    fail(page, `request failed: ${err.message}`);
    return;
  }
  if (!res.ok) {
    fail(page, `HTTP ${res.status}`);
    return;
  }
  const html = await res.text();
  const { meta, canonicals, title, jsonLd } = parseHead(html);

  // Title
  if (!title) fail(page, "missing <title>");
  else {
    if (title.length > TITLE_MAX)
      fail(page, `title is ${title.length} chars (max ${TITLE_MAX}): "${title}"`);
    if (seenTitles.has(title)) fail(page, `duplicate title, also on ${seenTitles.get(title)}`);
    seenTitles.set(title, page);
  }

  // Description
  const desc = meta["description"];
  if (!desc) fail(page, "missing meta description");
  else if (desc.length > DESC_MAX)
    fail(page, `description is ${desc.length} chars (max ${DESC_MAX})`);
  else if (desc.length < 70) note(page, `description is short (${desc.length} chars)`);

  // Canonical — exactly one, self-referencing
  if (canonicals.length !== 1) fail(page, `expected 1 canonical, found ${canonicals.length}`);
  else {
    const expected = `${SITE_URL}${page}`;
    if (canonicals[0] !== expected)
      fail(page, `canonical is "${canonicals[0]}", expected "${expected}"`);
  }

  // OG / Twitter
  for (const key of [
    "og:title",
    "og:description",
    "og:type",
    "og:url",
    "og:image",
    "twitter:card",
    "twitter:title",
    "twitter:image",
  ]) {
    if (!meta[key]) fail(page, `missing ${key}`);
  }
  if (meta["og:url"] && meta["og:url"] !== `${SITE_URL}${page}`) {
    fail(page, `og:url "${meta["og:url"]}" does not self-reference the page`);
  }
  const ogImage = meta["og:image"];
  if (ogImage && !/^https?:\/\//.test(ogImage)) fail(page, `og:image must be absolute: "${ogImage}"`);
  if (ogImage && meta["twitter:image"] && ogImage !== meta["twitter:image"]) {
    fail(page, "og:image and twitter:image differ");
  }
  if (ogImage) {
    const brandCard = ogImage === `${SITE_URL}/og-cover.jpg`;
    if (page === "/" && !brandCard) {
      fail(page, "homepage should use the branded share card /og-cover.jpg");
    }
    if (page !== "/" && brandCard) {
      // A catalogue page with no photo of its own shares the homepage card.
      fail(page, "falls back to the brand share card instead of its own image");
    }
    if (!brandCard && seenImages.has(ogImage)) {
      note(page, `reuses the catalogue photo also on ${seenImages.get(ogImage)}`);
    }
    seenImages.set(ogImage, page);
  }
  // Declared dimensions, when present, must be the platform-recommended 1200x630.
  const w = meta["og:image:width"];
  const h = meta["og:image:height"];
  if ((w && !h) || (h && !w)) fail(page, "og:image:width/height must be declared together");
  if (w && h && !(w === "1200" && h === "630")) {
    fail(page, `og:image dimensions ${w}x${h} are not the recommended 1200x630`);
  }

  validateStructuredData(page, jsonLd);
}

/* ── canonical consistency across scheme/host variants ────────────────── */

/**
 * Follows the redirect chain manually so CI sees every hop, then asserts the
 * final URL and its canonical both point at the SITE_URL form of the page.
 * Locally (no DNS for the production host) the variants are simulated with the
 * standard proxy headers the deployment sets.
 */
async function checkCanonicalVariants(page) {
  const host = new URL(SITE_URL).host;
  const variants = [
    { label: "https", proto: "https", host },
    { label: "http", proto: "http", host },
    { label: "www", proto: "https", host: host.startsWith("www.") ? host.slice(4) : `www.${host}` },
  ];
  const expected = `${SITE_URL}${page}`;
  const results = [];

  for (const v of variants) {
    const chain = [];
    let target = `${BASE}${page}`;
    let canonical = null;
    let status = 0;
    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(target, {
        redirect: "manual",
        headers: {
          "user-agent": "seo-smoke/2.0",
          "x-forwarded-proto": v.proto,
          "x-forwarded-host": v.host,
        },
      });
      status = res.status;
      if (status >= 300 && status < 400) {
        const loc = res.headers.get("location");
        if (!loc) {
          fail(page, `${v.label}: ${status} redirect without a Location header`);
          break;
        }
        const next = new URL(loc, target).toString();
        chain.push(`${status} → ${next}`);
        if (next === target) {
          fail(page, `${v.label}: redirect loop at ${next}`);
          break;
        }
        target = next;
        continue;
      }
      canonical = parseHead(await res.text()).canonicals[0] ?? null;
      break;
    }

    if (status >= 400) fail(page, `${v.label}: final destination returned HTTP ${status}`);
    if (chain.length >= 4) fail(page, `${v.label}: redirect chain too long (${chain.join(" | ")})`);
    if (chain.length) note(page, `${v.label} redirect chain: ${chain.join(" | ")}`);
    if (canonical && canonical !== expected) {
      fail(page, `${v.label}: canonical is "${canonical}", expected "${expected}"`);
    }
    results.push(canonical);
  }

  const distinct = [...new Set(results.filter(Boolean))];
  if (distinct.length > 1) {
    fail(page, `canonical differs across scheme/host variants: ${distinct.join(" vs ")}`);
  }
}

/* ── files ────────────────────────────────────────────────────────────── */

async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    fail(path, `HTTP ${res.status}`);
    return null;
  }
  return res.text();
}

async function readSitemapPaths() {
  const body = await fetchText("/sitemap.xml");
  if (!body) return [];
  if (!body.includes("<urlset")) {
    fail("/sitemap.xml", "not a valid urlset");
    return [];
  }
  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!urls.length) fail("/sitemap.xml", "no URLs listed");
  if (!urls.includes(`${SITE_URL}/`)) fail("/sitemap.xml", "homepage missing");
  const products = urls.filter((u) => u.includes("/product/"));
  if (products.length < 40) {
    fail("/sitemap.xml", `only ${products.length} product URLs (expected the full catalogue)`);
  }
  const categories = urls.filter((u) => u.includes("/category/"));
  if (categories.length < 4) {
    fail("/sitemap.xml", `only ${categories.length} category URLs (expected every collection)`);
  }
  const offDomain = urls.filter((u) => !u.startsWith(SITE_URL));
  if (offDomain.length) fail("/sitemap.xml", `${offDomain.length} URLs are not on ${SITE_URL}`);
  const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
  if (dupes.length) fail("/sitemap.xml", `duplicate URLs: ${[...new Set(dupes)].join(", ")}`);

  const paths = [
    ...new Set(urls.filter((u) => u.startsWith(SITE_URL)).map((u) => u.slice(SITE_URL.length) || "/")),
  ];
  return LIMIT > 0 ? paths.slice(0, LIMIT) : paths;
}

async function checkRobots() {
  const body = await fetchText("/robots.txt");
  if (!body) return;
  if (/^\s*Disallow:\s*\/\s*$/im.test(body) && !/Allow:/i.test(body)) {
    fail("/robots.txt", "blocks all crawlers");
  }
  if (!/sitemap:/i.test(body)) fail("/robots.txt", "missing Sitemap: directive");
  const sitemapLine = body.match(/sitemap:\s*(\S+)/i);
  if (sitemapLine && !sitemapLine[1].startsWith(SITE_URL)) {
    fail("/robots.txt", `Sitemap points off-domain: ${sitemapLine[1]}`);
  }
}

/* ── runner ───────────────────────────────────────────────────────────── */

async function pool(items, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

const main = async () => {
  await checkRobots();

  const override = (process.env.SEO_SMOKE_PAGES || "").trim();
  const pages = override
    ? override.split(",").map((p) => p.trim()).filter(Boolean)
    : await readSitemapPaths();

  if (!pages.length) {
    console.error("SEO smoke check FAILED: no pages to crawl.");
    process.exit(1);
  }

  // Sorted so title-duplication reports are deterministic.
  pages.sort();
  await pool(pages, checkPage);

  // Redirect/canonical consistency is expensive — run it on one page per shape.
  const representative = [
    "/",
    pages.find((p) => /^\/category\/[^/]+\/?$/.test(p)),
    pages.find((p) => /^\/category\/[^/]+\/[^/]+$/.test(p)),
    pages.find((p) => p.startsWith("/product/")),
  ].filter(Boolean);
  for (const page of representative) await checkCanonicalVariants(page);

  for (const n of notes) console.log(`note  ${n}`);
  if (failures.length) {
    console.error(
      `\nSEO smoke check FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`,
    );
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(
    `\nSEO smoke check passed — ${pages.length} sitemap URLs crawled, ` +
      `${representative.length} canonical/redirect variants, robots.txt and sitemap.xml OK.`,
  );
};

main().catch((err) => {
  console.error("SEO smoke check crashed:", err);
  process.exit(1);
});
