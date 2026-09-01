import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCw, RefreshCcw, Check, X } from "lucide-react";
import { Modal } from "./Dialogs";

export interface ImageCropModalProps {
  open: boolean;
  file: File | null;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number; // e.g. 4/5 = 0.8 for boutique dress portraits, 1.0 for square
  title?: string;
}

export function ImageCropModal({
  open,
  file,
  onCropComplete,
  onCancel,
  aspectRatio = 4 / 5,
  title = "Crop & Adjust Image",
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeAspect, setActiveAspect] = useState<number>(aspectRatio);
  const [processing, setProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load File to Object URL
  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      setImgElement(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setActiveAspect(aspectRatio);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImgElement(img);
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, aspectRatio]);

  // Compute crop box dimensions based on container and aspect ratio
  const cropBoxWidth = 320;
  const cropBoxHeight = Math.round(cropBoxWidth / activeAspect);

  // Clamp offset so image fills crop box cleanly
  const clampOffset = useCallback(
    (offX: number, offY: number, currentZoom: number, currentRot: number) => {
      if (!imgElement) return { x: offX, y: offY };

      const is90or270 = currentRot === 90 || currentRot === 270;
      const naturalW = is90or270 ? imgElement.naturalHeight : imgElement.naturalWidth;
      const naturalH = is90or270 ? imgElement.naturalWidth : imgElement.naturalHeight;

      const baseScale = Math.max(cropBoxWidth / naturalW, cropBoxHeight / naturalH);
      const totalScale = baseScale * currentZoom;

      const dispW = naturalW * totalScale;
      const dispH = naturalH * totalScale;

      const maxPanX = Math.max(0, (dispW - cropBoxWidth) / 2);
      const maxPanY = Math.max(0, (dispH - cropBoxHeight) / 2);

      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, offX)),
        y: Math.min(maxPanY, Math.max(-maxPanY, offY)),
      };
    },
    [imgElement, cropBoxWidth, cropBoxHeight]
  );

  // Pointer drag handlers for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    const clamped = clampOffset(nextX, nextY, zoom, rotation);
    setOffset(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Non-passive wheel zoom handler to prevent "Unable to preventDefault inside passive event listener invocation"
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !open) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(3.0, Math.max(1.0, prevZoom + delta));
        setOffset((prevOffset) => clampOffset(prevOffset.x, prevOffset.y, nextZoom, rotation));
        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [open, rotation, clampOffset]);

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, nextRot));
  };

  const handleReset = () => {
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Generate Cropped Image File on Canvas
  const handleApplyCrop = () => {
    if (!imgElement || !file) return;
    setProcessing(true);

    try {
      const outputWidth = 900;
      const outputHeight = Math.round(outputWidth / activeAspect);

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Fill canvas background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const is90or270 = rotation === 90 || rotation === 270;
      const naturalW = is90or270 ? imgElement.naturalHeight : imgElement.naturalWidth;
      const naturalH = is90or270 ? imgElement.naturalWidth : imgElement.naturalHeight;

      const baseScale = Math.max(cropBoxWidth / naturalW, cropBoxHeight / naturalH);
      const totalScale = baseScale * zoom;

      const factor = outputWidth / cropBoxWidth;

      // Translate to canvas center + pan offset
      ctx.translate(outputWidth / 2 + offset.x * factor, outputHeight / 2 + offset.y * factor);
      ctx.rotate((rotation * Math.PI) / 180);

      // Draw original image centered
      const drawW = imgElement.naturalWidth * totalScale * factor;
      const drawH = imgElement.naturalHeight * totalScale * factor;
      ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setProcessing(false);
            return;
          }
          const croppedFileName = file.name.replace(/\.[^/.]+$/, "") + "_cropped.jpg";
          const croppedFile = new File([blob], croppedFileName, { type: "image/jpeg" });
          setProcessing(false);
          onCropComplete(croppedFile);
        },
        "image/jpeg",
        0.92
      );
    } catch (err) {
      console.error("Cropping failed:", err);
      setProcessing(false);
    }
  };

  if (!open || !file || !imageSrc) return null;

  // Calculate transform for preview display
  const is90or270 = rotation === 90 || rotation === 270;
  const naturalW = imgElement ? (is90or270 ? imgElement.naturalHeight : imgElement.naturalWidth) : 1;
  const naturalH = imgElement ? (is90or270 ? imgElement.naturalWidth : imgElement.naturalHeight) : 1;
  const baseScale = Math.max(cropBoxWidth / naturalW, cropBoxHeight / naturalH);
  const totalScale = baseScale * zoom;

  const displayedW = (imgElement?.naturalWidth || 1) * totalScale;
  const displayedH = (imgElement?.naturalHeight || 1) * totalScale;

  return (
    <Modal open={open} onClose={onCancel} title={title} size="md">
      <div className="flex flex-col items-center">
        <p className="text-xs text-muted-foreground mb-3 text-center">
          Drag photo to position • Scroll or use slider to zoom
        </p>

        {/* Aspect Ratio Selector Pills */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveAspect(4 / 5);
              setOffset((prev) => clampOffset(prev.x, prev.y, zoom, rotation));
            }}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              Math.abs(activeAspect - 4 / 5) < 0.05
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            4:5 Portrait
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveAspect(1);
              setOffset((prev) => clampOffset(prev.x, prev.y, zoom, rotation));
            }}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              Math.abs(activeAspect - 1) < 0.05
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            1:1 Square
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveAspect(3 / 4);
              setOffset((prev) => clampOffset(prev.x, prev.y, zoom, rotation));
            }}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              Math.abs(activeAspect - 3 / 4) < 0.05
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            3:4 Standard
          </button>
        </div>

        {/* Crop Stage Viewport */}
        <div
          ref={containerRef}
          style={{ width: cropBoxWidth, height: cropBoxHeight }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative overflow-hidden rounded-2xl border-2 border-primary bg-black/90 cursor-grab active:cursor-grabbing shadow-2xl select-none touch-none"
        >
          {/* Transforming Image */}
          {imgElement ? (
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none origin-center transition-transform duration-75 ease-out"
              style={{
                width: displayedW,
                height: displayedH,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={imageSrc}
                alt="Crop target"
                className="w-full h-full object-fill select-none"
                draggable={false}
              />
            </div>
          ) : null}

          {/* Grid Overlay for Rule of Thirds */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-r border-b border-white/15" />
            <div className="border-b border-white/15" />
            <div className="border-r border-white/15" />
            <div className="border-r border-white/15" />
            <div />
          </div>
        </div>

        {/* Interactive Controls Bar */}
        <div className="w-full max-w-xs mt-5 flex flex-col gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <input
              id="zoomRange"
              name="zoomRange"
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => {
                const z = parseFloat(e.target.value);
                setZoom(z);
                setOffset((prev) => clampOffset(prev.x, prev.y, z, rotation));
              }}
              className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <span className="text-[0.7rem] font-mono text-muted-foreground w-8 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation & Reset Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Rotate 90°
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset Position
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="w-full flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={processing}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-full shadow-soft transition-all disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {processing ? "Cropping..." : "Apply & Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
