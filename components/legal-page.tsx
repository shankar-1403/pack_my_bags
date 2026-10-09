import Link from "next/link";
import { Frame } from "./frame";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** A long legal document: title block, a contents list that stays in view on desktop, numbered sections. */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
  related,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  related: { href: string; label: string };
}) {
  return (
    <Frame className="py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="font-header text-xs font-semibold uppercase tracking-[0.24em] text-[#f94f18]">{eyebrow}</p>
        <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-4 font-header text-sm text-mist">Last updated {updated}</p>
        <div className="mt-6 text-lg leading-8 text-ink/75">{intro}</div>
      </header>

      <div className="mt-12 grid gap-10 border-t border-line pt-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-36 lg:self-start">
          <p className="font-header text-[11px] font-semibold uppercase tracking-[0.2em] text-mist">On this page</p>
          <ol className="mt-3 grid gap-0.5 text-sm sm:grid-cols-2 lg:grid-cols-1">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="flex min-h-11 items-center gap-2 rounded-lg py-1.5 text-ink/70 lg:min-h-9 lg:items-baseline transition hover:text-ink">
                  <span className="w-5 shrink-0 font-header text-xs tabular-nums text-[#f94f18]">{index + 1}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
          <Link href={related.href} className="mt-6 inline-flex min-h-10 items-center text-sm text-pine underline-offset-4 hover:underline">
            {related.label} →
          </Link>
        </nav>

        <div className="max-w-3xl">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-36 border-b border-line pb-10 pt-2 [&:not(:first-child)]:pt-10 last:border-b-0">
              <h2 className="flex items-baseline gap-3 font-serif text-3xl leading-tight tracking-tight sm:text-[2rem]">
                <span className="font-header text-sm font-semibold tabular-nums text-[#f94f18]">{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              <div className="legal-body mt-4 text-base leading-8 text-ink/80">{section.body}</div>
            </section>
          ))}
        </div>
      </div>
    </Frame>
  );
}
