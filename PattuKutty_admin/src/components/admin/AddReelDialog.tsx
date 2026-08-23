import { useMemo, useRef, useState } from "react";
import { Check, Search, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { categories, findSub, type CategoryId } from "@/data/boutique";
import { useAdmin, type AdminProduct, type ReelItem } from "@/lib/admin-store";
import { inr, uid } from "@/lib/format";
import { uploadReelVideo } from "@/lib/api/catalogue";

const fileToUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    // Small clips are stored inline so the reel survives a refresh; larger
    // clips fall back to a session-only object URL.
    if (file.size > 3_500_000) {
      resolve(URL.createObjectURL(file));
      return;
    }
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read failed"));
    fr.readAsDataURL(file);
  });

type Props = {
  open: boolean;
  onClose: () => void;
  /** when set the dialog edits this reel instead of creating a new one */
  editing?: ReelItem | null;
};

export function AddReelDialog({ open, onClose, editing }: Props) {
  const { products, addProduct, addReel, saveReel } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState(editing?.videoUrl ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [productId, setProductId] = useState(editing?.productId ?? "");
  const [picking, setPicking] = useState(false);
  const [mode, setMode] = useState<"choose" | "create">("choose");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  // new-product draft
  const [nCat, setNCat] = useState<CategoryId>(categories[0]!.id);
  const [nSub, setNSub] = useState(categories[0]!.subs[0]!.id);
  const [nName, setNName] = useState("");
  const [nPrice, setNPrice] = useState(1999);
  const [nMrp, setNMrp] = useState(2760);
  const [nImages, setNImages] = useState<string[]>([]);

  const tagged = products.find((p) => p.id === productId);
  const subs = categories.find((c) => c.id === nCat)?.subs ?? [];

  const list = useMemo(
    () =>
      products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 60),
    [products, q],
  );

  if (!open) return null;

  const pickVideo = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const res = await uploadReelVideo(f);
      setVideoUrl(res.url);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
      toast.success(res.message || "Reel video uploaded to reels-section-videos storage successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload reel video to storage.");
    } finally {
      setBusy(false);
    }
  };

  const createProduct = () => {
    const s = findSub(nCat, nSub);
    if (!s) return;
    const imgs = nImages.length ? nImages : s.images.slice(0, 4);
    const p: AdminProduct = {
      id: uid(nSub),
      name: nName.trim() || `New ${s.name}`,
      description: `${s.name} — ${s.blurb.toLowerCase()}, stitched to exact measurements.`,
      category: nCat,
      sub: nSub,
      basePrice: nPrice,
      mrp: nMrp,
      blurb: s.blurb,
      badge: "",
      expressFromPrice: Math.round(nPrice * 1.15),
      deliveryCharge: 49,
      isActive: true,
      soldOut: false,
      images: imgs,
      variants: (["S", "M", "L"] as const).map((size) => ({ size, available: true })),
    };
    addProduct(p);
    setProductId(p.id);
    setPicking(false);
    setMode("choose");
    toast.success("Design added to the catalogue and tagged to this reel.");
  };

  const addProductImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls = await Promise.all(Array.from(files).slice(0, 4).map((f) => fileToUrl(f)));
    setNImages((l) => [...l, ...urls].slice(0, 4));
  };

  const submit = () => {
    if (!videoUrl) {
      toast.error("Upload a 9:16 reel video first.");
      return;
    }
    if (!productId) {
      toast.error("Tag a product to the reel.");
      return;
    }
    const finalTitle = title.trim() || "Studio reel";
    if (editing) {
      saveReel(editing.id, { videoUrl, title: finalTitle, productId });
      toast.success(`Reel "${finalTitle}" updated in database.`);
    } else {
      addReel({
        id: uid("rl"),
        videoUrl,
        title: finalTitle,
        productId,
      });
      toast.success(`Reel "${finalTitle}" saved to database & storefront.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-maroon/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card shadow-lift">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-blush px-6 py-4">
          <div>
            <p className="text-[0.62rem] font-semibold tracking-[0.24em] text-primary uppercase">
              Storefront reels
            </p>
            <h2 className="font-display mt-1 text-xl font-semibold">
              {editing ? "Edit Reel & Tagged Product" : "Add a Reel & Tag a Product"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-7 p-6 md:grid-cols-[240px_1fr]">
          {/* 9:16 upload box */}
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Reel video · 9:16
            </p>
            <div className="mt-3 aspect-[9/16] overflow-hidden rounded-3xl border border-dashed border-primary/40 bg-secondary/60">
              {videoUrl ? (
                <video src={videoUrl} autoPlay loop muted controls playsInline className="h-full w-full object-cover" />
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-primary"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-xs font-semibold">Upload reel</span>
                  <span className="px-6 text-center text-[0.68rem] text-muted-foreground">
                    Vertical MP4 from your phone or studio folder
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => void pickVideo(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 w-full rounded-full border border-primary/30 bg-secondary py-2 text-[0.7rem] font-semibold tracking-[0.1em] text-primary uppercase"
            >
              {busy ? "Reading…" : videoUrl ? "Replace video" : "Choose video"}
            </button>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Reel caption
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bridal lehenga reveal"
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>

            <div>
              <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Tag a product
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-background p-2.5">
                {tagged ? (
                  <>
                    <img
                      src={tagged.images[0]}
                      alt=""
                      className="h-12 w-10 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{tagged.name}</span>
                      <span className="text-xs text-primary">{inr(tagged.basePrice)}</span>
                    </span>
                  </>
                ) : (
                  <span className="flex-1 px-1 text-sm text-muted-foreground">
                    Choose a product
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPicking((v) => !v)}
                  className="rounded-full bg-primary px-4 py-2 text-[0.68rem] font-semibold tracking-[0.1em] text-primary-foreground uppercase"
                >
                  {picking ? "Close" : tagged ? "Change" : "Choose product"}
                </button>
              </div>
            </div>

            {picking ? (
              <div className="rounded-3xl border border-primary/25 bg-blush/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {(["choose", "create"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`rounded-full px-4 py-1.5 text-[0.68rem] font-semibold tracking-[0.1em] uppercase transition-colors ${
                        mode === m
                          ? "bg-primary text-primary-foreground"
                          : "border border-primary/30 bg-card text-primary"
                      }`}
                    >
                      {m === "choose" ? "Existing design" : "New design"}
                    </button>
                  ))}
                </div>

                {mode === "choose" ? (
                  <>
                    <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search designs…"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <div className="mt-3 grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                      {list.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProductId(p.id);
                            setPicking(false);
                          }}
                          className={`overflow-hidden rounded-2xl border bg-card text-left transition-colors ${
                            productId === p.id ? "border-primary" : "border-border hover:bg-secondary"
                          }`}
                        >
                          <span className="relative block aspect-[4/5]">
                            <img
                              src={p.images[0]}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                            {productId === p.id ? (
                              <span className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            ) : null}
                          </span>
                          <span className="block p-2.5">
                            <span className="block truncate text-xs font-semibold">{p.name}</span>
                            <span className="text-[0.7rem] text-primary">{inr(p.basePrice)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 space-y-4">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Added to the catalogue under its category, and tagged to this reel.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase">
                          Category
                        </span>
                        <select
                          value={nCat}
                          onChange={(e) => {
                            const c = e.target.value as CategoryId;
                            setNCat(c);
                            setNSub(categories.find((x) => x.id === c)!.subs[0]!.id);
                          }}
                          className="mt-1.5 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase">
                          Sub-category
                        </span>
                        <select
                          value={nSub}
                          onChange={(e) => setNSub(e.target.value)}
                          className="mt-1.5 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                          {subs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase">
                          Design name
                        </span>
                        <input
                          value={nName}
                          onChange={(e) => setNName(e.target.value)}
                          placeholder="Couture Bridal Lehenga"
                          className="mt-1.5 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase">
                          Price ₹
                        </span>
                        <input
                          type="number"
                          value={nPrice}
                          onChange={(e) => setNPrice(Number(e.target.value))}
                          className="mt-1.5 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase">
                          MRP ₹
                        </span>
                        <input
                          type="number"
                          value={nMrp}
                          onChange={(e) => setNMrp(Number(e.target.value))}
                          className="mt-1.5 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </label>
                    </div>

                    <div>
                      <span className="text-[0.68rem] font-semibold text-muted-foreground uppercase">
                        Photos
                      </span>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {(nImages.length ? nImages : findSub(nCat, nSub)?.images.slice(0, 4) ?? []).map(
                          (src, i) => (
                            <img
                              key={i}
                              src={src}
                              alt=""
                              className="h-16 w-14 rounded-xl object-cover"
                            />
                          ),
                        )}
                        <label className="grid h-16 w-14 cursor-pointer place-items-center rounded-xl border border-dashed border-primary/40 text-primary">
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => void addProductImages(e.target.files)}
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={createProduct}
                      className="rounded-full bg-primary px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.1em] text-primary-foreground uppercase"
                    >
                      Create & tag design
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.1em] uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-full bg-primary px-6 py-2.5 text-[0.7rem] font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft"
              >
                {editing ? "Save reel" : "Add reel"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
