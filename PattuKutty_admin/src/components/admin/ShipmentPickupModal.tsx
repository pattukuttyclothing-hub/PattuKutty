import React, { useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, Truck, AlertCircle, X, Loader2 } from "lucide-react";
import { registerPickupAdmin } from "@/lib/api/orders";

interface ShipmentPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  awb: string;
  onSuccess: (shipment: any) => void;
}

export function ShipmentPickupModal({
  isOpen,
  onClose,
  orderId,
  awb,
  onSuccess,
}: ShipmentPickupModalProps) {
  // Default to today's date in YYYY-MM-DD
  const todayStr: string = new Date().toISOString().split("T")[0] || "";
  const [pickupDate, setPickupDate] = useState<string>(todayStr);
  const [pickupTime, setPickupTime] = useState<string>("1400");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await registerPickupAdmin(orderId, {
        pickupDate,
        pickupTime,
      });

      if (res && res.success && res.pickupToken) {
        toast.success(`Pickup scheduled! Token: ${res.pickupToken}`);
        onSuccess(res.shipment || { pickup_token: res.pickupToken, pickup_date: pickupDate, pickup_time: pickupTime, pickup_registration_status: "registered" });
        onClose();
      } else {
        const msg = res?.message || "Failed to schedule pickup with Blue Dart";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred during pickup registration";
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">Schedule Blue Dart Pickup</h3>
            <p className="text-xs text-stone-500 font-mono">AWB: {awb}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Blue Dart Rejection</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pickupDate" className="block text-xs font-medium text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-400" /> Pickup Date
            </label>
            <input
              id="pickupDate"
              name="pickupDate"
              type="date"
              min={todayStr}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="pickupTime" className="block text-xs font-medium text-stone-700 mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-stone-400" /> Pickup Time Window
            </label>
            <select
              id="pickupTime"
              name="pickupTime"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none transition"
            >
              <option value="1400">14:00 (2:00 PM Afternoon)</option>
              <option value="1600">16:00 (4:00 PM Evening)</option>
              <option value="1800">18:00 (6:00 PM Late Evening)</option>
              <option value="1200">12:00 (12:00 PM Noon)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scheduling...
                </>
              ) : (
                "Schedule Pickup"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
