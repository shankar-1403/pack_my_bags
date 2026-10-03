"use client";

import { useState } from "react";

type Item = { id?: string; question: string; answer: string };

/** One answer open at a time; it slides open and the plus turns into a cross. */
export function FaqList({ faqs, firstOpen = true }: { faqs: Item[]; firstOpen?: boolean }) {
  const [open, setOpen] = useState(firstOpen && faqs.length ? 0 : -1);

  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((faq, index) => {
        const expanded = open === index;
        const id = `faq-${faq.id ?? index}`;
        return (
          <div key={faq.id ?? index}>
            <button
              type="button"
              id={`${id}-q`}
              className="group flex min-h-14 w-full items-center justify-between gap-6 py-5 text-left"
              aria-expanded={expanded}
              aria-controls={id}
              onClick={() => setOpen(expanded ? -1 : index)}
            >
              <span className={`font-serif text-2xl leading-tight transition-colors duration-300 ${expanded ? "text-ink" : "text-ink/85 group-hover:text-ink"}`}>
                {faq.question}
              </span>
              <span
                aria-hidden
                className={`grid size-9 shrink-0 place-items-center rounded-full text-xl leading-none transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  expanded ? "rotate-45 bg-[#f94f18] text-white" : "bg-[#f94f18]/10 text-[#f94f18] group-hover:bg-[#f94f18]/20"
                }`}
              >
                +
              </span>
            </button>
            <div
              id={id}
              role="region"
              aria-labelledby={`${id}-q`}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p
                  className={`max-w-3xl whitespace-pre-line pb-6 pr-12 text-sm leading-7 text-ink/75 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:text-base ${
                    expanded ? "translate-y-0" : "-translate-y-2"
                  }`}
                >
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
