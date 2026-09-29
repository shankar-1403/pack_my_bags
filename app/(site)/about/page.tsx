import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Frame } from "@/components/frame";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = { title: "About" };

const beliefs = [
  {
    title: "The briefer is the captain",
    copy: "Hotels are visited. Vehicles are named. The person who walked you through the date is the person on the ground, not a handover at the airport curb.",
  },
  {
    title: "Small enough to change the plan",
    copy: "Groups stay small enough to turn around when the pass closes, or to give someone a slower morning without holding up a coach.",
  },
  {
    title: "The price is readable",
    copy: "Prices are written so you can compare them without a footnote hunt. If a date is wrong for you, we say so before you pay.",
  },
];

const steps = [
  "Choose a departure and send a note with your date.",
  "We confirm seats, rooming, and what the price leaves out.",
  "An advance holds the seat. The rest is due before departure.",
  "You meet the captain on the trip, not a different team at the curb.",
];

export default function AboutPage() {
  const settings = getSettings();

  return (
    <div className="pb-8">
      <Frame className="pt-12">
        <p className="font-header text-xs font-semibold uppercase tracking-[0.22em] text-clay">The studio · Mumbai</p>
        <h1 className="mt-3 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          Pack my bags plans the trip so the group can be in it.
        </h1>
      </Frame>

      <div className="mt-10 px-3 sm:px-5">
        <div className="relative mx-auto max-w-7xl">
          <div className="relative h-[340px] overflow-hidden rounded-[32px] sm:h-[460px]">
            <Image
              src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2000&q=80"
              alt="A small group walking a mountain trail"
              fill
              priority
              sizes="(min-width: 1280px) 80rem, 100vw"
              className="object-cover object-[center_40%]"
            />
          </div>
          <div className="relative z-10 -mt-16 max-w-xl rounded-[28px] border border-line bg-cream p-6 shadow-[0_18px_40px_-28px_rgba(23,20,15,0.45)] sm:-mt-28 sm:ml-8 sm:p-8 lg:ml-12">
            <p className="text-lg leading-8 text-ink/80">
              We run dated group departures from India: Himalayan circuits, a handful of international weeks, weekend treks, and the occasional supported bike loop. The work is unglamorous on purpose.
            </p>
            <p className="mt-4 font-header text-sm text-mist">{settings.address}</p>
          </div>
        </div>
      </div>

      <Frame className="py-20">
        <p className="font-header text-xs font-semibold uppercase tracking-[0.22em] text-clay">How the desk works</p>
        <div className="mt-8 border-t border-line">
          {beliefs.map((belief, index) => (
            <div key={belief.title} className="grid gap-3 border-b border-line py-8 sm:grid-cols-[5rem_minmax(0,0.8fr)_minmax(0,1.1fr)] sm:items-baseline sm:gap-8">
              <p className="font-serif text-3xl text-clay">0{index + 1}</p>
              <h2 className="font-serif text-3xl leading-none tracking-tight sm:text-4xl">{belief.title}</h2>
              <p className="text-sm leading-7 text-ink/75 sm:text-base">{belief.copy}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-sm leading-7 text-ink/70">
          The public site is edited from the Mumbai studio — trips, stories, reviews, and the questions people actually ask. Nothing on the calendar is a placeholder.
        </p>
      </Frame>

      <Frame>
        <div className="rounded-[32px] bg-pine px-6 py-10 text-cream sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-md font-serif text-4xl leading-none tracking-tight">How a booking works</h2>
            <Link href="/contact" className="inline-flex rounded-full bg-cream px-5 py-3 font-header text-sm font-medium text-ink">
              Talk to the desk
            </Link>
          </div>
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step} className="relative">
                {index < steps.length - 1 ? (
                  <span className="absolute top-5 left-10 hidden h-px w-[calc(100%-1rem)] bg-cream/25 md:block" />
                ) : null}
                <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[#d4652f] font-header text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm leading-6 text-cream/80">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </Frame>
    </div>
  );
}
