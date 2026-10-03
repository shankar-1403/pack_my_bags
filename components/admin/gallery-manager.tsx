"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/types";
import { ImageUpload, MultiUpload } from "./image-upload";

const SHOWN = 22;

/** The Gallery page's prints: upload many at once, caption, hide, reorder, remove — then save. */
export function GalleryManager({ initial }: { initial: GalleryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const dirty = JSON.stringify(items) !== baseline;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (index: number, patch: Partial<GalleryItem>) => setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (from: number, to: number) =>
    setItems((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  async function save() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/gallery", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const data = (await response.json().catch(() => null)) as { items?: GalleryItem[]; error?: string } | null;
    setSaving(false);
    if (!response.ok || !data?.items) return setError(data?.error || "Could not save the gallery.");
    setItems(data.items);
    setBaseline(JSON.stringify(data.items));
    setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    router.refresh();
  }

  const visible = items.filter((item) => item.published).length;

  return (
    <div className="mt-8 pb-28">
      <MultiUpload
        label="Upload photos to the gallery"
        onAdd={(urls) => setItems((list) => [...list, ...urls.map((image) => ({ id: crypto.randomUUID(), image, place: "", region: "", published: true }))])}
      />

      <p className="mt-6 text-sm text-mist">
        {items.length} photo{items.length === 1 ? "" : "s"} · {visible} showing{visible > SHOWN ? ` (only the first ${SHOWN} fit on the table)` : ""}
      </p>

      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((item, index) => {
          const overflow = item.published && items.slice(0, index + 1).filter((i) => i.published).length > SHOWN;
          return (
            <li key={item.id} className={`rounded-[24px] border bg-cream p-3 ${item.place ? "border-line" : "border-[#f94f18]/60"} ${item.published ? "" : "opacity-60"}`}>
              <ImageUpload value={item.image} onChange={(url) => (url ? update(index, { image: url }) : setItems((list) => list.filter((_, i) => i !== index)))} aspect="aspect-square" />
              <div className="mt-3 grid gap-2">
                <input
                  value={item.place}
                  onChange={(e) => update(index, { place: e.target.value })}
                  placeholder="Place (written on the print) *"
                  aria-label="Place"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-clay"
                />
                <input
                  value={item.region}
                  onChange={(e) => update(index, { region: e.target.value })}
                  placeholder="Region (optional)"
                  aria-label="Region"
                  className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-clay"
                />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="mr-auto text-xs text-mist">#{index + 1}{overflow ? " · won't fit" : ""}</span>
                <label className="mr-1 inline-flex min-h-9 items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={item.published} onChange={(e) => update(index, { published: e.target.checked })} className="size-4" />
                  Show
                </label>
                <Small label="Move earlier" onClick={() => move(index, index - 1)} disabled={index === 0}>←</Small>
                <Small label="Move later" onClick={() => move(index, index + 1)} disabled={index === items.length - 1}>→</Small>
                <Small label="Remove" onClick={() => confirm("Remove this photo from the gallery?") && setItems((list) => list.filter((_, i) => i !== index))}>
                  <span className="text-[#c2410c]">✕</span>
                </Small>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:left-[240px]">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="text-sm text-mist" aria-live="polite">
            {error ? <span className="text-[#c2410c]">{error}</span> : dirty ? "Unsaved changes" : savedAt ? `Saved at ${savedAt}` : "All saved"}
          </span>
          <button type="button" onClick={save} disabled={saving || !dirty} className="ml-auto min-h-10 rounded-full bg-ink px-5 text-sm text-cream disabled:opacity-50">
            {saving ? "Saving…" : "Save gallery"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Small({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid size-9 place-items-center rounded-full text-sm hover:bg-sand disabled:opacity-30">
      {children}
    </button>
  );
}
