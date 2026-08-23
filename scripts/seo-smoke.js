/**
 * SEO smoke check — run in CI against a running app.
 *
 *   SEO_SMOKE_BASE=http://localhost:8080 node scripts/seo-smoke.js
 *
 * Validates, per key page:
 *  - unique <title> under 60 chars
 *  - meta description present and under 155 chars
 *  - a single self-referencing canonical
 *  - og:/twitter: card completeness, absolute image URLs, unique images where
 *    a page should have its own (product/category vs the brand share card)
 *  - BreadcrumbList markup on non-home pages
 *  - JSON-LD parses, and Product schema carries offers/price/availability
 * Exits non-zero on any failure.
 */

const BASE = (process.env.SEO_SMOKE_BASE || "http://localhost:8080").replace(/\/$/, "");
const SITE_URL = (process.env.SITE_URL || "https://pattukuttyclothing.com").replace(/\/$/, "");
const TITLE_MAX = 60;
const DESC_MAX = 155;

const PAGES = (process.env.SEO_SMOKE_PAGES || "").trim()
  ? process.env.SEO_SMOKE_PAGES.split(",").map((p) => p.trim())
  : [
      "/",
      "/category/blouses/",
      "/category/blouses/bridal-blouses",
      "/category/sarees/",
      "/product/bridal-blouses-1",
    ];

const failures = [];
const notes = [];
const seenTitles = new Map();
const seenImages = new Map();

const fail = (page, msg) => failures.push(`${page}: ${msg}`);

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1] : null;
};

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
  const jsonLd = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]);
  return { meta, canonicals, title: titleMatch ? titleMatch[1].trim() : null, jsonLd };
}

async function checkPage(page) {
  const url = `${BASE}${page}`;
  const res = await fetch(url, { headers: { "user-agent": "seo-smoke/1.0" } });
  if (!res.ok) {
    fail(page, `HTTP ${res.status}`);
    return;
  }
  const html = await res.text();
  const { meta, canonicals, title, jsonLd } = parseHead(html);

  // Title
  if (!title) fail(page, "missing <title>");
  else {
    if (title.length > TITLE_MAX) fail(page, `title is ${title.length} chars (max ${TITLE_MAX}): "${title}"`);
    if (seenTitles.has(title)) fail(page, `duplicate title, also on ${seenTitles.get(title)}`);
    seenTitles.set(title, page);
  }

  // Description
  const desc = meta["description"];
  if (!desc) fail(page, "missing meta description");
  else if (desc.length > DESC_MAX) fail(page, `description is ${desc.length} chars (max ${DESC_MAX})`);
  else if (desc.length < 70) notes.push(`${page}: description is short (${desc.length} chars)`);

  // Canonical — exactly one, self-referencing
  if (canonicals.length !== 1) fail(page, `expected 1 canonical, found ${canonicals.length}`);
  else {
    const expected = `${SITE_URL}${page}`;
    if (canonicals[0] !== expected) fail(page, `canonical is "${canonicals[0]}", expected "${expected}"`);
  }

  // OG / Twitter
  for (const key of ["og:title", "og:description", "og:type", "og:url", "og:image", "twitter:card", "twitter:title", "twitter:image"]) {
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
    if (page !== "/" && brandCard) {
      notes.push(`${page}: falls back to the brand share card (no page-specific image)`);
    }
    if (!brandCard && seenImages.has(ogImage)) {
      fail(page, `og:image is not unique, also used by ${seenImages.get(ogImage)}`);
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

  // Structured data
  const graphs = [];
  for (const raw of jsonLd) {
    try {
      graphs.push(JSON.parse(raw));
    } catch {
      fail(page, "invalid JSON-LD block");
    }
  }
  const types = graphs.flatMap((g) => (Array.isArray(g) ? g : [g])).map((g) => g["@type"]);
  if (page !== "/" && !types.includes("BreadcrumbList")) {
    fail(page, "missing BreadcrumbList structured data");
  }
  if (page.startsWith("/product/")) {
    const product = graphs.find((g) => g["@type"] === "Product");
    if (!product) fail(page, "missing Product structured data");
    else {
      if (!product.name) fail(page, "Product schema missing name");
      if (!product.image?.length) fail(page, "Product schema missing image");
      const offers = product.offers;
      if (!offers) fail(page, "Product schema missing offers");
      else {
        if (!offers.price) fail(page, "Product offer missing price");
        if (offers.priceCurrency !== "INR") fail(page, "Product offer currency is not INR");
        if (!/schema\.org\/(In|OutOf)Stock/.test(offers.availability || "")) {
          fail(page, "Product offer missing availability");
        }
      }
    }
  }
  if (page === "/" && !types.includes("WebSite")) fail(page, "missing WebSite structured data");
}

async function checkFile(path, assertions) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    fail(path, `HTTP ${res.status}`);
    return;
  }
  const body = await res.text();
  assertions(body, (msg) => fail(path, msg));
}

const main = async () => {
  for (const page of PAGES) await checkPage(page);

  await checkFile("/robots.txt", (body, f) => {
    if (/^\s*Disallow:\s*\/\s*$/im.test(body) && !/Allow:/i.test(body)) f("blocks all crawlers");
    if (!/sitemap:/i.test(body)) f("missing Sitemap: directive");
  });

  await checkFile("/sitemap.xml", (body, f) => {
    if (!body.includes("<urlset")) f("not a valid urlset");
    const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (!urls.length) f("no URLs listed");
    if (!urls.some((u) => u === `${SITE_URL}/`)) f("homepage missing");
    const products = urls.filter((u) => u.includes("/product/"));
    if (products.length < 40) f(`only ${products.length} product URLs (expected the full catalogue)`);
    const offDomain = urls.filter((u) => !u.startsWith(SITE_URL));
    if (offDomain.length) f(`${offDomain.length} URLs are not on ${SITE_URL}`);
  });

  for (const n of notes) console.log(`note  ${n}`);
  if (failures.length) {
    console.error(`\nSEO smoke check FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(`\nSEO smoke check passed — ${PAGES.length} pages, robots.txt and sitemap.xml OK.`);
};

main().catch((err) => {
  console.error("SEO smoke check crashed:", err);
  process.exit(1);
});
