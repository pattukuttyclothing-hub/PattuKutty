import { useEffect, useMemo, useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Upload, X, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, PageHead } from "@/components/admin/AdminShell";
import { ProductGallery } from "@/components/shared/ProductGallery";
import {
  categories,
  findCategory,
  getPermittedSizesForCategory,
  isSareeCategory,
  sizeOptions,
  subName,
  type SizeOption,
} from "@/data/boutique";
import { useAdmin, totalStock, isProductSoldOut, type AdminProduct } from "@/lib/admin-store";
import { createProduct, updateProduct, uploadProductImage, deleteProductImage, fetchProducts, toggleSizeAvailability } from "@/lib/api/catalogue";
import { ImageCropModal } from "@/components/shared/ImageCropModal";
import { inr } from "@/lib/format";


export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "Edit design — Pattu Kutty Admin" },
      {
        name: "description",
        content:
          "Edit photos, sizes, stock and pricing for a design before it reaches the storefront.",
      },
      { property: "og:title", content: "Edit design — Pattu Kutty Admin" },
      {
        property: "og:description",
        content: "Photos, sizes, stock and pricing for one design.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductEditor,
});

function ProductEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { findProduct, saveProduct } = useAdmin();
  const stored = findProduct(id);
  const [draft, setDraft] = useState<AdminProduct | undefined>(stored);
  const [soldOutConfirm, setSoldOutConfirm] = useState<SizeOption | null>(null);
  const [deleteConfirmImage, setDeleteConfirmImage] = useState<string | null>(null);
  const [updateConfirmImage, setUpdateConfirmImage] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const replacementFileInputRef = useRef<HTMLInputElement | null>(null);

  const isCreateMode = useMemo(
    () => id === "new" || id === "create" || id.startsWith("design-new"),
    [id],
  );

  // Crop State for Admin
  const [pendingAdminCropFile, setPendingAdminCropFile] = useState<File | null>(null);
  const [adminCropMode, setAdminCropMode] = useState<"add" | "replace">("add");
  const [adminCropQueue, setAdminCropQueue] = useState<File[]>([]);
  const [targetReplaceUrl, setTargetReplaceUrl] = useState<string | null>(null);

  const addFromDevice = (files: FileList | null) => {
    if (!files?.length || uploading) return;
    const picked = Array.from(files);
    setAdminCropMode("add");
    setPendingAdminCropFile(picked[0]!);
    setAdminCropQueue(picked.slice(1));
  };

  const handleConfirmDeleteImage = async () => {
    if (!deleteConfirmImage) return;
    const targetUrl = deleteConfirmImage;
    setDeletingImage(true);
    try {
      await deleteProductImage(targetUrl, isCreateMode ? undefined : draft?.id);
      setDraft((d) => (d ? { ...d, images: (d.images || []).filter((img) => img !== targetUrl) } : d));
      toast.success("Product image deleted successfully.");
      setDeleteConfirmImage(null);
    } catch (err: any) {
      const errMsg = err?.message || "Failed to delete product image.";
      toast.error(errMsg);
      if (errMsg.includes("session has expired") || errMsg.includes("Unauthorized")) {
        void navigate({ to: "/login" });
      }
      setDeleteConfirmImage(null);
    } finally {
      setDeletingImage(false);
    }
  };

  const handleConfirmUpdateImage = () => {
    if (!updateConfirmImage) return;
    // Trigger native file picker synchronously in response to touch gesture (iOS Safari touch compatible)
    replacementFileInputRef.current?.click();
  };

  const handleReplacementFileSelected = (files: FileList | null) => {
    if (!files?.length || !updateConfirmImage || uploading) return;
    const file = files[0];
    if (!file) return;
    setTargetReplaceUrl(updateConfirmImage);
    setAdminCropMode("replace");
    setPendingAdminCropFile(file);
  };

  const processCroppedAdminImage = async (croppedFile: File) => {
    setPendingAdminCropFile(null);
    setUploading(true);
    try {
      const res = await uploadProductImage(croppedFile);
      if (res?.url) {
        if (adminCropMode === "add") {
          setDraft((d) => (d ? { ...d, images: [...d.images, res.url] } : d));
          toast.success("Product photo cropped & uploaded to storage successfully.");

          // Process next file in queue if any
          if (adminCropQueue.length > 0) {
            const next = adminCropQueue[0]!;
            setAdminCropQueue(adminCropQueue.slice(1));
            setPendingAdminCropFile(next);
          }
        } else if (adminCropMode === "replace" && targetReplaceUrl) {
          try {
            await deleteProductImage(targetReplaceUrl, isCreateMode ? undefined : draft?.id);
          } catch (delErr) {
            console.warn("Failed to delete old image during replacement:", delErr);
          }
          setDraft((d) =>
            d
              ? {
                  ...d,
                  images: (d.images || []).map((img) => (img === targetReplaceUrl ? res.url : img)),
                }
              : d
          );
          toast.success("Product image replaced & uploaded successfully.");
          setTargetReplaceUrl(null);
          setUpdateConfirmImage(null);
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || "Please try again.";
      toast.error("Image upload failed: " + errMsg);
      if (errMsg.includes("session has expired") || errMsg.includes("Unauthorized")) {
        void navigate({ to: "/login" });
      }
    } finally {
      setUploading(false);
    }
  };


  useEffect(() => {
    if (stored && !draft) {
      setDraft(stored);
    } else if (!draft && isCreateMode) {
      setDraft({
        id: id || `design-new-${Date.now().toString(36)}`,
        name: "New Design",
        description: "Custom design stitched to exact measurements.",
        category: "blouses",
        sub: "bridal-blouses",
        basePrice: 1999,
        mrp: 2760,
        blurb: "Handcrafted boutique design",
        badge: "",
        expressFromPrice: 2299,
        deliveryCharge: 49,
        isActive: true,
        soldOut: false,
        images: [],
        variants: [
          { size: "S", available: true, stockQty: 1 },
          { size: "M", available: true, stockQty: 1 },
          { size: "L", available: true, stockQty: 1 },
        ],
      });
    }
  }, [stored, draft, isCreateMode, id]);


  const sizes = useMemo(
    () => (draft?.variants ? draft.variants.map((v) => v.size) : []),
    [draft],
  );

  const availableCount = useMemo(
    () => (draft ? totalStock(draft) : 0),
    [draft],
  );

  if (!draft) {
    return (
      <AdminShell>
        <PageHead title="Design not found" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Link to="/products" className="text-sm text-primary underline">
            Back to products
          </Link>
        </div>
      </AdminShell>
    );
  }

  const currentVariants = draft.variants ?? [];
  const currentImages = draft.images ?? [];

  const set = (patch: Partial<AdminProduct>) => setDraft({ ...draft, ...patch });

  const toggleSize = (s: SizeOption) => {
    if (sizes.includes(s)) {
      set({ variants: currentVariants.filter((v) => v.size !== s) });
    } else {
      set({ variants: [...currentVariants, { size: s, available: true, stockQty: 1 }] });
    }
  };

  const updateVariantStock = (s: SizeOption, qty: number) => {
    const safeQty = Math.max(0, qty);
    set({
      variants: currentVariants.map((v) =>
        v.size === s ? { ...v, stockQty: safeQty, available: safeQty > 0 } : v
      ),
    });
  };

  const toggleAvailability = (s: SizeOption) => {
    const variant = currentVariants.find((v) => v.size === s);
    if (!variant) return;

    if (variant.available) {
      setSoldOutConfirm(s);
    } else {
      const restored = currentVariants.map((v) =>
        v.size === s ? { ...v, available: true, stockQty: v.stockQty && v.stockQty > 0 ? v.stockQty : 1 } : v,
      );
      set({
        variants: restored,
        soldOut: false,
      });
      // Immediately persist the re-enable to the backend
      if (draft?.id && !isCreateMode) {
        toggleSizeAvailability(draft.id, s, true).catch((err: any) => {
          // Revert on failure
          set({ variants: currentVariants });
          toast.error("Failed to re-enable size: " + (err?.message || "Please try again."));
        });
      }
    }
  };

  const confirmSoldOut = async (s: SizeOption) => {
    const updatedVariants = currentVariants.map((v) =>
      v.size === s ? { ...v, available: false, stockQty: 0 } : v,
    );
    const allSoldOut = !updatedVariants.some((v) => v.available && (v.stockQty ?? 0) > 0);
    set({
      variants: updatedVariants,
      ...(allSoldOut ? { soldOut: true } : {}),
    });
    setSoldOutConfirm(null);
    // Immediately persist the size availability change to the backend
    if (draft?.id && !isCreateMode) {
      try {
        await toggleSizeAvailability(draft.id, s, false);
        toast("Size marked as sold out.", {
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        });
      } catch (err: any) {
        // Revert the local draft on API failure
        set({ variants: currentVariants });
        toast.error("Failed to update size availability: " + (err?.message || "Please try again."));
      }
    } else {
      toast("Size marked as sold out.", {
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      });
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      let result: AdminProduct;
      if (isCreateMode) {
        result = await createProduct({
          slug: draft.id,
          name: draft.name,
          categoryId: draft.category,
          subCategoryId: draft.sub,
          description: draft.description,
          blurb: draft.blurb,
          badge: draft.badge,
          basePrice: draft.basePrice,
          mrp: draft.mrp,
          expressFromPrice: draft.expressFromPrice,
          deliveryCharge: draft.deliveryCharge,
          isActive: draft.isActive,
          soldOut: draft.soldOut,
          images: draft.images,
          variants: draft.variants,
        });
      } else {
        result = await updateProduct(draft.id, {
          name: draft.name,
          description: draft.description,
          blurb: draft.blurb,
          badge: draft.badge,
          category: draft.category,
          sub: draft.sub,
          basePrice: draft.basePrice,
          mrp: draft.mrp,
          expressFromPrice: draft.expressFromPrice,
          deliveryCharge: draft.deliveryCharge,
          isActive: draft.isActive,
          soldOut: draft.soldOut,
          images: draft.images,
          variants: draft.variants,
        });
      }

      const mergedProduct: AdminProduct = {
        ...draft,
        ...result,
        id: result?.id || draft.id,
        category: result?.category || draft.category,
        sub: result?.sub || draft.sub,
        images: Array.isArray(result?.images) ? result.images : (draft.images || []),
        variants: Array.isArray(result?.variants) && result.variants.length > 0 ? result.variants : (draft.variants || []),
      };

      saveProduct(mergedProduct);
      setDraft(mergedProduct);

      if (isCreateMode && result?.id) {
        void navigate({ to: "/products/$id", params: { id: result.id }, replace: true });
      }

      setSuccessMsg(isCreateMode ? "Product created successfully" : "Design updated successfully");
      setShowSuccessModal(true);
    } catch (err: any) {
      toast.error("Failed to save product: " + (err?.message || "Please check your network connection"));
    } finally {
      setSaving(false);
    }
  };


  const cat = findCategory(draft.category);

  return (
    <AdminShell>
      <PageHead
        eyebrow={`${cat?.name ?? draft.category} · ${subName(draft.sub)}`}
        title={isCreateMode ? `Create — ${draft.name}` : draft.name}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            {!isCreateMode ? (
              <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-medium ${
                isProductSoldOut(draft)
                  ? "border-pink-500/40 bg-pink-500/15 text-pink-700 font-bold"
                  : availableCount > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600"
              }`}>
                {isProductSoldOut(draft) ? "PRODUCT SOLD OUT" : `${availableCount} in stock`}
              </span>
            ) : null}
            <span className="rounded-full border border-border bg-card px-3 py-1 text-[0.68rem] font-medium">
              {draft.isActive ? "Live on storefront" : "Hidden from storefront"}
            </span>
          </span>
        }
        actions={
          <>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isCreateMode ? "Create design" : "Update design"}
            </button>
          </>
        }
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 lg:gap-10 lg:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ---------------------------------------------------------- left */}
        <div>
          <ProductGallery images={currentImages} alt={draft.name} />

          <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold">Photos</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  First photo is the cover. Upload directly from your device to Supabase Storage.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[0.7rem] font-semibold tracking-[0.1em] text-primary-foreground uppercase shadow-soft">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload from device"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    className="hidden"
                    onChange={(e) => {
                      addFromDevice(e.target.files);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {/* Hidden File Input for Replacement Image Upload */}
                <input
                  ref={replacementFileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="hidden"
                  onChange={(e) => {
                    handleReplacementFileSelected(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {currentImages.map((src) => (
                <span key={src} className="group relative">
                  <img
                    src={src}
                    alt=""
                    className="h-20 w-16 rounded-2xl border border-border object-cover object-top shrink-0"
                  />
                  <div className="absolute -top-2 -right-2 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <button
                      type="button"
                      aria-label="Update photo"
                      title="Update / Replace Image"
                      onClick={() => setUpdateConfirmImage(src)}
                      className="grid h-9 w-9 sm:h-7 sm:w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft hover:scale-105 active:scale-95"
                    >
                      <RefreshCw className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove photo"
                      title="Delete Image"
                      onClick={() => setDeleteConfirmImage(src)}
                      className="grid h-9 w-9 sm:h-7 sm:w-7 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-soft hover:scale-105 active:scale-95"
                    >
                      <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>
                </span>
              ))}
              {!currentImages.length ? (
                <p className="text-xs text-muted-foreground">No photos yet — upload one from your device.</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- right */}
        <div className="space-y-6">
          {!isCreateMode ? (
            <Section title="Product Status & Sold Out">
              <div className="flex items-center justify-between rounded-2xl border border-pink-500/30 bg-pink-50/15 p-4">
                <div>
                  <span className="text-sm font-semibold text-foreground">Mark Product as Sold Out</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Shows "PRODUCT SOLD OUT" badge on cards and moves design to the bottom of catalogue.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={draft.soldOut}
                  onChange={(e) => set({ soldOut: e.target.checked })}
                  className="h-5 w-5 accent-pink-600 cursor-pointer"
                />
              </div>
            </Section>
          ) : null}

          <Section title="Basics">
            <Field label="Design name">
              <input
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Description shown on the product page">
              <textarea
                rows={6}
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                className="input min-h-32 resize-y leading-relaxed"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Short blurb on the storefront card">
                <input
                  value={draft.blurb}
                  onChange={(e) => set({ blurb: e.target.value })}
                  placeholder="e.g. Hand-worked aari, stitched to your fit"
                  className="input"
                />
              </Field>
              <Field label="Ribbon badge (optional)">
                <input
                  value={draft.badge}
                  onChange={(e) => set({ badge: e.target.value })}
                  placeholder="e.g. Bestseller"
                  className="input"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set({ category: c.id, sub: c.subs[0]!.id })}
                      className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[0.7rem] font-medium ${
                        draft.category === c.id
                          ? "border-primary bg-secondary text-primary"
                          : "border-border"
                      }`}
                    >
                      <img src={c.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                      {c.name}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Style">
                <div className="flex flex-wrap gap-2">
                  {(cat?.subs ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => set({ sub: s.id })}
                      className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[0.7rem] font-medium ${
                        draft.sub === s.id ? "border-primary bg-secondary text-primary" : "border-border"
                      }`}
                    >
                      <img src={s.images[0]} alt="" className="h-6 w-6 rounded-full object-cover" />
                      {s.name}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => set({ isActive: e.target.checked })}
                className="h-4 w-4 accent-[oklch(0.505_0.184_5.5)]"
              />
              Show this design on the customer storefront
            </label>
          </Section>

          <Section title={isSareeCategory(draft?.category, draft?.sub) ? "Saree specifications & stock" : "Sizes & independent stock"}>
            <p className="text-xs text-muted-foreground">
              {isSareeCategory(draft?.category, draft?.sub)
                ? "Select saree specifications for this product and set stock quantity."
                : "Select sizes for this design and specify the stock quantity available for each size independently."}
            </p>
            <div className="flex flex-wrap gap-2">
              {getPermittedSizesForCategory(draft?.category, draft?.sub).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                    sizes.includes(s) ? "border-primary bg-secondary text-primary" : "border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {sizes.length ? (
              <div className="space-y-3">
                {currentVariants.map((v) => (
                  <div
                    key={v.size}
                    className={`flex flex-wrap items-center justify-between rounded-2xl border p-3 gap-3 ${
                      v.available
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-destructive/20 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{v.size}</span>
                      <span className={`text-xs font-medium ${v.available ? "text-emerald-600" : "text-destructive"}`}>
                        {v.available ? `${v.stockQty ?? 1} in stock` : "Sold Out"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.7rem] font-medium text-muted-foreground">Qty:</span>
                        <input
                          type="number"
                          min={0}
                          value={v.stockQty !== undefined ? v.stockQty : (v.available ? 1 : 0)}
                          onChange={(e) => updateVariantStock(v.size, Number(e.target.value))}
                          className="w-16 rounded-xl border border-border bg-card px-2.5 py-1 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(v.size)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold transition-colors ${
                          v.available
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                            : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                        }`}
                      >
                        {v.available ? "Mark sold out" : "Re-stock"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Add at least one size.</p>
            )}
          </Section>

          <Section title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Selling price (₹)">
                <input
                  type="number"
                  min={1}
                  value={draft.basePrice}
                  onChange={(e) => set({ basePrice: Math.max(1, Number(e.target.value)) })}
                  className="input"
                />
              </Field>
              <Field label="MRP shown struck through (₹)">
                <input
                  type="number"
                  min={1}
                  value={draft.mrp}
                  onChange={(e) => set({ mrp: Math.max(1, Number(e.target.value)) })}
                  className="input"
                />
              </Field>
              <Field label="Express stitching from (₹)">
                <input
                  type="number"
                  min={0}
                  value={draft.expressFromPrice}
                  onChange={(e) => set({ expressFromPrice: Math.max(0, Number(e.target.value)) })}
                  className="input"
                />
              </Field>
              <Field label="Delivery charge (₹)">
                <input
                  type="number"
                  min={0}
                  value={draft.deliveryCharge}
                  onChange={(e) => set({ deliveryCharge: Math.max(0, Number(e.target.value)) })}
                  className="input"
                />
              </Field>
            </div>
            <div className="rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{inr(draft.basePrice)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-muted-foreground">Delivery charge</span>
                <span className="font-medium">
                  {draft.deliveryCharge > 0 ? inr(draft.deliveryCharge) : "Free"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="font-medium">Customer pays</span>
                <span className="font-display text-lg font-semibold text-primary">
                  {inr(draft.basePrice + draft.deliveryCharge)}
                </span>
              </div>
            </div>
          </Section>

          <button
            type="button"
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isCreateMode ? "Create design" : "Update design"}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">{successMsg}</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              The product design details have been stored in the database.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  fetchProducts().then(() => {
                    void navigate({ to: "/products" });
                  });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground uppercase tracking-wider shadow-soft"
              >
                View Products Category
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Sold-out size confirmation dialog */}
      {soldOutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
              <div>
                <h3 className="font-display text-base font-semibold">
                  Mark size {soldOutConfirm} as sold out?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Marking it sold out will update stock to 0 for this size.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSoldOutConfirm(null)}
                className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSoldOut(soldOutConfirm)}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-semibold text-white shadow-soft"
              >
                <CheckCircle2 className="h-4 w-4" /> Yes, mark sold out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete product image confirmation dialog */}
      {deleteConfirmImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />
              <div>
                <h3 className="font-display text-base font-semibold">
                  Delete product image?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Are you sure you want to delete this image?
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deletingImage}
                onClick={() => setDeleteConfirmImage(null)}
                className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingImage}
                onClick={handleConfirmDeleteImage}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-xs font-semibold text-destructive-foreground shadow-soft disabled:opacity-50"
              >
                {deletingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Yes, delete image
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Update product image confirmation dialog */}
      {updateConfirmImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
              <div>
                <h3 className="font-display text-base font-semibold">
                  Update product image?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Select a new image from your device to replace this product photo.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUpdateConfirmImage(null)}
                className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpdateImage}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-soft"
              >
                <RefreshCw className="h-4 w-4" /> Select replacement photo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Interactive Admin Product Image Crop & Adjust Modal */}
      <ImageCropModal
        open={Boolean(pendingAdminCropFile)}
        file={pendingAdminCropFile}
        title={adminCropMode === "replace" ? "Crop & Adjust Replacement Photo" : "Crop & Adjust Product Photo"}
        aspectRatio={4 / 5}
        onCropComplete={processCroppedAdminImage}
        onCancel={() => {
          setPendingAdminCropFile(null);
          setAdminCropQueue([]);
          setTargetReplaceUrl(null);
        }}
      />
    </AdminShell>

  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="gold-divider mt-3 mb-5" />
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      {children}
    </label>
  );
}
