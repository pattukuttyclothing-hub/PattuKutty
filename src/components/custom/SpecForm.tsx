import { Check, Upload, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { VoiceNote } from "@/components/shared/VoiceNote";
import { InfoTip } from "@/components/shared/Dialogs";
import { StatusBadge } from "@/components/shared/Badge";
import {
  colourSwatches,
  findCategory,
  timelines,
  type CategoryId,
  type TimelineId,
} from "@/data/boutique";
import { fulfilmentOptions, type FulfilmentId } from "@/lib/requests";
import { uploadDesignImage } from "@/lib/storage";
import { ImageCropModal } from "@/components/shared/ImageCropModal";

export type Measurements = Record<string, number | undefined>;

export type Spec = {
  category: CategoryId;
  sub: string;
  images: string[];
  colour: string;
  colourImage?: string | undefined;
  description: string;
  voiceNote?: string | undefined;
  phone: string;
  qty: number;
  size: string;
  measurements?: Measurements | undefined;
  timeline: TimelineId;
  fulfilment: FulfilmentId;
  sourceProductId?: string | undefined;
};

export const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Custom"];

const categoryMeasurementFields: Record<string, { key: string; label: string }[]> = {
  blouses: [
    { key: "bust_round", label: "Bust Round (in)" },
    { key: "waist_round", label: "Waist Round (in)" },
    { key: "shoulder_width", label: "Shoulder Width (in)" },
    { key: "sleeve_length", label: "Sleeve Length (in)" },
    { key: "front_neck_depth", label: "Front Neck Depth (in)" },
    { key: "back_neck_depth", label: "Back Neck Depth (in)" },
    { key: "armhole_round", label: "Armhole Round (in)" },
  ],
  "half-saree": [
    { key: "skirt_length", label: "Skirt Length (in)" },
    { key: "waist_round", label: "Waist Round (in)" },
    { key: "hip_round", label: "Hip Round (in)" },
    { key: "blouse_length", label: "Blouse Length (in)" },
  ],
  frocks: [
    { key: "full_length", label: "Full Length (in)" },
    { key: "bust_round", label: "Bust Round (in)" },
    { key: "waist_round", label: "Waist Round (in)" },
    { key: "shoulder_width", label: "Shoulder Width (in)" },
  ],
  sarees: [
    { key: "blouse_length", label: "Blouse Length (in)" },
    { key: "bust_round", label: "Bust Round (in)" },
    { key: "waist_round", label: "Waist Round (in)" },
  ],
};

export const makeSpec = (category?: string, sub?: string): Spec => {
  const cat = findCategory(category || "blouses");
  const validCategory = cat.id as CategoryId;
  const validSub = sub && cat.subs?.some((s) => s.id === sub) ? sub : (cat.subs?.[0]?.id ?? "bridal-blouses");

  return {
    category: validCategory,
    sub: validSub,
    images: [],
    colour: colourSwatches[0]?.name ?? "Rani Pink",
    description: "",
    /** phone is pre-filled from the saved customer profile / details, editable */
    phone: typeof window === "undefined" ? "" : window.localStorage.getItem("butterflies-phone") || "",
    qty: 1,
    size: "M",
    measurements: {},
    timeline: "1-day",
    fulfilment: "pickup",
  };
};

const Field = ({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-2">
      <p className="text-xs font-semibold tracking-[0.18em] text-foreground uppercase">{label}</p>
      {hint}
    </div>
    <div className="mt-3">{children}</div>
  </div>
);

/**
 * The full custom-design specification form. Reused by the Design Studio page
 * and by the "update specifications" popup on a request.
 */
export function SpecForm({
  spec,
  onChange,
  compact = false,
}: {
  spec: Spec;
  onChange: (next: Spec) => void;
  compact?: boolean;
}) {
  const cat = findCategory(spec?.category || "blouses")!;
  const colourFile = useRef<HTMLInputElement>(null);
  const [uploadingColour, setUploadingColour] = useState(false);
  const [colourError, setColourError] = useState<string | null>(null);
  const [pendingColourCropFile, setPendingColourCropFile] = useState<File | null>(null);
  const [customSizeInput, setCustomSizeInput] = useState(
    !sizeOptions.includes(spec.size) ? spec.size : "",
  );

  const processCroppedColourImage = async (croppedFile: File) => {
    setPendingColourCropFile(null);
    setColourError(null);
    setUploadingColour(true);
    try {
      const url = await uploadDesignImage(croppedFile);
      set({ colourImage: url, colour: "Custom shade (uploaded)" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Colour upload failed.";
      setColourError(msg);
    } finally {
      setUploadingColour(false);
    }
  };


  const set = (patch: Partial<Spec>) => onChange({ ...spec, ...patch });

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground font-semibold"
        : "border-border bg-card text-foreground hover:bg-secondary"
    }`;

  const measFields = categoryMeasurementFields[spec.category] || categoryMeasurementFields["blouses"]!;

  const updateMeasurement = (key: string, valStr: string) => {
    const num = valStr.trim() !== "" ? parseFloat(valStr) : undefined;
    const currentMeas = { ...(spec.measurements || {}) };
    if (num !== undefined && !isNaN(num) && num > 0) {
      currentMeas[key] = num;
    } else {
      delete currentMeas[key]; // OMIT UNKNOWN / UNPROVIDED MEASUREMENTS
    }
    set({ measurements: currentMeas });
  };

  return (
    <div className={`grid gap-8 ${compact ? "" : "lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12"}`}>
      {/* -------- left: reference images -------- */}
      <div className={`space-y-5 ${compact ? "" : "h-fit lg:sticky lg:top-28"}`}>
        <ImageUploader images={spec.images} onChange={(images) => set({ images })} />
        <div className="rounded-2xl border border-dashed border-primary/30 bg-secondary/50 p-4 text-[0.75rem] leading-relaxed text-muted-foreground">
          Photos of your design, fabric or neck pattern help our designer quote faster.
          Screenshots from Instagram or Pinterest work great.
        </div>
      </div>

      {/* -------- right: specifications -------- */}
      <div className="space-y-7">
        <Field label={`${cat.name} style`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cat.subs.map((s) => {
              const on = spec.sub === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => set({ sub: s.id })}
                  className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all ${
                    on
                      ? "border-primary shadow-lift"
                      : "border-transparent shadow-soft hover:border-primary/40"
                  }`}
                >
                  <img
                    loading="lazy"
                    src={s.images[0]}
                    alt={s.name}
                    className="aspect-[3/4] w-full bg-secondary object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
                    <span className="text-xs leading-tight font-semibold text-background">
                      {s.name}
                    </span>
                    {on ? (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Colour (Optional)"
          hint={<InfoTip text="Pick a shade or optionally upload a photo of the fabric shade you want matched." />}
        >
          <div className="flex flex-wrap gap-2">
            {colourSwatches.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-label={c.name}
                onClick={() => set({ colour: c.name })}
                className={`flex items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-xs transition-colors ${
                  spec.colour === c.name
                    ? "border-primary bg-secondary font-semibold text-primary"
                    : "border-border bg-card text-foreground hover:bg-secondary/60"
                }`}
              >
                <span
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={uploadingColour}
              onClick={() => colourFile.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-secondary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {uploadingColour ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading colour...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Upload my colour photo
                </>
              )}
            </button>
            {spec.colourImage ? (
              <span className="inline-flex items-center gap-2">
                <img loading="lazy" src={spec.colourImage} alt="Uploaded colour" className="h-9 w-9 rounded-full object-cover border border-border" />
                <button
                  type="button"
                  onClick={() => set({ colourImage: undefined, colour: colourSwatches[0]!.name })}
                  className="text-[0.7rem] font-medium text-destructive"
                >
                  Remove photo
                </button>
              </span>
            ) : null}
            <input
              ref={colourFile}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setPendingColourCropFile(file);
              }}
            />
          </div>
          {colourError ? <p className="mt-1 text-xs text-destructive">{colourError}</p> : null}
        </Field>

        <ImageCropModal
          open={Boolean(pendingColourCropFile)}
          file={pendingColourCropFile}
          title="Crop & Adjust Custom Shade Photo"
          aspectRatio={1}
          onCropComplete={processCroppedColourImage}
          onCancel={() => setPendingColourCropFile(null)}
        />


        <Field label="Design details">
          <textarea
            value={spec.description}
            maxLength={1000}
            onChange={(e) => set({ description: e.target.value })}
            rows={4}
            placeholder="Neck pattern, sleeve length, lining, embroidery, occasion…"
            className="w-full rounded-2xl border border-border bg-card p-4 text-sm text-foreground outline-none focus:border-primary"
          />
          <div className="mt-3">
            <VoiceNote value={spec.voiceNote} onChange={(voiceNote) => set({ voiceNote })} />
          </div>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Phone" hint={<InfoTip text="Prefilled from your saved profile details. Edit it if we should reach you on another number." />}>
            <input
              value={spec?.phone || ""}
              maxLength={18}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+91 …"
              className="w-full rounded-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="Size Label" hint={<InfoTip text="Select standard size or specify custom size label." />}>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((s) => {
                const isSelected = spec.size === s || (s === "Custom" && !sizeOptions.slice(0, -1).includes(spec.size));
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (s === "Custom") {
                        set({ size: customSizeInput.trim() || "Custom" });
                      } else {
                        set({ size: s });
                      }
                    }}
                    className={pill(isSelected)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {(!sizeOptions.slice(0, -1).includes(spec.size) || spec.size === "Custom") ? (
              <div className="mt-3">
                <input
                  type="text"
                  value={customSizeInput}
                  placeholder="Enter custom size label (e.g. Custom-42, 4XL)"
                  onChange={(e) => {
                    setCustomSizeInput(e.target.value);
                    set({ size: e.target.value.trim() || "Custom" });
                  }}
                  className="w-full rounded-full border border-border bg-card px-4 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            ) : null}
          </Field>
        </div>

        {/* -------- Category-Specific Optional Measurements -------- */}
        <Field
          label="Optional Exact Body Measurements (Inches)"
          hint={<InfoTip text="Only fill the measurements you know. Leave unknown fields empty — we will never force fake values." />}
        >
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
            <p className="text-[0.72rem] text-muted-foreground mb-3">
              Optional for <span className="font-semibold text-foreground">{cat.name}</span> stitching. Leave unknown values blank.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {measFields.map((f) => {
                const currentVal = spec.measurements?.[f.key];
                return (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[0.7rem] font-medium text-foreground block">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="100"
                      placeholder="Optional"
                      value={currentVal !== undefined ? currentVal : ""}
                      onChange={(e) => updateMeasurement(f.key, e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Field>

        <Field label="Quantity">
          <div className="inline-flex items-center gap-4 rounded-full border border-border bg-card px-3 py-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => set({ qty: Math.max(1, spec.qty - 1) })}
              className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-semibold text-foreground">{spec.qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => set({ qty: spec.qty + 1 })}
              className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary"
            >
              +
            </button>
          </div>
        </Field>

        <Field label="Turnaround Window">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-[0.72rem] leading-relaxed text-foreground">
            Select your preferred stitching window. Final quotation will be shared by our studio designer after reviewing your fabric & embroidery details.
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {timelines.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set({ timeline: t.id })}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  spec.timeline === t.id
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:bg-secondary/60"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-semibold text-foreground">{t.label}</span>
                  {t.badge ? <StatusBadge tone={t.id === "1-hour" ? "gold" : "ok"}>{t.badge}</StatusBadge> : null}
                </span>
                <span className="mt-1.5 block text-[0.7rem] text-muted-foreground">{t.note}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="Fulfillment Method"
          hint={<InfoTip text="Store pickup has no delivery charge. Doorstep delivery adds courier handling." />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {fulfilmentOptions.map((f) => {
              const on = spec.fulfilment === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => set({ fulfilment: f.id })}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    on ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary/60"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-semibold text-foreground">
                      {f.label}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {f.fee === 0 ? "Boutique Pickup" : "Doorstep Courier"}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[0.7rem] leading-relaxed text-muted-foreground">
                    {f.note}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </div>
  );
}

