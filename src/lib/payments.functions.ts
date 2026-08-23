import { createBackendPaymentOrder, verifyBackendPayment, type PlaceOrderPayload } from "./api/orders";

export type PaymentIntent = {
  mode: "razorpay";
  keyId: string;
  orderId: string;
  amount: number;
  currency: "INR";
  appOrderId?: string | undefined;
};

/**
 * Initiates Razorpay payment order by delegating to Express backend API (/api/payments/create-order).
 * Amount and stock are calculated 100% database-authoritative on the backend.
 */
export async function initiateRazorpayPaymentOrder(payload: PlaceOrderPayload): Promise<PaymentIntent> {
  const data = await createBackendPaymentOrder(payload);
  return {
    mode: "razorpay",
    keyId: data.keyId,
    orderId: data.razorpayOrderId,
    amount: data.amount,
    currency: "INR",
    ...(data.orderId ? { appOrderId: data.orderId } : {}),
  };
}

/**
 * Verifies Razorpay signature server-side by delegating to Express backend API (/api/payments/verify).
 */
export async function verifyRazorpayPaymentSignature(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}) {
  return await verifyBackendPayment({
    razorpayOrderId: payload.razorpayOrderId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpaySignature: payload.signature,
  });
}
