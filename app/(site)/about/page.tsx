import type { Metadata } from "next";
import Link from "next/link";
import { Frame } from "@/components/frame";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Frame className="py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-clay">The studio</p>
      <h1 className="mt-3 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight sm:text-7xl">
        Pack my bags plans the trip so the group can be in it.
      </h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 text-lg leading-8 text-ink/80">
          <p>
            We run dated group departures from India: Himalayan circuits, a handful of international weeks, weekend treks, and the occasional supported bike loop. The work is unglamorous on purpose. Hotels are visited. Vehicles are named. The person who briefed you is the person on the ground.
          </p>
          <p>
            Groups stay small enough to change a plan when the pass closes or someone needs a slower morning. Prices are written so you can compare them without a footnote hunt. If a date is wrong for you, we say so before you pay.
          </p>
          <p>
            The public site is edited from our own studio — trips, stories, reviews, and the questions people actually ask. Nothing on the calendar is a placeholder.
          </p>
        </div>
        <aside className="rounded-[32px] bg-pine p-8 text-cream">
          <p className="font-serif text-4xl leading-none">How a booking works</p>
          <ol className="mt-6 space-y-4 text-sm leading-6 text-cream/80">
            <li>1. Choose a departure and send a note with your date.</li>
            <li>2. We confirm seats, rooming, and what the price leaves out.</li>
            <li>3. An advance holds the seat. The rest is due before departure.</li>
            <li>4. You meet the captain, not a handover at the airport curb.</li>
          </ol>
          <Link href="/contact" className="mt-8 inline-flex rounded-full bg-cream px-5 py-3 text-sm text-ink">
            Talk to the desk
          </Link>
        </aside>
      </div>
    </Frame>
  );
}
