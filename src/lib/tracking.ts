export type OrderStatus =
  | "placed"
  | "measuring"
  | "stitching"
  | "quality-check"
  | "packed"
  | "shipped"
  | "in-transit"
  | "out-for-delivery"
  | "delivered"
  | "ready_for_pickup"
  | "picked_up";

export type DeliveryType = "doorstep" | "store_pickup";

export type Scan = {
  at: string;
  status: string;
  location: string;
  detail: string;
};

export const courier = {
  name: "BlueDart",
  service: "Domestic Priority",
  trackUrl: "https://www.bluedart.com/tracking",
  origin: "Coimbatore, TN",
  hub: "Coimbatore Hub (CJB)",
};

export const blueDartTrackingUrl = (awb: string) =>
  `https://www.bluedart.com/tracking?handler=tnt&action=awbquery&awb=${encodeURIComponent(awb)}`;

/** Doorstep Journey */
export const doorstepSteps: {
  id: OrderStatus;
  label: string;
  hint: string;
  scanStatus: string;
  offsetHours: number;
  stage: "boutique" | "courier";
}[] = [
  {
    id: "placed",
    label: "Order Placed",
    hint: "We received your order and payment details.",
    scanStatus: "Shipment booked",
    offsetHours: 0,
    stage: "boutique",
  },
  {
    id: "measuring",
    label: "Measurements Confirmed",
    hint: "Our tailor confirmed your fit and fabric.",
    scanStatus: "Order confirmed at boutique",
    offsetHours: 3,
    stage: "boutique",
  },
  {
    id: "stitching",
    label: "In Stitching",
    hint: "Cutting, stitching and hand work in progress.",
    scanStatus: "In production",
    offsetHours: 12,
    stage: "boutique",
  },
  {
    id: "quality-check",
    label: "Final Finishing",
    hint: "Pressing, piping and quality check done.",
    scanStatus: "Quality check cleared",
    offsetHours: 30,
    stage: "boutique",
  },
  {
    id: "packed",
    label: "Packed",
    hint: "Neatly packed with care instructions.",
    scanStatus: "Shipment packed & manifested",
    offsetHours: 40,
    stage: "boutique",
  },
  {
    id: "shipped",
    label: "Handed to Courier",
    hint: `${courier.name} collected your parcel from our boutique.`,
    scanStatus: "Shipment picked up",
    offsetHours: 44,
    stage: "courier",
  },
  {
    id: "in-transit",
    label: "In Transit",
    hint: "Moving through the BlueDart network to your city.",
    scanStatus: "In transit",
    offsetHours: 54,
    stage: "courier",
  },
  {
    id: "out-for-delivery",
    label: "Out for Delivery",
    hint: "With the delivery executive for final delivery.",
    scanStatus: "Out for delivery",
    offsetHours: 66,
    stage: "courier",
  },
  {
    id: "delivered",
    label: "Delivered",
    hint: "Enjoy your outfit — we'd love a review.",
    scanStatus: "Shipment delivered",
    offsetHours: 72,
    stage: "courier",
  },
];

/** Store Pickup Journey */
export const pickupSteps: {
  id: OrderStatus;
  label: string;
  hint: string;
  scanStatus: string;
  offsetHours: number;
  stage: "boutique";
}[] = [
  {
    id: "placed",
    label: "Order Placed",
    hint: "We received your order details.",
    scanStatus: "Order placed at boutique",
    offsetHours: 0,
    stage: "boutique",
  },
  {
    id: "measuring",
    label: "Measurements Confirmed",
    hint: "Tailor confirmed measurements.",
    scanStatus: "Measurements confirmed",
    offsetHours: 3,
    stage: "boutique",
  },
  {
    id: "stitching",
    label: "In Stitching",
    hint: "Crafting and stitching in progress.",
    scanStatus: "In production",
    offsetHours: 12,
    stage: "boutique",
  },
  {
    id: "packed",
    label: "Packed & Ready",
    hint: "Outfit is packed and awaiting store pickup.",
    scanStatus: "Packed at boutique",
    offsetHours: 30,
    stage: "boutique",
  },
  {
    id: "ready_for_pickup",
    label: "Ready for Pickup",
    hint: "Visit our store at Gandhipuram to collect your order.",
    scanStatus: "Ready for store collection",
    offsetHours: 40,
    stage: "boutique",
  },
  {
    id: "picked_up",
    label: "Picked Up",
    hint: "Order collected from the store.",
    scanStatus: "Collected by customer",
    offsetHours: 48,
    stage: "boutique",
  },
];

export const orderSteps = doorstepSteps;

export const getStepsForOrder = (deliveryType?: DeliveryType) =>
  deliveryType === "store_pickup" ? pickupSteps : doorstepSteps;

export const stepIndex = (status: OrderStatus, steps = doorstepSteps) => {
  const idx = steps.findIndex((s) => s.id === status);
  return idx < 0 ? 0 : idx;
};

export const stepFor = (status: OrderStatus, steps = doorstepSteps) =>
  steps[stepIndex(status, steps)]!;

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

export function derivedStatus(createdAt: string, stored: OrderStatus, deliveryType?: DeliveryType): OrderStatus {
  const steps = getStepsForOrder(deliveryType);
  const elapsed = hoursSince(createdAt);
  let live: OrderStatus = "placed";
  for (const step of steps) if (elapsed >= step.offsetHours) live = step.id;
  return stepIndex(stored, steps) > stepIndex(live, steps) ? stored : live;
}

export function buildScans(
  createdAt: string,
  status: OrderStatus,
  city: string,
  state: string,
  deliveryType?: DeliveryType,
): Scan[] {
  const steps = getStepsForOrder(deliveryType);
  const base = new Date(createdAt).getTime();
  const destination = `${city}, ${state}`;
  const upto = stepIndex(status, steps);
  return steps
    .slice(0, upto + 1)
    .map((step) => ({
      at: new Date(base + step.offsetHours * 3_600_000).toISOString(),
      status: step.scanStatus,
      location:
        step.stage === "boutique"
          ? courier.origin
          : step.id === "shipped"
            ? courier.hub
            : step.id === "in-transit"
              ? "Bengaluru Transit Hub"
              : destination,
      detail: step.hint,
    }))
    .reverse();
}

export function expectedDeliveryDate(createdAt: string, deliveryType?: DeliveryType) {
  const steps = getStepsForOrder(deliveryType);
  const last = steps[steps.length - 1]!;
  return new Date(new Date(createdAt).getTime() + last.offsetHours * 3_600_000);
}

export const fmtScanTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const fmtDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
