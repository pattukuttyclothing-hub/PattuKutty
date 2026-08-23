/**
 * Storefront "What We Stitch" reels + "Featured Designs" selection.
 * Both are controlled from the admin — this file only holds the seed values
 * that mirror what the customer site currently renders.
 */

export type ReelItem = {
  id: string;
  videoUrl: string;
  title: string;
  productId: string;
};

const VCDN = "https://res.cloudinary.com/vy7aodsr/video/upload";

export const seedReels: ReelItem[] = [
  {
    id: "rl-1",
    videoUrl: `${VCDN}/v1786515894/ClipDown.com_AQPPSE7-Q4Y4RtJooqD9SmiTlqWeE1O_c51iUC_p6PhhK521S4I3ABZScPvIne2E34NdDPeoqeKCGIrzRs2hxHzJ.mp4`,
    title: "Bridal lehenga reveal",
    productId: "lehenga-1",
  },
  {
    id: "rl-2",
    videoUrl: `${VCDN}/v1786515898/ClipDown.com_AQPe63WglNr3xEd2W7i1I37yID282AYcr5ZjPxazA6ezH4PSi52XfaRemkOuYsFZ2I8eIkYuHPyYr70LPGi87JmWz3XFIuRkNxVb9cE.mp4`,
    title: "Aari blouse detailing",
    productId: "bridal-blouses-1",
  },
  {
    id: "rl-3",
    videoUrl: `${VCDN}/v1786515899/ClipDown.com_AQOyYPCB-sC5vyihZblFeiLwUE8pkSRf9aZle0M0ZolXFF6NluvlbgwuY4kFDLMbj3VZ-3YRfgiENgo3_6MktBCj.mp4`,
    title: "Half saree drape",
    productId: "half-saree-classic-1",
  },
  {
    id: "rl-4",
    videoUrl: `${VCDN}/v1786515958/ClipDown.com_AQMGlFi3FdG1y6uy5jfQi6HmLwcg51o3gau-VU-8-l7YCsybX_XqBCTfiixZwOgNo1UPO460qvj1tNZRdjaP8-d9yJCFgLajE3PaMFM.mp4`,
    title: "Frock styling of the week",
    productId: "normal-frocks-1",
  },
];

/** Product ids featured on the customer landing page, in display order. */
export const seedFeaturedIds = [
  "lehenga-1",
  "half-saree-classic-1",
  "bridal-blouses-1",
  "normal-frocks-1",
  "silk-sarees-2",
  "wedding-frocks-2",
  "designer-blouses-3",
  "pattu-pudavai-1",
];
