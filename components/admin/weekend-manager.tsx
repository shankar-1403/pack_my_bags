"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WeekendBanner } from "@/lib/types";
import { ImageUpload, MultiUpload } from "./image-upload";

const field = "w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-clay";

/** Home page weekend banners: upload landscape photos, add optional text and a link, hide, reorder, save. */
export function WeekendManager({ initial }: { initial: WeekendBanner[] }) {
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

  const update = (index: number, patch: Partial<WeekendBanner>) => setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
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
    const response = await fetch("/api/weekend", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    const data = (await response.json().catch(() => null)) as { items?: WeekendBanner[]; error?: string } | null;
    setSaving(false);
    if (!response.ok || !data?.items) return setError(data?.error || "Could not save the banners.");
    setItems(data.items);
    setBaseline(JSON.stringify(data.items));
    setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    router.refresh();
  }

  const showing = items.filter((item) => item.published).length;

  return (
    <div className="mt-8 pb-28">
      <MultiUpload
        label="Upload landscape banner photos"
        onAdd={(urls) => setItems((list) => [...list, ...urls.map((image) => ({ id: crypto.randomUUID(), image, title: "", subtitle: "", link: "/trips?type=weekend", published: true }))])}
      />
      <p className="mt-6 text-sm text-mist">
        {items.length} banner{items.length === 1 ? "" : "s"} · {showing} showing{showing === 0 ? " — the section is hidden on the home page" : ""}
      </p>

      <ul className="mt-3 grid gap-4">
        {items.map((item, index) => (
          <li key={item.id} className={`grid gap-4 rounded-[24px] border border-line bg-cream p-3 sm:p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] ${item.published ? "" : "opacity-60"}`}>
            <ImageUpload value={item.image} onChange={(url) => (url ? update(index, { image: url }) : setItems((list) => list.filter((_, i) => i !== index)))} aspect="aspect-[21/9]" />
            <div className="grid content-start gap-2">
              <input value={item.title} onChange={(e) => update(index, { title: e.target.value })} placeholder="Title (optional) — e.g. Two days in the hills" aria-label="Title" className={field} />
              <input value={item.subtitle} onChange={(e) => update(index, { subtitle: e.target.value })} placeholder="Line under it (optional)" aria-label="Line under the title" className={field} />
              <input value={item.link} onChange={(e) => update(index, { link: e.target.value })} placeholder="Button link (optional) — /trips?type=weekend" aria-label="Button link" className={field} />
              <div className="mt-1 flex items-center gap-1">
                <span className="mr-auto text-xs text-mist">Slide {index + 1}</span>
                <label className="mr-1 inline-flex min-h-9 items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={item.published} onChange={(e) => update(index, { published: e.target.checked })} className="size-4" />
                  Show
                </label>
                <Small label="Move up" onClick={() => move(index, index - 1)} disabled={index === 0}>↑</Small>
                <Small label="Move down" onClick={() => move(index, index + 1)} disabled={index === items.length - 1}>↓</Small>
                <Small label="Remove" onClick={() => confirm("Remove this banner?") && setItems((list) => list.filter((_, i) => i !== index))}>
                  <span className="text-[#c2410c]">✕</span>
                </Small>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:left-[240px]">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="text-sm text-mist" aria-live="polite">
            {error ? <span className="text-[#c2410c]">{error}</span> : dirty ? "Unsaved changes" : savedAt ? `Saved at ${savedAt}` : "All saved"}
          </span>
          <button type="button" onClick={save} disabled={saving || !dirty} className="ml-auto min-h-10 rounded-full bg-ink px-5 text-sm text-cream disabled:opacity-50">
            {saving ? "Saving…" : "Save banners"}
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
