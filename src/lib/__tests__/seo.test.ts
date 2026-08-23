import { describe, expect, it } from "vitest";
import {
  DESC_MAX,
  OG_IMAGE,
  SITE_URL,
  TITLE_MAX,
  seoDescription,
  seoTitle,
  socialMeta,
} from "@/lib/seo";

const metaValue = (meta: ReturnType<typeof socialMeta>, key: string) => {
  const entry = meta.find(
    (m) => (m as Record<string, string>)["name"] === key || (m as Record<string, string>)["property"] === key,
  ) as Record<string, string> | undefined;
  return entry?.["content"];
};


describe("seoTitle", () => {
  it("keeps the qualifier and brand when everything fits", () => {
    const title = seoTitle("Silk Sarees", "Coimbatore");
    expect(title).toBe("Silk Sarees — Coimbatore | Pattu Kutty");
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("drops the qualifier before the brand when too long", () => {
    const title = seoTitle("Heritage Kanchipuram Bridal Lehenga", "Coimbatore Boutique");
    expect(title).toBe("Heritage Kanchipuram Bridal Lehenga | Pattu Kutty");
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("drops the brand suffix when the name alone nearly fills the budget", () => {
    const name = "Handwoven Kanchipuram Bridal Silk Saree Set";
    expect(seoTitle(name, "Coimbatore")).toBe(name);
  });

  it("never exceeds the limit even for absurdly long names", () => {
    const title = seoTitle("A".repeat(200), "Coimbatore");
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("trims on a word boundary without a dangling separator", () => {
    const title = seoTitle("Bridal Blouses Stitched With Zari Handwork Detailing In Coimbatore");
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(title).not.toMatch(/[\s—\-–,;:|]$/);
  });

  it("handles empty and whitespace-only names without crashing", () => {
    expect(seoTitle("").length).toBeLessThanOrEqual(TITLE_MAX);
    expect(seoTitle("   ").length).toBeLessThanOrEqual(TITLE_MAX);
  });
});

describe("seoDescription", () => {
  it("leaves short descriptions untouched apart from whitespace collapsing", () => {
    expect(seoDescription("  Custom   stitched blouses.  ")).toBe("Custom stitched blouses.");
  });

  it("clamps long descriptions to the limit", () => {
    const clamped = seoDescription("word ".repeat(80));
    expect(clamped.length).toBeLessThanOrEqual(DESC_MAX);
    expect(clamped).not.toMatch(/\s$/);
  });

  it("clamps a single unbroken word to exactly the limit", () => {
    expect(seoDescription("x".repeat(400)).length).toBe(DESC_MAX);
  });
});

describe("socialMeta", () => {
  it("emits a self-referencing og:url and clamped title/description", () => {
    const meta = socialMeta({
      title: "Bridal Blouses — Custom Stitched In Coimbatore With Zari Handwork | Pattu Kutty",
      description: "long ".repeat(60),
      path: "/category/blouses/bridal-blouses",
    });
    expect(metaValue(meta, "og:url")).toBe(`${SITE_URL}/category/blouses/bridal-blouses`);
    expect(metaValue(meta, "og:title")!.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(metaValue(meta, "og:description")!.length).toBeLessThanOrEqual(DESC_MAX);
    expect(metaValue(meta, "twitter:card")).toBe("summary_large_image");
  });

  it("falls back to the branded card and declares its 1200x630 dimensions", () => {
    const meta = socialMeta({ title: "Home", description: "Boutique", path: "/" });
    expect(metaValue(meta, "og:image")).toBe(OG_IMAGE);
    expect(metaValue(meta, "og:image:width")).toBe("1200");
    expect(metaValue(meta, "og:image:height")).toBe("630");
  });

  it("uses a catalogue photo without asserting dimensions", () => {
    const meta = socialMeta({
      title: "Saree",
      description: "Silk saree",
      path: "/product/x",
      image: "https://cdn.example.com/saree.jpg",
      type: "product",
    });
    expect(metaValue(meta, "og:image")).toBe("https://cdn.example.com/saree.jpg");
    expect(metaValue(meta, "twitter:image")).toBe("https://cdn.example.com/saree.jpg");
    expect(metaValue(meta, "og:image:width")).toBeUndefined();
    expect(metaValue(meta, "og:type")).toBe("product");
  });

  it("absolutises relative images", () => {
    const meta = socialMeta({
      title: "Saree",
      description: "Silk saree",
      path: "/product/y",
      image: "/uploads/saree.jpg",
    });
    expect(metaValue(meta, "og:image")).toBe(`${SITE_URL}/uploads/saree.jpg`);
  });

  it("keeps og:image and twitter:image identical on every page", () => {
    for (const image of [null, "/a.jpg", "https://cdn.example.com/b.jpg"]) {
      const meta = socialMeta({ title: "T", description: "D", path: "/p", image });
      expect(metaValue(meta, "og:image")).toBe(metaValue(meta, "twitter:image"));
    }
  });
});
