"use client";

import { useState } from "react";
import type { Faq } from "@/lib/types";
import { Field, inputClass } from "./fields";

const empty = { question: "", answer: "" };

export function FaqsManager({ initial }: { initial: Faq[] }) {
  const [faqs, setFaqs] = useState(initial);
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(editing ? `/api/faqs/${editing}` : "/api/faqs", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; items?: Faq[] } | null;
    if (!response.ok || !data?.items) {
      setError(data?.error || "Could not save the question.");
      return;
    }
    setFaqs(data.items);
    setDraft(empty);
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this question?")) return;
    const response = await fetch(`/api/faqs/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { items: Faq[] };
    setFaqs(data.items);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-3">
        {faqs.map((faq) => (
          <li key={faq.id} className="rounded-3xl border border-line bg-cream p-5">
            <p className="font-medium">{faq.question}</p>
            <p className="mt-2 text-sm leading-6 text-ink/75">{faq.answer}</p>
            <div className="mt-3 flex gap-3 text-sm">
              <button type="button" className="text-pine" onClick={() => { setEditing(faq.id); setDraft(faq); }}>Edit</button>
              <button type="button" className="text-clay" onClick={() => remove(faq.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={save} className="h-fit space-y-3 rounded-3xl border border-line bg-cream p-5">
        <p className="font-serif text-2xl">{editing ? "Edit question" : "New question"}</p>
        <Field label="Question"><input className={inputClass} value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} required /></Field>
        <Field label="Answer"><textarea className={inputClass} rows={5} value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} required /></Field>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <button type="submit" className="w-full rounded-full bg-ink py-3 text-sm text-cream">Save</button>
      </form>
    </div>
  );
}
