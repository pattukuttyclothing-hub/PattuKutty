/**
 * Real marketing copy — Pattu Kutty brand tone.
 * Warm, specific, Coimbatore-rooted; written for customers first and search
 * engines second. Replaces the earlier auto-generated seed sentences.
 */

export type SubCopy = {
  /** Short line used on cards and page sub-headers. */
  blurb: string;
  /** 150-160 char meta description for the sub-category page. */
  meta: string;
  /** Longer editorial paragraph shown on listing pages. */
  intro: string;
  /** Product description body, personalised per design name. */
  product: (name: string) => string;
};

const shipLine =
  "Stitched in our Coimbatore studio and shipped anywhere in India.";

export const subCopy: Record<string, SubCopy> = {
  "half-saree-classic": {
    blurb: "Silk half saree sets with hand-set zari drapes",
    meta: "Custom half saree sets in Coimbatore — silk davani, zari borders and blouse stitched to your measurements. 1-hour express option, delivery across India.",
    intro:
      "The half saree is a Tamil family milestone, and we treat it that way. Choose your silk, your border and your drape length, and we cut the pavadai, blouse and davani together so the whole set falls as one. Measurements taken once, remembered for life.",
    product: (name) =>
      `${name} is a three-piece half saree set — silk pavadai, fitted blouse and a zari-bordered davani pinned to your height. We stitch to your exact measurements, finish the insides by hand and can turn it around in as little as one hour for a same-day function. ${shipLine}`,
  },
  lehenga: {
    blurb: "Bridal lehengas with can-can flare and aari work",
    meta: "Bridal lehengas custom made in Coimbatore — can-can flare, aari and maggam work, fitted choli. Book a fitting or order online with delivery across India.",
    intro:
      "Our bridal lehengas are built, not bought: layered can-can for the flare you want, a choli fitted at four points, and aari or maggam work placed where the camera will find it. Bring a reference photo or design it with us from scratch.",
    product: (name) =>
      `${name} is a made-to-order bridal lehenga — choose the flare, the choli neckline and the level of aari or maggam work. Each panel is cut to your measurements, the waist is fitted at trial, and every hook and lining is finished by hand so it holds through a full wedding day. ${shipLine}`,
  },
  "pattu-pudavai": {
    blurb: "Temple-border pattu pavadai for family functions",
    meta: "Pattu pavadai and traditional silk sets stitched in Coimbatore — temple borders, gold zari, custom sizes for girls and women. Fast stitching, India-wide delivery.",
    intro:
      "Traditional pattu pavadai in temple-border silk, cut for real comfort — soft lining at the waist, generous hem allowance for growing girls, and blouse sleeves you can actually lift your arms in.",
    product: (name) =>
      `${name} is a traditional pattu pavadai set in temple-border silk with gold zari. Stitched to your measurements with a soft-lined waist, hidden hooks and hem allowance so it lasts more than one festive season. ${shipLine}`,
  },
  "normal-frocks": {
    blurb: "Everyday cotton frocks made for Coimbatore heat",
    meta: "Custom everyday frocks in Coimbatore — breathable cottons, your fabric or ours, stitched to your measurements in a day. Women's and girls' sizes, delivered India-wide.",
    intro:
      "Daily-wear frocks in breathable cottons and soft rayons, cut for Coimbatore weather. Bring your own fabric or pick from our rack, tell us the sleeve and length you like, and we stitch it exactly that way.",
    product: (name) =>
      `${name} is an everyday frock in a breathable cotton blend — pick your sleeve length, neckline and hem, and we stitch it to your measurements with french seams that survive regular washing. Usually ready the next day. ${shipLine}`,
  },
  "wedding-frocks": {
    blurb: "Layered gowns and wedding frocks with fitted bodices",
    meta: "Wedding and reception gowns custom stitched in Coimbatore — layered skirts, boned bodices, your fabric or ours. Express stitching and delivery across India.",
    intro:
      "Reception gowns and wedding frocks with structure where it matters: a boned or lined bodice, a skirt layered to hold its shape all evening, and a hem set to your heel height.",
    product: (name) =>
      `${name} is a made-to-measure wedding frock — a supported bodice, layered skirt and a hem set to the heels you'll actually wear. Choose the fabric, colour and hand-work level; we fit it at trial before final finishing. ${shipLine}`,
  },
  "designer-frocks": {
    blurb: "Statement designer frocks cut to your sketch",
    meta: "Designer frocks made to order in Coimbatore — bring a photo or sketch and we stitch it in your size, your fabric, your colour. Fast turnaround, India-wide delivery.",
    intro:
      "Send us a screenshot, a sketch or a description and we'll cut it for your body — asymmetric hems, cape sleeves, cut-outs, hand embroidery. This is where our customisation studio does its best work.",
    product: (name) =>
      `${name} is a designer frock you can change completely — neckline, sleeve, hem, fabric and embroidery are all yours to choose. Share a reference and we'll draft the pattern to your measurements before a single cut is made. ${shipLine}`,
  },
  "silk-sarees": {
    blurb: "Kanchi silk sarees with gold zari and matched blouses",
    meta: "Kanchi silk sarees with matched custom blouses, from our Coimbatore boutique. Gold zari borders, blouse stitched to your measurements, delivery across India.",
    intro:
      "Pure and blended Kanchi silks with gold zari borders — and, more importantly, a blouse stitched to match. Most customers order the saree and blouse together so the fit is right the day it arrives.",
    product: (name) =>
      `${name} is a Kanchi silk saree with a gold zari border, sold with an optional blouse stitched to your measurements. Tell us your neckline and sleeve preference and we cut the blouse from the matching piece. ${shipLine}`,
  },
  "fancy-sarees": {
    blurb: "Light fancy sarees for functions and office wear",
    meta: "Fancy sarees in Coimbatore — light georgettes, organzas and crepes with custom-stitched blouses. Easy to drape, quick delivery anywhere in India.",
    intro:
      "Light georgettes, organzas and crepes that drape without weighing you down — our most-asked-for sarees for receptions, office functions and travel.",
    product: (name) =>
      `${name} is a light fancy saree that drapes easily and packs flat for travel, with an optional blouse stitched to your measurements in a matching or contrast fabric. ${shipLine}`,
  },
  "designer-sarees": {
    blurb: "Designer sarees with custom pallu and blouse pairing",
    meta: "Designer sarees custom finished in Coimbatore — hand-worked pallus, contrast blouses, your colour and fabric. Women's boutique with India-wide delivery.",
    intro:
      "Designer drapes where the pallu, border and blouse are decided by you. We do the hand work in-house, so you can change a motif or a colour right up to stitching.",
    product: (name) =>
      `${name} is a designer saree finished to your brief — choose the pallu work, border and a matching or contrast blouse. Hand embroidery is done in our own studio, so colour and motif changes are still possible after you order. ${shipLine}`,
  },
  "bridal-blouses": {
    blurb: "Bridal blouses with heavy zari and sleeve work",
    meta: "Bridal blouses stitched in Coimbatore — heavy zari, aari and maggam sleeve work, perfect fit guaranteed. 1-hour express stitching available, shipped India-wide.",
    intro:
      "The bridal blouse decides how the whole saree sits. We fit at four points, line it properly so the hooks never show, and place the heavy work so it reads in photographs.",
    product: (name) =>
      `${name} is a bridal blouse with heavy zari and worked sleeves, fitted at bust, waist, armhole and shoulder. Fully lined with concealed hooks and reinforced seams — and yes, we can stitch it in one hour when the function is today. ${shipLine}`,
  },
  "pattern-blouses": {
    blurb: "Princess cut, boat neck and sweetheart blouse patterns",
    meta: "Custom blouse stitching in Coimbatore — princess cut, boat neck, sweetheart and back designs, made to your measurements in a day or express in 1 hour.",
    intro:
      "Every classic pattern we stitch, cut properly: princess seams for shape, boat necks that stay put, sweetheart lines that don't gape. Pick a pattern and a back design and we do the rest.",
    product: (name) =>
      `${name} is a pattern blouse cut to your measurements — choose princess, boat, sweetheart or a back design of your own. Darted for shape, piped at the edges, and available on our 1-hour express counter. ${shipLine}`,
  },
  "designer-blouses": {
    blurb: "Aari and maggam couture blouses made in-house",
    meta: "Aari and maggam work designer blouses from our Coimbatore studio — custom motifs, mirror and stone work, stitched to your exact measurements. India-wide delivery.",
    intro:
      "Aari and maggam couture done on our own frames — mirror, stone, bead and thread work, priced by the motif so you stay in control of the budget.",
    product: (name) =>
      `${name} is a couture blouse with aari or maggam hand work done in our Coimbatore studio. Choose the motif density, the stone and thread colours, and the sleeve style; we draft the pattern to your measurements first. ${shipLine}`,
  },
};

export const categoryCopy: Record<string, { blurb: string; meta: string; intro: string }> = {
  "half-saree": {
    blurb: "Half saree sets, lehengas and pattu pavadai",
    meta: "Half sarees, bridal lehengas and pattu pavadai custom stitched in Coimbatore. Your silk, your measurements, 1-hour express option and delivery across India.",
    intro:
      "Ceremony wear for the moments families photograph — half saree sets, bridal lehengas and traditional pattu pavadai, all cut to your measurements in our Coimbatore studio.",
  },
  frocks: {
    blurb: "Everyday, wedding and designer frocks",
    meta: "Custom frocks in Coimbatore — everyday cottons, wedding gowns and designer cuts stitched to your measurements. Bring your fabric or ours, delivered across India.",
    intro:
      "From next-day cotton frocks to layered reception gowns — tell us the fit you like and we'll draft it for your body rather than a standard size chart.",
  },
  sarees: {
    blurb: "Silk, fancy and designer sarees with matched blouses",
    meta: "Silk, fancy and designer sarees from our Coimbatore boutique, each with a blouse stitched to your measurements. Kanchi zari, light drapes, India-wide delivery.",
    intro:
      "Kanchi silks, light fancy drapes and hand-worked designer sarees — every one available with a blouse stitched to your measurements so it's wearable the day it lands.",
  },
  blouses: {
    blurb: "Bridal, pattern and aari work blouses",
    meta: "Blouse stitching in Coimbatore — bridal zari, princess cut patterns and aari or maggam couture, fitted to your measurements. 1-hour express stitching available.",
    intro:
      "Blouse stitching is what Coimbatore knows us for: bridal zari, classic patterns and aari couture, all fitted at four points and available on our 1-hour express counter.",
  },
};

export const productCopy = (subId: string, name: string) =>
  subCopy[subId]?.product(name) ??
  `${name} is custom stitched to your measurements in our Coimbatore studio — choose the fabric, colour and hand work, with express stitching available. ${shipLine}`;
