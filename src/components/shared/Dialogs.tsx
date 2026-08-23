import { useEffect, type ReactNode } from "react";
import { X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

/** Reusable modal shell — used by confirm, alert and edit popups across the app. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-3xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-maroon/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-fade-in relative z-10 max-h-[92vh] w-full ${width} overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-lift sm:rounded-3xl sm:p-6`}
      >
        <div className="flex items-start justify-between gap-4">
          {title ? (
            <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Confirm popup — destructive or neutral. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Go back",
  tone = "primary",
  onConfirm,
  onClose,
  children,
  disabled,
}: {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          {tone === "danger" ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <Info className="h-4 w-4 text-primary" />
          )}
          {title}
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className={`rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50 ${
              tone === "danger" ? "bg-destructive" : "bg-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {message ? <p className="text-sm leading-relaxed text-muted-foreground">{message}</p> : null}
      {children}
    </Modal>
  );
}

/** Alert / success popup. */
export function AlertDialog({
  open,
  title,
  message,
  onClose,
  actionLabel = "Okay",
  tone = "info",
}: {
  open: boolean;
  title: string;
  message?: ReactNode;
  onClose: () => void;
  actionLabel?: string;
  tone?: "info" | "success" | "warning";
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertTriangle : Info;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone === "warning" ? "text-destructive" : "text-primary"}`} />
          {title}
        </span>
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          {actionLabel}
        </button>
      }
    >
      {message ? <p className="text-sm leading-relaxed text-muted-foreground">{message}</p> : null}
    </Modal>
  );
}

/** Small inline info tooltip/popover for pricing notes. */
export function InfoTip({ text, label = "More information" }: { text: string; label?: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="grid h-5 w-5 place-items-center rounded-full bg-secondary text-primary"
      >
        <Info className="h-3 w-3" />
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 rounded-2xl border border-border bg-popover p-3 text-[0.7rem] leading-relaxed text-muted-foreground opacity-0 shadow-lift transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}
