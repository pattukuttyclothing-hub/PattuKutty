import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Send, Sparkles } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/Page";
import { SpecForm, makeSpec, type Spec } from "@/components/custom/SpecForm";
import { StudioSpotlight } from "@/components/custom/StudioSpotlight";
import { SubmissionCelebration } from "@/components/custom/SubmissionCelebration";
import { StatusBadge } from "@/components/shared/Badge";
import { findProduct, type CategoryId } from "@/data/boutique";
import { useRequests } from "@/lib/requests";
import { useAuth, useAuthGate } from "@/lib/auth";
import { useCategories, useProduct } from "@/lib/useStorefront";

const title = "Design Studio — Create Your Own Outfit | Pattu Kutty";
const description =
  "Upload your reference designs, pick colour, size and stitching timeline, and our Coimbatore studio will tailor it exactly for you. 1-hour express available.";

type Search = { category?: CategoryId; sub?: string; product?: string };

export const Route = createFileRoute("/design-studio")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s["category"] === "string") out.category = s["category"] as CategoryId;
    if (typeof s["sub"] === "string") out.sub = s["sub"];
    if (typeof s["product"] === "string") out.product = s["product"];
    return out;
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignStudio,
});

function DesignStudio() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const categoriesList = useCategories();
  const { create } = useRequests();
  const { user, profile, ready } = useAuth();
  const gate = useAuthGate();

  const { product: fetchedProduct } = useProduct(search.product || "");
  const source = fetchedProduct || (search.product ? findProduct(search.product) : undefined);

  // Protect workflow: Redirect unauthenticated user to login before entering protected request workflow
  useEffect(() => {
    if (ready && !user) {
      void navigate({
        to: "/auth",
        search: { next: "/design-studio", reason: "Please log in to submit a custom design request." },
      });
    }
  }, [ready, user, navigate]);

  const initialCategory = search.category ?? source?.category ?? "blouses";
  const [spec, setSpec] = useState<Spec | null>(() => {
    const baseSpec = makeSpec(initialCategory, search.sub ?? source?.sub);
    const prodImgs = (source?.images || (source?.image ? [source.image] : [])).slice(0, 9);
    return {
      ...baseSpec,
      images: prodImgs.length > 0 ? prodImgs : baseSpec.images,
      colour: "Rani Pink",
      description: source ? `Customizing design based on product: "${source.name}". ` : "",
      phone: profile?.phone || (typeof window !== "undefined" ? window.localStorage.getItem("butterflies-phone") || "" : ""),
      ...(source ? { sourceProductId: source.id } : {}),
    };
  });

  // Dynamically populate product metadata whenever backend product loads asynchronously
  useEffect(() => {
    if (source && (!spec || spec.sourceProductId !== source.id)) {
      const catId = (search.category || source.category) as CategoryId;
      const prodImgs = (source.images && source.images.length > 0 ? source.images : source.image ? [source.image] : []).slice(0, 9);
      const baseSpec = makeSpec(catId, search.sub || source.sub);
      setSpec({
        ...baseSpec,
        images: prodImgs.length > 0 ? prodImgs : baseSpec.images,
        colour: "Rani Pink",
        description: `Customizing design based on product: "${source.name}". `,
        phone: profile?.phone || (typeof window !== "undefined" ? window.localStorage.getItem("butterflies-phone") || "" : ""),
        sourceProductId: source.id,
      });
    }
  }, [source, search.category, search.sub, profile?.phone]);

  const initialPhoneSetRef = useRef(false);
  useEffect(() => {
    if (profile?.phone && spec && !initialPhoneSetRef.current && !spec.phone) {
      initialPhoneSetRef.current = true;
      setSpec((prev) => (prev ? { ...prev, phone: profile.phone! } : prev));
    }
  }, [profile?.phone, spec]);
  const [done, setDone] = useState<string | null>(null);
  const [submittedSpec, setSubmittedSpec] = useState<Spec | null>(null);
  const categoryStepRef = useRef<HTMLDivElement | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // Onboarding spotlight: highlight "Step 1 · Pick Category" each time the page opens.
  useEffect(() => {
    const t = window.setTimeout(() => setGuideOpen(true), 450);
    return () => window.clearTimeout(t);
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chosen = spec?.category;

  const pick = (id: CategoryId) => {
    setGuideOpen(false);
    setSpec((prev) => {
      if (prev?.category === id) return prev;
      return makeSpec(id);
    });
  };

  const handleSubmit = () => {
    if (!spec || submitting) return;
    setErrorMsg(null);
    gate(() => {
      setSubmitting(true);
      create(spec)
        .then((created) => {
          if (!created || !created.id) {
            throw new Error("Design request submission failed. Valid request ID missing.");
          }
          setSubmittedSpec(spec);
          setDone(created.id);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Unable to submit your request. Please try again.";
          setErrorMsg(message);
        })
        .finally(() => {
          setSubmitting(false);
        });
    });
  };

  return (
    <PageShell>
      <StudioSpotlight
        targetRef={categoryStepRef}
        active={guideOpen && !done}
        onDismiss={() => setGuideOpen(false)}
      />
      <PageHeader
        eyebrow="Custom Stitching Studio"
        title="Design Your Outfit"
        subtitle="Bring your own fabric or pick from our studio catalogue. Upload your reference photos, select measurements, and get an instant quote from our tailors."
        crumbs={[{ label: "Home", to: "/" }, { label: "Design Studio" }]}
      />

      <section className="bg-background py-12 lg:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {errorMsg && (
            <div className="mb-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm font-medium text-destructive shadow-soft flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Submission Failed</p>
                <p className="mt-1 text-xs opacity-90">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-xs underline hover:opacity-80"
              >
                Dismiss
              </button>
            </div>
          )}

          {done && submittedSpec ? (
            <SubmissionCelebration
              requestId={done}
              spec={submittedSpec}
              onDesignAnother={() => {
                setDone(null);
                setSubmittedSpec(null);
                setSpec(null);
                setErrorMsg(null);
                setGuideOpen(true);
              }}
            />
          ) : (
            <div className="space-y-12">
              <div
                ref={categoryStepRef}
                className={`rounded-3xl transition-all duration-500 ${
                  guideOpen ? "relative z-[80] bg-background p-4 sm:p-5" : ""
                }`}
              >
                <h2 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Step 1 · Pick Category
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {categoriesList.map((c) => {
                    const isSelected = chosen === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pick(c.id as CategoryId)}
                        className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-soft ring-2 ring-primary"
                            : "border-border bg-card hover:border-border/80"
                        }`}
                      >
                        <div className="font-display text-base font-semibold text-foreground">
                          {c.name}
                        </div>
                        <div className="mt-1 text-[0.7rem] text-muted-foreground line-clamp-2">
                          {c.blurb}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {spec && (
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
                  <h2 className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Step 2 · Outfit Specifications & References
                  </h2>

                  <div className="mt-6">
                    {source ? (
                    <div className="mb-8 rounded-2xl border border-primary/30 bg-secondary/80 p-4 flex items-center gap-4 shadow-soft">
                      {source.images?.[0] || source.image ? (
                        <img loading="lazy" src={source.images?.[0] || source.image} alt={source.name} className="h-16 w-16 rounded-xl object-cover border border-border" />
                      ) : null}
                      <div>
                        <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold tracking-[0.14em] text-primary uppercase">
                          <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" /> Customizing Existing Product
                        </span>
                        <h3 className="font-display text-base font-bold text-foreground">{source.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Product photos are pre-loaded into your reference gallery below (max 9 photos). You can add new photos or adjust measurements.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <SpecForm spec={spec} onChange={setSpec} />
                  </div>

                  <div className="mt-10 border-t border-border/60 pt-6">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-xs font-semibold tracking-[0.14em] text-primary-foreground uppercase shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Submit Design Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
