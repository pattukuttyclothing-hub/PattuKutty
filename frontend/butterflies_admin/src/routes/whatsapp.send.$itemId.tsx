import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { AudiencePicker, WhatsAppPreview } from "@/components/whatsapp/WhatsAppKit";
import { useAdmin } from "@/lib/admin-store";
import { inr } from "@/lib/format";
import {
  audiencesFor,
  discountPct,
  gstNote,
  itemById,
  itemLink,
  publishedItemsFrom,
  sendCampaign,
  type Audience,
} from "@/lib/whatsapp-notify";

const title = "Send WhatsApp campaign — Butterflies Tailoring Admin";
const description =
  "Preview the WhatsApp message, choose the audience and send the design out to customers.";

export const Route = createFileRoute("/whatsapp/send/$itemId")({
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
  component: SendPage,
});

function SendPage() {
  const { itemId } = Route.useParams();
  const { products } = useAdmin();
  const navigate = useNavigate();
  const items = useMemo(() => publishedItemsFrom(products), [products]);
  const item = itemById(items, itemId);

  const [audience, setAudience] = useState<Audience>("All Customers");
  const audienceOptions = useMemo(() => audiencesFor(item), [item]);
  const [note, setNote] = useState(
    "Reply here and we will block a stitching slot for you — measurements can be shared over WhatsApp.",
  );
  const [sending, setSending] = useState(false);

  if (!item) {
    return (
      <AdminShell>
        <PageHead eyebrow="WhatsApp Studio" title="Design not found" />
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link to="/whatsapp" className="text-sm font-semibold text-primary">
            Back to WhatsApp Studio
          </Link>
        </div>
      </AdminShell>
    );
  }

  const priceLine = `${inr(item.price)} only (MRP ${inr(item.mrp)}) · ${discountPct(item.price, item.mrp)}% OFF`;

  const send = () => {
    setSending(true);
    const size =
      audienceOptions.find((a) => a.id === audience)?.size ?? audienceOptions[0]!.size;
    const rec = sendCampaign({ itemId: item.id, audience, audienceSize: size, note });
    toast.success(`Campaign ${rec.id} sent to ${audience}`);
    void navigate({
      to: "/whatsapp/analytics/$notificationId",
      params: { notificationId: rec.id },
    });
  };

  return (
    <AdminShell>
      <PageHead
        eyebrow="WhatsApp Studio"
        title="Notify on WhatsApp"
        subtitle="This is exactly how the message lands in your customer's chat."
        actions={
          <Link
            to="/whatsapp/item/$itemId"
            params={{ itemId: item.id }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[0.66rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold text-foreground">Message content</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Title</dt>
                <dd className="text-right font-semibold text-foreground">{item.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Price line</dt>
                <dd className="text-right font-semibold text-foreground">{priceLine}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Link</dt>
                <dd className="truncate text-right text-xs font-medium text-primary">
                  {itemLink(item)}
                </dd>
              </div>
            </dl>

            <label className="mt-4 block">
              <span className="text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Note from the studio
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <p className="mt-2 text-[0.7rem] text-muted-foreground">{gstNote}.</p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold text-foreground">Send to</h2>
            <div className="mt-3">
              <AudiencePicker value={audience} onChange={setAudience} options={audienceOptions} />
            </div>
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[0.7rem] font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-soft disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> Send campaign
            </button>
          </section>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Live preview
          </p>
          <WhatsAppPreview
            title={item.name}
            priceLine={priceLine}
            message={item.blurb}
            image={item.image}
            note={note}
            cta="View Design"
          />
        </div>
      </div>
    </AdminShell>
  );
}
