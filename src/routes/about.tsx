import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import { PageHeader, PageSection, PageShell } from "@/components/shared/Page";
import { FAQ } from "@/components/boutique/FAQ";
import { Reveal } from "@/components/shared/Reveal";
import { storeInfo, waLink } from "@/data/boutique";
import {
  ENTITY_DEFINITION,
  ENTITY_SCOPE,
  ENTITY_SUMMARY,
  NAP,
  faqJsonLd,
  services,
  serviceJsonLd,
  categoryProductJsonLd,
} from "@/data/aeo";
import { abs, breadcrumbJsonLd, seoDescription, seoTitle, socialMeta } from "@/lib/seo";

const title = seoTitle("About Pattu Kutty", "Coimbatore");
const description = seoDescription(ENTITY_SUMMARY);

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: socialMeta({ title, description, path: "/about" }),
    links: [{ rel: "canonical", href: abs("/about") }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(faqJsonLd) },
      { type: "application/ld+json", children: JSON.stringify(serviceJsonLd) },
      { type: "application/ld+json", children: JSON.stringify(categoryProductJsonLd) },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About Pattu Kutty", path: "/about" },
          ]),
        ),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="About the brand"
        title="About Pattu Kutty — Custom Women's Clothing in Coimbatore"
        subtitle={ENTITY_SUMMARY}
        crumbs={[{ label: "About Pattu Kutty" }]}
        showMotif
      />

      <PageSection width="narrow">
        <Reveal>
          <h2 className="font-display text-[1.45rem] font-semibold text-foreground sm:text-[1.75rem]">
            What is Pattu Kutty?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground">{ENTITY_DEFINITION}</p>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
            {ENTITY_SCOPE}
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="font-display mt-12 text-[1.45rem] font-semibold text-foreground sm:text-[1.75rem]">
            Where is Pattu Kutty located?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            Pattu Kutty is located at {NAP.street}, {NAP.locality} – {NAP.postalCode},{" "}
            {NAP.region}, India, close to Gandhipuram. Customers anywhere in India can order
            remotely and have finished garments delivered to them.
          </p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              { icon: MapPin, text: NAP.addressLine },
              { icon: Phone, text: NAP.phone },
              { icon: Clock, text: "Mon–Sat 9:30 AM – 8:30 PM · Sun 10:00 AM – 2:00 PM IST" },
              { icon: MessageCircle, text: "WhatsApp enquiries and measurement sharing" },
            ].map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground shadow-soft"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">{text}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={140}>
          <h2 className="font-display mt-12 text-[1.45rem] font-semibold text-foreground sm:text-[1.75rem]">
            What services does Pattu Kutty offer?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            Pattu Kutty offers three core services from its Coimbatore studio: clothing
            customization, saree stitching and bridal wear, all delivered across India.
          </p>
          <div className="mt-5 space-y-3">
            {services.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-soft"
              >
                <h3 className="font-display text-base font-semibold text-foreground">{s.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.answer}</p>
                <p className="mt-2 text-[0.68rem] font-semibold tracking-[0.1em] text-primary uppercase">
                  Turnaround: {s.turnaround}
                </p>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/design-studio"
              className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
            >
              Start a custom order
            </Link>
            <a
              href={waLink(`Hi ${storeInfo.name}, I'd like to ask about custom stitching.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-primary/30 px-7 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
            >
              Ask on WhatsApp
            </a>
          </div>
        </Reveal>
      </PageSection>

      <FAQ />
    </PageShell>
  );
}
