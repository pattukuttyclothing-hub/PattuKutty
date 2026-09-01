import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { AudiencePicker, WhatsAppPreview } from "@/components/whatsapp/WhatsAppKit";
import { imagePools } from "@/data/boutique";
import { ALL_CUSTOMERS, sendCustomCampaign, type Audience } from "@/lib/whatsapp-notify";

const title = "Custom WhatsApp broadcast — Pattu Kutty Admin";
const description =
  "Compose a freeform WhatsApp broadcast with your own title, message and cover image, then send it to a chosen audience.";

export const Route = createFileRoute("/whatsapp/broadcast")({
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
  component: BroadcastPage,
});

const covers = [
  imagePools.halfSaree[1]!,
  imagePools.blouse[0]!,
  imagePools.frock[1]!,
  imagePools.saree[0]!,
];

function BroadcastPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("Aadi Discount Week");
  const [message, setMessage] = useState(
    "Flat 20% off on all half saree and blouse stitching this week.\nSlots are limited — walk in at Gandhipuram or send your measurements here.",
  );
  const [note, setNote] = useState("Booking open till Sunday, 8 PM.");
  const [image, setImage] = useState(covers[0]!);
  const [audience, setAudience] = useState<Audience>("All Customers");

  const send = () => {
    if (!name.trim() || !message.trim()) {
      toast.error("Add a title and a message first");
      return;
    }
    const rec = sendCustomCampaign({
      name,
      message,
      image,
      audience,
      audienceSize: ALL_CUSTOMERS.size,
      note,
    });
    toast.success(`Broadcast ${rec.id} sent to ${audience}`);
    void navigate({
      to: "/whatsapp/analytics/$notificationId",
      params: { notificationId: rec.id },
    });
  };

  return (
    <AdminShell>
      <PageHead
        eyebrow="WhatsApp Studio"
        title="Custom broadcast"
        subtitle="For anything that isn't a catalogue design — festive offers, studio holidays, express slot announcements."
        actions={
          <Link
            to="/whatsapp"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[0.66rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <label htmlFor="broadcastTitle" className="block">
              <span className="text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Title
              </span>
              <input
                id="broadcastTitle"
                name="broadcastTitle"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <label htmlFor="broadcastMessage" className="block">
              <span className="text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Message
              </span>
              <textarea
                id="broadcastMessage"
                name="broadcastMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <label htmlFor="broadcastNote" className="block">
              <span className="text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Note from the studio
              </span>
              <input
                id="broadcastNote"
                name="broadcastNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            <div>
              <span className="text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Cover image
              </span>
              <div className="mt-2 flex gap-3">
                {covers.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setImage(src)}
                    className={`overflow-hidden rounded-2xl border-2 transition-colors ${
                      image === src ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img
                      src={src}
                      alt="Broadcast cover option"
                      loading="lazy"
                      className="h-24 w-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold text-foreground">Send to</h2>
            <div className="mt-3">
              <AudiencePicker value={audience} onChange={setAudience} options={[ALL_CUSTOMERS]} />
            </div>
            <button
              type="button"
              onClick={send}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[0.7rem] font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-soft"
            >
              <Send className="h-4 w-4" /> Send broadcast
            </button>
          </section>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-[0.62rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Live preview
          </p>
          <WhatsAppPreview title={name} message={message} image={image} note={note} />
        </div>
      </div>
    </AdminShell>
  );
}
