"use client";

import { useRef, useState } from "react";
import { Check, Download, FileText, Loader2, TriangleAlert, Upload, X } from "lucide-react";
import type { ParseResult, TripImport } from "@/lib/trip-document";

type Mode = "empty" | "replace";

/**
 * Destination editor: fill the form from a document. Download the form (blank, or this trip already filled
 * in), complete it in Word or Google Docs, upload it, review what was found, then choose how to apply it.
 * Nothing is saved until the editor's own Save.
 */
export function TripDocumentImport({ tripId, onApply }: { tripId?: string; onApply: (data: TripImport, mode: Mode) => number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<(ParseResult & { file: string }) | null>(null);
  const [applied, setApplied] = useState("");
  const [over, setOver] = useState(false);

  async function read(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setApplied("");
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/trips/parse", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as (ParseResult & { error?: string }) | null;
      if (!response.ok || !data?.data) throw new Error(data?.error || "Could not read that document.");
      setResult({ ...data, file: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that document.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function apply(mode: Mode) {
    if (!result) return;
    const count = onApply(result.data, mode);
    setApplied(
      count
        ? `${count} field${count === 1 ? "" : "s"} filled from ${result.file}. Check them below, add photos, then Save.`
        : "Nothing changed — every field the document has is already filled. Use “Replace with document” to overwrite.",
    );
    setResult(null);
  }

  const href = tripId ? `/api/trips/document?id=${tripId}` : "/api/trips/document";

  return (
    <section id="import" className="scroll-mt-32 rounded-[28px] border border-dashed border-pine/30 bg-pine/[0.03] p-5 sm:p-6 md:scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-serif text-2xl tracking-tight">Fill from a document</h2>
          <p className="mt-1 text-sm text-mist">
            Optional. Download the form, fill it in Word or Google Docs, and upload it — the fields below fill themselves. You review everything before saving. Photos are added below as usual.
          </p>
        </div>
        <a href={href} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-cream px-4 text-sm hover:bg-sand">
          <Download className="size-4" />
          {tripId ? "Download this trip as a form" : "Download the form"}
        </a>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          read(e.dataTransfer.files?.[0]);
        }}
        className={`mt-4 flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-6 text-sm transition ${over ? "border-[#f94f18] bg-[#f94f18]/5" : "border-line bg-paper hover:border-ink/30"}`}
      >
        {busy ? (
          <span className="flex items-center gap-2 text-ink"><Loader2 className="size-5 animate-spin" />Reading the document…</span>
        ) : (
          <>
            <Upload className="size-6 text-mist" strokeWidth={1.5} />
            <span className="font-medium text-ink">Upload the filled form</span>
            <span className="text-xs text-mist">Click or drop · Word (.docx), PDF or text · up to 10 MB</span>
          </>
        )}
      </button>
      <input ref={input} type="file" accept=".docx,.pdf,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain" className="hidden" onChange={(e) => read(e.target.files?.[0])} />

      {error ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-[#c2410c]" role="alert"><TriangleAlert className="mt-0.5 size-4 shrink-0" />{error}</p>
      ) : null}
      {applied ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-pine" aria-live="polite"><Check className="mt-0.5 size-4 shrink-0" />{applied}</p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-line bg-cream p-4 sm:p-5" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 text-mist" />{result.file}</p>
            <button type="button" onClick={() => setResult(null)} aria-label="Discard" className="grid size-8 place-items-center rounded-full text-mist hover:bg-sand">
              <X className="size-4" />
            </button>
          </div>
          {result.found.length ? (
            <>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-mist">Found {result.found.length} fields</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {result.found.map((label) => (
                  <li key={label} className="rounded-full bg-pine/10 px-2.5 py-1 text-xs text-pine">{label}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm text-mist">No fields found in this document.</p>
          )}
          {result.warnings.length ? (
            <>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-[#c2410c]">Check these</p>
              <ul className="mt-2 space-y-1 text-sm text-ink/75">
                {result.warnings.map((warning) => (
                  <li key={warning} className="flex gap-2"><TriangleAlert className="mt-1 size-3.5 shrink-0 text-[#c2410c]" />{warning}</li>
                ))}
              </ul>
            </>
          ) : null}
          {result.found.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => apply("empty")} className="min-h-10 rounded-full bg-ink px-4 text-sm text-cream">Fill empty fields only</button>
              <button
                type="button"
                onClick={() => confirm("Replace the fields below with what's in the document? Photos stay as they are. Nothing is saved until you press Save.") && apply("replace")}
                className="min-h-10 rounded-full border border-line px-4 text-sm hover:bg-sand"
              >
                Replace with document
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
