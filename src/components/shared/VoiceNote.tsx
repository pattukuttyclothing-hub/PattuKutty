import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { uploadVoiceAudio } from "@/lib/storage";

/** Record a short voice note describing the design (optional). Uploads directly to Supabase Storage via backend API. */
export function VoiceNote({
  value,
  onChange,
}: {
  value?: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording) return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [recording]);

  const start = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = async () => {
        setUploading(true);
        try {
          const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
          const audioUrl = await uploadVoiceAudio(blob);
          onChange(audioUrl);
          setSuccessMsg("Voice note uploaded successfully.");
          toast.success("Voice note uploaded to storage successfully.");
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Voice note upload failed. Please try again.";
          setError(msg);
          toast.error(msg);
          onChange(undefined);
        } finally {
          setUploading(false);
          stream.getTracks().forEach((t) => t.stop());
        }
      };
      rec.start();
      recRef.current = rec;
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Microphone access was blocked. You can type the details instead.");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-secondary/50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Square className="h-3.5 w-3.5" /> Stop · {seconds}s
          </button>
        ) : uploading ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading voice note...
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Mic className="h-3.5 w-3.5" /> {value ? "Re-record voice note" : "Record voice note"}
          </button>
        )}
        {value ? (
          <>
            <audio src={value} controls preload="metadata" className="h-9 max-w-[13rem] outline-none" />
            <button
              type="button"
              aria-label="Delete voice note"
              onClick={() => {
                onChange(undefined);
                setSuccessMsg(null);
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-card text-destructive shadow-soft"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <span className="text-[0.7rem] text-muted-foreground">
            Prefer talking? Record it in Tamil or English.
          </span>
        )}
      </div>
      {successMsg && value ? (
        <p className="mt-2 text-[0.7rem] text-emerald-600 font-medium flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> {successMsg}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-[0.7rem] text-destructive">{error}</p> : null}
    </div>
  );
}

