import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { PageHeader, PageShell, EmptyState } from "@/components/shared/Page";
import { OrderCelebration } from "@/components/checkout/OrderCelebration";
import { StatusBadge } from "@/components/shared/Badge";
import { deliveryRules, storeInfo } from "@/data/boutique";
import { inr, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useOrders, type ShippingAddress } from "@/lib/orders";
import { listAddresses, saveAddress, type SavedAddress } from "@/lib/addresses";
import { createBackendPaymentOrder, verifyBackendPayment, cancelBackendPaymentOrder } from "@/lib/api/orders";
import { fmtDate, expectedDeliveryDate, courier } from "@/lib/tracking";

const title = "Secure Checkout — Pattu Kutty";
const description =
  "Confirm your delivery address and pay securely with Razorpay — UPI, cards, netbanking or wallets — for your Pattu Kutty order.";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: CheckoutPage,
});

type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
};

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    const w = window as RazorpayWindow;
    if (w.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const emptyAddress: ShippingAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
  addressType: "home",
};

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
      />
    </label>
  );
}

function StepHead({
  n,
  label,
  done,
  active,
  onEdit,
}: {
  n: number;
  label: string;
  done: boolean;
  active: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
          done
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground"
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : n}
      </span>
      <h2 className="font-display text-lg font-semibold text-foreground">{label}</h2>
      {done && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto text-xs font-semibold text-primary hover:underline"
        >
          Change
        </button>
      ) : null}
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, profile, ready } = useAuth();
  const { items, subtotal, delivery, total, clear } = useCart();
  const { place } = useOrders();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ShippingAddress>(emptyAddress);
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"razorpay" | "cod">("razorpay");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ id: string; orderNo: string; total: string } | null>(null);


  useEffect(() => {
    if (ready && !user) void navigate({ to: "/auth", search: { next: "/checkout", reason: "Sign in to place your order securely and track it end to end." } });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void listAddresses().then((rows) => {
      setSaved(rows);
      const preferred = rows.find((r) => r.isDefault) ?? rows[0];
      if (preferred) setSelectedId(preferred.id);
      else setShowForm(true);
    });
  }, [user]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || profile?.full_name || "",
      phone: prev.phone || profile?.phone || "",
    }));
  }, [profile]);

  const shipping = useMemo<ShippingAddress | null>(() => {
    if (showForm) return form;
    const found = saved.find((s) => s.id === selectedId);
    return found ?? null;
  }, [showForm, form, saved, selectedId]);

  const addressValid =
    !!shipping &&
    shipping.fullName.trim().length > 0 &&
    /^\d{10}$/.test(shipping.phone.replace(/\D/g, "").slice(-10)) &&
    shipping.line1.trim().length > 0 &&
    shipping.city.trim().length > 0 &&
    shipping.state.trim().length > 0 &&
    /^\d{6}$/.test(shipping.pincode.trim());

  const eta = expectedDeliveryDate(new Date().toISOString());

  const finalise = async (
    payment: { status: "paid" | "pending"; razorpayOrderId?: string; razorpayPaymentId?: string },
    address: ShippingAddress,
  ) => {
    const created = await place({
      items,
      subtotal,
      delivery,
      total,
      shipping: address,
      notes: notes.trim() || undefined,
      paymentMethod: method,
      paymentStatus: payment.status,
      ...(payment.razorpayOrderId ? { razorpayOrderId: payment.razorpayOrderId } : {}),
      ...(payment.razorpayPaymentId ? { razorpayPaymentId: payment.razorpayPaymentId } : {}),
    });
    clear();
    setCelebration({ id: created.id, orderNo: created.orderNo, total: inr(created.total || total) });
  };


  const payNow = async () => {
    if (busy || !user || !shipping || !addressValid) return;
    setBusy(true);
    setError(null);
    try {
      let effectiveAddress = shipping;
      if (showForm) {
        const stored = await saveAddress(user.id, shipping, saved.length === 0);
        if (!stored) {
          throw new Error("Unable to save delivery address. Please verify your address details and try again.");
        }
        setSaved((prev) => [stored, ...prev]);
        setShowForm(false);
        setSelectedId(stored.id);
        effectiveAddress = stored;
      }

      if (method === "cod") {
        await finalise({ status: "pending" }, effectiveAddress);
        return;
      }

      // Call Backend API to calculate prices & create Razorpay order
      const checkoutPayload = {
        addressId: (effectiveAddress as SavedAddress).id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((effectiveAddress as SavedAddress).id)
          ? (effectiveAddress as SavedAddress).id
          : undefined,
        shipping: {
          fullName: effectiveAddress.fullName,
          phone: effectiveAddress.phone,
          line1: effectiveAddress.line1,
          line2: effectiveAddress.line2 || undefined,
          landmark: effectiveAddress.landmark || undefined,
          city: effectiveAddress.city,
          state: effectiveAddress.state,
          pincode: effectiveAddress.pincode,
          addressType: effectiveAddress.addressType || "home",
        },
        deliveryType: "doorstep" as const,
        paymentMethod: "razorpay" as const,
        customerNotes: notes.trim() || undefined,
        items: items.map((it) => ({
          id: it.id,
          productId: it.id,
          customRequestId: it.customRequestId || (it.isCustom ? it.id : undefined),
          custom_request_id: it.customRequestId || (it.isCustom ? it.id : undefined),
          isCustom: it.isCustom,
          is_custom: it.isCustom,
          size: it.size,
          colour: it.colour,
          qty: it.qty,
        })),
      };

      const intent = await createBackendPaymentOrder(checkoutPayload);
      const ok = await loadRazorpay();
      const w = window as RazorpayWindow;
      if (!ok || !w.Razorpay) throw new Error("Could not reach Razorpay payment gateway. Please check your connection and try again.");

      await new Promise<void>((resolve, reject) => {
        let paymentCompleted = false;

        const options: Record<string, unknown> = {
          key: intent.keyId,
          amount: intent.amount,
          currency: intent.currency,
          order_id: intent.razorpayOrderId,
          name: storeInfo.name,
          description: `${items.length} item${items.length > 1 ? "s" : ""} · stitched to fit`,
          prefill: {
            name: effectiveAddress.fullName,
            contact: effectiveAddress.phone,
            email: user.email ?? "",
          },
          notes: { address: `${effectiveAddress.line1}, ${effectiveAddress.city}` },
          theme: { color: "#7a2e4a" },
          modal: {
            ondismiss: () => {
              if (paymentCompleted) return;
              void cancelBackendPaymentOrder(intent.razorpayOrderId).catch(() => {});
              reject(new Error("Payment cancelled. You can try again or select another payment method."));
            },
          },
          handler: (res: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            paymentCompleted = true;
            void (async () => {
              try {
                const confirmedOrder = await verifyBackendPayment({
                  razorpayOrderId: res.razorpay_order_id,
                  razorpayPaymentId: res.razorpay_payment_id,
                  razorpaySignature: res.razorpay_signature,
                });

                if (!confirmedOrder || !confirmedOrder.id) {
                  reject(new Error("We couldn't verify that payment. No order was placed."));
                  return;
                }

                clear();
                setCelebration({
                  id: confirmedOrder.id,
                  orderNo: confirmedOrder.orderNo,
                  total: inr(confirmedOrder.total || total),
                });
                resolve();

              } catch (err) {
                reject(err instanceof Error ? err : new Error("Payment verification failed."));
              }
            })();
          },
        };

        const rzp = new w.Razorpay!(options);

        if (typeof (rzp as any).on === "function") {
          (rzp as any).on("payment.failed", (response: any) => {
            const failDesc = response?.error?.description || response?.error?.reason || "Transaction was declined by bank or card issuer.";
            setError(`Payment failed: ${failDesc}`);
          });
        }

        rzp.open();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (celebration) {
    return (
      <PageShell>
        <PageHeader eyebrow="Checkout" title="Order Placed" compact crumbs={[{ label: "Checkout" }]} />
        <section className="grid min-h-[50vh] place-items-center bg-background py-24" />
        <OrderCelebration
          orderNo={celebration.orderNo}
          total={celebration.total}
          onDone={() => {
            void navigate({ to: "/orders/$id", params: { id: celebration.id } });
          }}
        />
      </PageShell>
    );
  }

  if (!ready || !user) {

    return (
      <PageShell>
        <PageHeader eyebrow="Checkout" title="Secure Checkout" compact crumbs={[{ label: "Checkout" }]} />
        <section className="grid place-items-center bg-background py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </section>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell>
        <PageHeader eyebrow="Checkout" title="Secure Checkout" compact crumbs={[{ label: "Checkout" }]} />
        <section className="bg-background py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Your bag is empty"
              message="Add a design to your bag and come back to complete checkout."
              actionLabel="Browse collections"
              actionTo="/"
            />
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="3 quick steps"
        title="Secure Checkout"
        compact
        subtitle={`Signed in as ${user.email ?? profile?.full_name ?? "your account"} — your address and order stay saved to your account.`}
        crumbs={[{ label: "Your Bag", to: "/cart" }, { label: "Checkout" }]}
      />

      <section className="bg-background py-8 lg:py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            {/* Step 1 — address */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
              <StepHead
                n={1}
                label="Delivery address"
                done={step > 1 && addressValid}
                active={step === 1}
                onEdit={() => setStep(1)}
              />

              {step === 1 ? (
                <div className="mt-5 space-y-3">
                  {saved.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(a.id);
                        setShowForm(false);
                      }}
                      className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition-colors ${
                        !showForm && selectedId === a.id
                          ? "border-primary bg-secondary/60"
                          : "border-border hover:bg-secondary/40"
                      }`}
                    >
                      <span
                        className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                          !showForm && selectedId === a.id
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {!showForm && selectedId === a.id ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{a.fullName}</span>
                          <StatusBadge tone="info">{a.addressType ?? "home"}</StatusBadge>
                          {a.isDefault ? <StatusBadge tone="gold">Default</StatusBadge> : null}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {[a.line1, a.line2, a.landmark, `${a.city} ${a.pincode}`, a.state]
                            .filter(Boolean)
                            .join(", ")}
                          <br />
                          Phone {a.phone}
                        </span>
                      </span>
                    </button>
                  ))}

                  {showForm ? (
                    <div className="grid gap-3 rounded-2xl border border-primary/40 bg-secondary/30 p-4 sm:grid-cols-2">
                      <Input
                        label="Full name"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="Your name"
                      />
                      <Input
                        label="Phone"
                        inputMode="tel"
                        maxLength={13}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="10-digit mobile"
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Flat / house no, street"
                          value={form.line1}
                          onChange={(e) => setForm({ ...form, line1: e.target.value })}
                          placeholder="12, Gandhi Street"
                        />
                      </div>
                      <Input
                        label="Area / locality (optional)"
                        value={form.line2 ?? ""}
                        onChange={(e) => setForm({ ...form, line2: e.target.value })}
                        placeholder="R.S. Puram"
                      />
                      <Input
                        label="Landmark (optional)"
                        value={form.landmark ?? ""}
                        onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                        placeholder="Near temple"
                      />
                      <Input
                        label="City"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Coimbatore"
                      />
                      <Input
                        label="State"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                      />
                      <Input
                        label="PIN code"
                        inputMode="numeric"
                        maxLength={6}
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        placeholder="Enter your PIN code"
                      />
                      <div className="sm:col-span-2">
                        <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Address type
                        </span>
                        <div className="flex gap-2">
                          {["home", "work", "other"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setForm({ ...form, addressType: t })}
                              className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                                form.addressType === t
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {saved.length ? (
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="text-left text-xs font-semibold text-primary hover:underline sm:col-span-2"
                        >
                          Use a saved address instead
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm font-medium text-primary transition-colors hover:bg-secondary/40"
                    >
                      <Plus className="h-4 w-4" /> Add a new address
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!addressValid}
                    onClick={() => setStep(2)}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-50"
                  >
                    Deliver to this address <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : shipping ? (
                <p className="mt-3 pl-11 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{shipping.fullName}</span> ·{" "}
                  {shipping.phone}
                  <br />
                  {[shipping.line1, shipping.line2, shipping.city, shipping.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}
            </div>

            {/* Step 2 — order review */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
              <StepHead
                n={2}
                label="Review your outfits"
                done={step > 2}
                active={step === 2}
                onEdit={() => setStep(2)}
              />
              {step === 2 ? (
                <div className="mt-5 space-y-4">
                  <ul className="divide-y divide-border/60">
                    {items.map((i) => (
                      <li key={i.key} className="flex gap-4 py-4">
                        <img
                          loading="lazy"
                          src={i.image}
                          alt={i.name}
                          className="h-24 w-20 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-semibold text-foreground">
                            {i.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Size {i.size} · {i.colour} · Qty {i.qty}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                            <Truck className="h-3.5 w-3.5" /> Expected by {fmtDate(eta)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{inr(i.price * i.qty)}</p>
                      </li>
                    ))}
                  </ul>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Stitching / delivery notes (optional)
                    </span>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      maxLength={500}
                      placeholder="Sleeve length, lining preference, delivery timing…"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]"
                  >
                    Continue to payment <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <p className="mt-3 pl-11 text-xs text-muted-foreground">
                  {items.length} item{items.length > 1 ? "s" : ""} · {inr(total)}
                </p>
              )}
            </div>

            {/* Step 3 — payment */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
              <StepHead n={3} label="Payment" done={false} active={step === 3} />
              {step === 3 ? (
                <div className="mt-5 space-y-3">
                  {(
                    [
                      {
                        id: "razorpay" as const,
                        icon: <CreditCard className="h-4 w-4" />,
                        label: "Pay online with Razorpay",
                        hint: "UPI, cards, netbanking & wallets — 100% secure.",
                      },
                      {
                        id: "cod" as const,
                        icon: <Wallet className="h-4 w-4" />,
                        label: "Pay on delivery",
                        hint: "Pay cash or UPI when your outfit arrives.",
                      },
                    ]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMethod(opt.id)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                        method === opt.id
                          ? "border-primary bg-secondary/60"
                          : "border-border hover:bg-secondary/40"
                      }`}
                    >
                      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary">
                        {opt.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                      </span>
                    </button>
                  ))}

                  {error ? (
                    <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled={busy || !addressValid}
                    onClick={() => void payNow()}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {method === "cod" ? `Place order · ${inr(total)}` : `Pay ${inr(total)} securely`}
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-[0.68rem] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Payments are processed by Razorpay. We
                    never store your card details.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Summary */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-foreground">Price details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Items ({items.reduce((n, i) => n + i.qty, 0)})
                  </dt>
                  <dd className="font-medium text-foreground">{inr(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd className="font-medium text-foreground">
                    {delivery === 0 ? "Free" : inr(delivery)}
                  </dd>
                </div>
                <div className="gold-divider my-2 h-px" />
                <div className="flex justify-between text-base">
                  <dt className="font-semibold text-foreground">Total payable</dt>
                  <dd className="font-semibold text-primary">{inr(total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Delivery fee calculated based on location and delivery type.
              </p>
              <Link to="/cart" className="mt-4 block text-center text-xs font-semibold text-primary hover:underline">
                Edit your bag
              </Link>
            </div>

            <div className="rounded-3xl border border-border/70 bg-secondary/50 p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Shipped by {courier.name}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {courier.service} from {courier.origin}. You'll get an AWB number and live scan
                updates on your order page.
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary">
                <BadgeCheck className="h-4 w-4" /> Expected delivery {fmtDate(eta)}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
