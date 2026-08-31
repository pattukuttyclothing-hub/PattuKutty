import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Modal } from "./Dialogs";

export function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Delete Product",
  itemName,
  description = "Are you sure you want to delete this product? This will permanently remove the design, variants, and images from the store.",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName?: string | undefined;
  description?: string;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm();
    } finally {
      setDeleting(false);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={() => !deleting && onClose()} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h3 className="font-display text-lg font-bold text-foreground">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {itemName ? (
            <>
              Are you sure you want to delete <strong className="text-foreground font-semibold">"{itemName}"</strong>? This will permanently remove it from the database.
            </>
          ) : (
            description
          )}
        </p>

        <div className="mt-6 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-semibold text-destructive-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> Delete Product
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
