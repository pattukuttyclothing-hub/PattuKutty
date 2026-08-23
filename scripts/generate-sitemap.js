import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = (process.env.SITE_URL || "https://pattukuttyclothing.com").replace(/\/$/, "");
const API_URL = (process.env.SITEMAP_API_URL || "http://localhost:3001/api/v1").replace(/\/$/, "");

const categories = [
  {
    id: "half-saree",
    subs: ["half-saree-classic", "lehenga", "pattu-pudavai"],
  },
  {
    id: "frocks",
    subs: ["normal-frocks", "wedding-frocks", "designer-frocks"],
  },
  {
    id: "sarees",
    subs: ["silk-sarees", "fancy-sarees", "designer-sarees"],
  },
  {
    id: "blouses",
    subs: ["bridal-blouses", "pattern-blouses", "designer-blouses"],
  },
];

// Seed product IDs mirror src/data/boutique.ts: `${sub.id}-${n}` for 4 designs per sub-category.
const staticProductIds = categories.flatMap((cat) =>
  cat.subs.flatMap((sub) => [1, 2, 3, 4].map((n) => `${sub}-${n}`)),
);


async function fetchDynamicProductIds() {
  try {
    const res = await fetch(`${API_URL}/storefront/products`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((p) => p.id).filter(Boolean);
      }
    }
  } catch {
    // Backend API offline during static build; fallback to seed product list
  }
  return [];
}

async function main() {
  const dynamicIds = await fetchDynamicProductIds();
  const allProductIds = Array.from(new Set([...staticProductIds, ...dynamicIds]));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- ── Homepage ───────────────────────────────────── -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

  // Categories & Subcategories
  categories.forEach((cat) => {
    xml += `
  <!-- ── Category: ${cat.id} ──────────────────────── -->
  <url>
    <loc>${BASE_URL}/category/${cat.id}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    cat.subs.forEach((sub) => {
      xml += `
  <url>
    <loc>${BASE_URL}/category/${cat.id}/${sub}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  });

  // Product Detail Pages
  xml += `\n\n  <!-- ── Product Detail Pages ───────────────────────── -->`;
  allProductIds.forEach((id) => {
    xml += `
  <url>
    <loc>${BASE_URL}/product/${id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `\n\n</urlset>\n`;

  const outputPath = path.join(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf-8");
  console.log(`Successfully generated sitemap.xml with ${allProductIds.length} product URLs at ${outputPath}`);
}

main();
