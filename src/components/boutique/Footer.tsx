import { Clock, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { storeInfo, waLink } from "@/data/boutique";
import { BrandLockup, BrandMark } from "./Brand";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "Collections", href: "#collections" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="silk-texture relative overflow-hidden bg-maroon-deep text-primary-foreground"
    >
      <BrandMark
        tone="light"
        className="pointer-events-none absolute -right-16 -bottom-16 h-96 w-auto opacity-[0.07]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.7fr_0.8fr_1.1fr]">
          <div className="min-w-0">
            <BrandLockup tone="gold" className="h-20 w-auto sm:h-24" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
              {storeInfo.tagline}. Custom blouses, lehengas, half sarees and pattu pavadai stitched
              with perfect fitting.
            </p>
            <div className="mt-6 flex gap-2">
              <a
                href={`https://instagram.com/${storeInfo.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid h-11 w-11 place-items-center rounded-full border border-primary-foreground/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={waLink(`Hi ${storeInfo.name}!`)}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="grid h-11 w-11 place-items-center rounded-full border border-primary-foreground/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={`tel:${storeInfo.phone.replace(/\s/g, "")}`}
                aria-label="Call us"
                className="grid h-11 w-11 place-items-center rounded-full border border-primary-foreground/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-medium tracking-[0.24em] text-accent uppercase">
              Quick Links
            </h3>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="gold-underline inline-block text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-medium tracking-[0.24em] text-accent uppercase">Hours</h3>
            <ul className="mt-5 space-y-3">
              {storeInfo.hours.map((h) => (
                <li key={h.day} className="flex gap-2 text-sm text-primary-foreground/70">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block text-primary-foreground">{h.day}</span>
                    {h.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-medium tracking-[0.24em] text-accent uppercase">
              Visit Us
            </h3>
            <p className="mt-5 flex gap-2 text-sm leading-relaxed text-primary-foreground/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {storeInfo.address}
            </p>
            <p className="mt-3 text-sm text-primary-foreground/70">
              <a href={`tel:${storeInfo.phone.replace(/\s/g, "")}`} className="gold-underline">
                {storeInfo.phone}
              </a>
              <span className="mx-2 text-primary-foreground/30">·</span>
              {storeInfo.instagram}
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 shadow-lg">
              <iframe
                title={`${storeInfo.name} location on Google Maps`}
                src="https://www.google.com/maps?q=11.0159357,76.9792251&hl=en&z=16&output=embed"
                className="h-40 w-full border-0 sm:h-44"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a
              href="https://www.google.com/maps/place/463,+Bharathiyar+Rd,+Ramnagar,+Lakshmi+Mills+Colony,+Pappanaickenpalayam,+Coimbatore,+Tamil+Nadu+641037/@11.0161317,76.9772903,16z"
              target="_blank"
              rel="noreferrer"
              className="gold-underline mt-3 inline-flex items-center gap-1.5 text-xs text-accent"
            >
              <MapPin className="h-3.5 w-3.5" />
              Get directions
            </a>
          </div>
        </div>

        <div className="gold-divider mt-14 opacity-60" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center text-[0.72rem] text-primary-foreground/55 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {storeInfo.name}, Coimbatore. All rights reserved.
          </p>
          <p>Made to order · Perfect fitting · Elegant finishing</p>
        </div>
      </div>
    </footer>
  );
}
