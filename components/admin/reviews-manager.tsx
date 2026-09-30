"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import { Field, inputClass } from "./fields";

const empty: Omit<Review, "id"> = { name: "", trip: "", quote: "", rating: 5, published: true };

export function ReviewsManager({ initial }: { initial: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(editing ? `/api/reviews/${editing}` : "/api/reviews", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; items?: Review[] } | null;
    if (!response.ok || !data?.items) {
      setError(data?.error || "Could not save the review.");
      return;
    }
    setReviews(data.items);
    setDraft(empty);
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    const response = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { items: Review[] };
    setReviews(data.items);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-3">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-3xl border border-line bg-cream p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{review.name}</p>
                <p className="text-sm text-mist">{review.trip} · {review.rating}/5 · {review.published ? "Live" : "Hidden"}</p>
                <p className="mt-2 text-sm leading-6">{review.quote}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-sm">
                <button type="button" className="text-pine" onClick={() => { setEditing(review.id); setDraft(review); }}>Edit</button>
                <button type="button" className="text-[#f94f18]" onClick={() => remove(review.id)}>Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={save} className="h-fit space-y-3 rounded-3xl border border-line bg-cream p-5">
        <p className="font-serif text-2xl">{editing ? "Edit review" : "New review"}</p>
        <Field label="Name"><input className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></Field>
        <Field label="Trip"><input className={inputClass} value={draft.trip} onChange={(event) => setDraft({ ...draft, trip: event.target.value })} required /></Field>
        <Field label="Quote"><textarea className={inputClass} rows={4} value={draft.quote} onChange={(event) => setDraft({ ...draft, quote: event.target.value })} required /></Field>
        <Field label="Rating">
          <input className={inputClass} type="number" min={1} max={5} value={draft.rating} onChange={(event) => setDraft({ ...draft, rating: Number(event.target.value) })} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Published
        </label>
        {error ? <p className="text-sm text-[#f94f18]">{error}</p> : null}
        <button type="submit" className="w-full rounded-full bg-ink py-3 text-sm text-cream">Save review</button>
      </form>
    </div>
  );
}
