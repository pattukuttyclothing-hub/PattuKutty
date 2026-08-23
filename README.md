# Remix of Remix of Remix of Butterflies Boutique

PROMPT 1 — Customer-Facing Landing Page

Build a frontend-only React + Tailwind landing page for a girls' boutique called "Butterflies Tailoring" (Coimbatore). No backend — use mock data/state only.

Design language:

Feel: elegant, feminine, festive — not childish pastel. Think bridal/party-wear boutique, not a toy store.

Typography: pair a display serif (Playfair Display or Cormorant Garamond) for headings with a clean rounded sans (Poppins or Quicksand) for body text.

Palette: Rani pink (#C2185B / #D6336C) as primary, blush pink (#FDE8EF) as background tint, deep maroon (#7A1F3D) for contrast text, soft gold (#D4AF37) for accents/dividers, cream/off-white (#FFF8F3) base.

Generous whitespace, soft rounded corners (rounded-2xl), subtle shadows, gold-line dividers, small floral/butterfly motif accents (SVG, not clipart-heavy).

Page structure:

Sticky nav — logo/wordmark left, links (Home, Collections, About, Reviews, Contact), WhatsApp CTA button right (rani pink pill button).

Hero banner — full-width, rotating (3–4 slides, auto-advance + manual arrows). Each slide has a large image (placeholder image with a bridal/lehenga aesthetic), a headline, short subtext, and a CTA button. Content here should be pulled from a heroBanners mock array — comment in code that this array is "controlled by System Admin" so it's obviously swappable later.

Category cards section ("Shop by Category") — 4 cards in a grid: Half Saree, Blouses, Kurtis, Lehanga. Each card = tall image + category name overlay, hover lift/zoom effect. Use distinct placeholder images per category matching: Lehanga = rani pink embroidered bridal lehenga, Half Saree = soft silk readymade half saree, Blouses = designer blouse close-up, Kurtis = casual elegant kurti.

On clicking a card, that section morphs into a video carousel for that category (smooth transition, e.g. crossfade or slide), replacing the card grid. The carousel shows a set of short video/reel thumbnails (mock array categoryReels, 4–6 items per category, each with a thumbnail + title, click opens a modal/lightbox player — use looping placeholder video or an image-as-video-poster since real video isn't available).

A "← Back to Collections" arrow/button sits top-left of the carousel view, which animates back to the card grid.

Comment in code that categoryReels mock data is "controlled by System Admin" — this is the same data source the system admin dashboard (separate app) would edit.

Featured Products strip — horizontal scroll or grid of 6–8 mock products (image, name, price with strikethrough MRP + discount %, "Enquire on WhatsApp" button instead of Add to Cart, since this is boutique/made-to-order).

About/Story section — two-column: image left, text right. Use this copy (lightly edit for flow, keep the essence):

Store name: Butterflies Tailoring — "Coimbatore's fastest ladies dress designer"

Known for quick stitching: 1-hour stitching for selected designs, 1-day stitching available

Specializes in: custom designer blouses, lehengas, half sarees, pattu pavadai

Perfect fitting, elegant finishing, serves both local and international (NRI/foreign visitor) clients on tight timelines

Address: 463, Bharathiyar Road, Pappanaicken Palayam, Coimbatore – 641037 (Gandhipuram, Coimbatore)

Include small icon badges: "⏱ 1-Hour Stitching", "📦 1-Day Delivery", "✂️ Custom Designs", "🌍 NRI Friendly"

Reviews section — carousel or 3-card grid of customer testimonials (mock array reviews: name, star rating, short quote, optional customer photo/avatar placeholder). Include 6 reviews mentioning things like fitting accuracy, fast turnaround, bridal lehenga quality, blouse stitching.

Contact/Footer — store address, phone/WhatsApp number (mock), Instagram handle (mock), Google Maps embed placeholder, working hours, quick links, social icons.

Technical notes:

All content (hero slides, category images, reels, products, reviews) should live in clearly-named mock data arrays/objects at the top of the file so it's obvious what a future admin panel would control.

Fully responsive, mobile-first (most traffic will be Instagram → mobile).

Smooth scroll-to-section from nav links.

No routing needed beyond in-page anchors and the card→carousel toggle.  *Create the hero-section like the uploaded one

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/83d2119c-c174-418a-8036-5d935fcf6537).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
