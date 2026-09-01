import React, { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, XCircle, X, Loader2, Info } from "lucide-react";
import { cancelPickupAdmin } from "@/lib/api/orders";

interface ShipmentPickupCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  pickupToken: string;
  pickupDate?: string | undefined;
  onSuccess: (shipment: any) => void;
}

export function ShipmentPickupCancelModal({
  isOpen,
  onClose,
  orderId,
  pickupToken,
  pickupDate,
  onSuccess,
}: ShipmentPickupCancelModalProps) {
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await cancelPickupAdmin(orderId, reason.trim() || undefined);

      if (res && (res.success || res.cancelled)) {
        toast.success(`Pickup token ${pickupToken} cancelled with Blue Dart`);
        onSuccess(
          res.shipment || {
            pickup_token: pickupToken,
            pickup_registration_status: "cancelled",
          }
        );
        onClose();
      } else {
        const msg = res?.message || "Failed to cancel pickup with Blue Dart";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred during pickup cancellation";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">Cancel Blue Dart Pickup</h3>
            <p className="text-xs text-stone-500 font-mono">Token #{pickupToken}</p>
          </div>
        </div>

        <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
          <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <p>
            This action contacts Blue Dart to revoke pickup Token <strong>#{pickupToken}</strong>
            {pickupDate ? <> (scheduled for <strong>{pickupDate}</strong>)</> : ""}. The courier driver assignment for the boutique will be cancelled.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Blue Dart Cancellation Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pickupCancelReason" className="block text-xs font-medium text-stone-700 mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              id="pickupCancelReason"
              name="pickupCancelReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer requested dispatch date change or package delay"
              rows={3}
              disabled={loading}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-red-500 focus:bg-white focus:outline-none transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition"
            >
              Keep Pickup
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
