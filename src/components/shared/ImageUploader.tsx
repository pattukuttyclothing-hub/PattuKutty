import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, RefreshCw, Maximize2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./Dialogs";
import { uploadDesignImage } from "@/lib/storage";

/**
 * Reference-image uploader with a large hero preview plus thumbnail strip.
 * Uploads images directly to Supabase Storage bucket custom-design-request-images via backend API.
 */
export function ImageUploader({
  images,
  onChange,
  max = 9,
  label = "Reference designs",
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
}) {
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (active > images.length - 1) setActive(Math.max(0, images.length - 1));
  }, [images.length, active]);

  const handleAdd = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    if (images.length >= max) {
      toast.warning(`Maximum ${max} reference photos allowed. Please remove some existing photos to add new custom photos.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const picked = Array.from(files).slice(0, max - images.length);
      const urls = await Promise.all(picked.map((f) => uploadDesignImage(f)));
      const next = [...images, ...urls].slice(0, max);
      onChange(next);
      setActive(Math.min(images.length, next.length - 1));
      toast.success("Reference photo uploaded to storage successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (files: FileList | null) => {
    if (!files?.length || replaceIdx === null || uploading) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadDesignImage(files[0]!);
      onChange(images.map((im, i) => (i === replaceIdx ? url : im)));
      setReplaceIdx(null);
      toast.success("Photo replaced successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const hero = images[active];

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.18em] text-foreground uppercase">{label}</p>
        <span className="text-[0.7rem] text-muted-foreground">
          {images.length}/{max} photos
        </span>
      </div>

      {error ? (
        <div className="mt-2 rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="underline text-[0.68rem]">
            Dismiss
          </button>
        </div>
      ) : null}

      {/* hero preview */}
      <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {hero ? (
          <div className="relative">
            <img
              loading="lazy"
              src={hero}
              alt={`Reference ${active + 1}`}
              className="aspect-[4/5] w-full bg-secondary object-cover"
            />
            {uploading ? (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-xs font-semibold text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                Uploading image...
              </div>
            ) : null}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                aria-label="View full size"
                onClick={() => setZoom(true)}
                className="grid h-9 w-9 place-items-center rounded-full bg-card/95 text-primary shadow-soft transition-transform hover:scale-105"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Replace this photo"
                onClick={() => {
                  setReplaceIdx(active);
                  replaceRef.current?.click();
                }}
                className="grid h-9 w-9 place-items-center rounded-full bg-card/95 text-primary shadow-soft transition-transform hover:scale-105"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Remove this photo"
                onClick={() => onChange(images.filter((_, n) => n !== active))}
                className="grid h-9 w-9 place-items-center rounded-full bg-card/95 text-destructive shadow-soft transition-transform hover:scale-105"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-[0.68rem] font-semibold text-foreground">
              Reference {active + 1} of {images.length}
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => addRef.current?.click()}
            className="grid aspect-[4/5] w-full place-items-center bg-secondary/50 text-primary transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <span className="px-8 text-center">
              {uploading ? (
                <>
                  <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
                  <span className="font-display mt-3 block text-base font-semibold text-foreground">
                    Uploading image...
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="mx-auto h-9 w-9" />
                  <span className="font-display mt-3 block text-base font-semibold text-foreground">
                    Upload your inspiration
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                    Add photos of the design, fabric or neck pattern — photos from Instagram or
                    Pinterest work perfectly.
                  </span>
                </>
              )}
            </span>
          </button>
        )}
      </div>

      {/* thumbnails */}
      <div className="mt-3 flex flex-wrap gap-2.5">
        {images.map((src, i) => (
          <button
            key={`${src.slice(-12)}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show reference ${i + 1}`}
            className={`h-20 w-16 overflow-hidden rounded-2xl border-2 transition-colors ${
              i === active ? "border-primary" : "border-border hover:border-primary/50"
            }`}
          >
            <img loading="lazy" src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        {images.length < max ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => addRef.current?.click()}
            className="grid h-20 w-16 place-items-center rounded-2xl border-2 border-dashed border-primary/40 bg-secondary/50 text-primary transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <span className="text-center">
              {uploading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="mx-auto h-5 w-5" />
                  <span className="mt-1 block text-[0.6rem] font-semibold">Add</span>
                </>
              )}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={addRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void handleAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handleReplace(e.target.files);
          e.target.value = "";
        }}
      />

      <Modal open={zoom} onClose={() => setZoom(false)} title="Reference photo" size="lg">
        {hero ? <img loading="lazy" src={hero} alt="Reference preview" className="w-full rounded-2xl" /> : null}

      </Modal>
    </div>
  );
}

