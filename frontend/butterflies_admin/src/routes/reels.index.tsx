import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import {
  FeaturedShowcase,
  PreviewPanel,
  ReelsShowcase,
} from "@/components/admin/StorefrontSections";
import { useAdmin } from "@/lib/admin-store";

const title = "Reels & Featured Design — Butterflies Tailoring Admin";
const description =
  "Live preview of the storefront reels carousel and featured designs, with editing controls for both.";

export const Route = createFileRoute("/reels/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReelsPage,
});

function EditLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[0.66rem] font-semibold tracking-[0.12em] text-primary-foreground uppercase shadow-soft"
    >
      <Pencil className="h-3.5 w-3.5" /> Edit
    </Link>
  );
}

function ReelsPage() {
  const { reels, products, featuredIds } = useAdmin();
  const featured = featuredIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <AdminShell>
      <PageHead
        eyebrow="Storefront"
        title="Reels & Featured Design"
        subtitle="Exactly what the customer sees on the landing page — edit either half and the storefront follows."
      />

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <PreviewPanel label="What We Stitch · Reels" action={<EditLink to="/reels/edit" />}>
            <ReelsShowcase reels={reels} products={products} />
          </PreviewPanel>

          <PreviewPanel label="Featured Designs" action={<EditLink to="/reels/featured" />}>
            <FeaturedShowcase products={featured} />
          </PreviewPanel>
        </div>
      </div>
    </AdminShell>
  );
}
