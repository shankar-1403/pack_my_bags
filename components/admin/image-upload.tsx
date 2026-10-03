"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";

export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !data?.url) throw new Error(data?.error || "Upload failed. Try again.");
  return data.url;
}

/**
 * One image: drop a file or click to choose; it uploads straight away and shows the result.
 * Replace and remove sit on the preview.
 */
export function ImageUpload({
  value,
  onChange,
  label = "Upload a photo",
  aspect = "aspect-[4/3]",
  compact = false,
  required = false,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
  compact?: boolean;
  required?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);

  async function take(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed transition ${aspect} ${compact ? "w-28" : "w-full"} ${
          over ? "border-[#f94f18] bg-[#f94f18]/5" : value ? "border-transparent" : "border-line bg-paper hover:border-ink/30"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
        ) : null}

        {value && !busy ? (
          <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button type="button" onClick={() => input.current?.click()} aria-label="Replace photo" title="Replace" className="grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white">
              <RefreshCw className="size-4" />
            </button>
            {!required ? (
              <button type="button" onClick={() => onChange("")} aria-label="Remove photo" title="Remove" className="grid size-9 place-items-center rounded-full bg-white/90 text-[#c2410c] shadow hover:bg-white">
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}

        {!value && !busy ? (
          <button type="button" onClick={() => input.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center text-sm text-mist hover:text-ink">
            <ImagePlus className={compact ? "size-5" : "size-7"} strokeWidth={1.5} />
            {compact ? null : (
              <>
                <span className="font-medium text-ink">{label}</span>
                <span className="text-xs">Click or drop · JPG, PNG, WebP, HEIC · up to 15 MB</span>
              </>
            )}
          </button>
        ) : null}

        {busy ? (
          <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm text-ink">
            <span className="flex items-center gap-2"><Loader2 className="size-5 animate-spin" />{compact ? "" : "Uploading…"}</span>
          </div>
        ) : null}

        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => take(e.target.files?.[0])} />
      </div>
      {error ? <p className="mt-1.5 text-xs text-[#c2410c]" role="alert">{error}</p> : null}
    </div>
  );
}

/** Many images at once: choose or drop several files; they upload one after another and are added in order. */
export function MultiUpload({ onAdd, label = "Add photos" }: { onAdd: (urls: string[]) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);

  async function take(list?: FileList | null) {
    const files = [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setError("");
    const urls: string[] = [];
    const failed: string[] = [];
    setProgress({ done: 0, total: files.length });
    for (const file of files) {
      try {
        urls.push(await uploadImage(file));
      } catch {
        failed.push(file.name);
      }
      setProgress({ done: urls.length + failed.length, total: files.length });
    }
    if (urls.length) onAdd(urls);
    if (failed.length) setError(`Could not upload: ${failed.join(", ")}`);
    setProgress(null);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <button
        type="button"
        disabled={Boolean(progress)}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-6 text-sm transition ${over ? "border-[#f94f18] bg-[#f94f18]/5" : "border-line bg-paper hover:border-ink/30"}`}
      >
        {progress ? (
          <span className="flex items-center gap-2 text-ink"><Loader2 className="size-5 animate-spin" />Uploading {progress.done + 1 > progress.total ? progress.total : progress.done + 1} of {progress.total}…</span>
        ) : (
          <>
            <ImagePlus className="size-6 text-mist" strokeWidth={1.5} />
            <span className="font-medium text-ink">{label}</span>
            <span className="text-xs text-mist">Choose or drop several at once</span>
          </>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => take(e.target.files)} />
      {error ? <p className="mt-1.5 text-xs text-[#c2410c]" role="alert">{error}</p> : null}
    </div>
  );
}
