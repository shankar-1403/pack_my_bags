"use client";

import { useState } from "react";
import type { Faq } from "@/lib/types";

export function FaqList({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState(faqs[0]?.id ?? "");

  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((faq) => {
        const expanded = open === faq.id;
        return (
          <div key={faq.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? "" : faq.id)}
            >
              <span className="font-serif text-2xl leading-tight">{faq.question}</span>
              <span className="text-clay">{expanded ? "–" : "+"}</span>
            </button>
            {expanded ? <p className="max-w-3xl pb-5 text-sm leading-7 text-ink/75">{faq.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
