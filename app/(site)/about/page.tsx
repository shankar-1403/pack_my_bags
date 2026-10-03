import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eye, Target } from "lucide-react";
import { Frame } from "@/components/frame";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "PackMyBags plans domestic and international trips from start to finish: flights, hotels, visas, itinerary and every small detail.",
};

const promises = [
  {
    title: "Designed, not templated",
    copy: "We shape each journey around your dates, your pace and your budget, so no two trips look the same.",
  },
  {
    title: "Service that stays with you",
    copy: "One team before you book, while you travel and after you return. Real people, easy to reach.",
  },
  {
    title: "Value you can see",
    copy: "Good deals on packages, flights and hotels, with clear pricing so you know exactly what you are paying for.",
  },
];

const services = ["Holiday Packages", "Flights", "Hotels", "Cruises", "All Types of Visas"];
const tripKinds = ["Pilgrimage", "Honeymoon", "Family Trips", "Escapes", "Domestic", "International"];

const eyebrow = "font-header text-xs font-semibold uppercase tracking-[0.24em] text-[#f94f18]";

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div className="pb-8">
      {/* Hero: the promise, and the route it takes. */}
      <Frame className="pt-12 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
          <div>
            <p className={eyebrow}>About PackMyBags</p>
            <h1 className="mt-5 font-serif text-5xl leading-[0.95] tracking-tight [text-wrap:balance] sm:text-6xl xl:text-7xl">
              Leave the rest to us.{" "}
              <span className="italic text-[#f94f18] sm:block">You just pack your bags.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-ink/80 sm:text-xl sm:leading-9">
              PackMyBags is a travel company planning domestic and international trips from start to finish. Tell us where you want to go. Flights, hotels, visas, itinerary and every small detail are ours to handle.
            </p>
          </div>
          <Route />
        </div>
      </Frame>

      <div className="mt-12 px-3 sm:px-5">
        <div className="relative mx-auto h-[300px] max-w-7xl overflow-hidden rounded-[32px] sm:h-[440px]">
          <Image
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2000&q=80"
            alt="Two travellers walking a mountain trail with packs"
            fill
            priority
            sizes="(min-width: 1280px) 80rem, 100vw"
            className="object-cover object-[center_40%]"
          />
        </div>
      </div>

      {/* Who we are */}
      <Frame className="py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <p className={eyebrow}>Who we are</p>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-tight [text-wrap:balance] sm:text-5xl">
              Domestic or international, we handle the journey.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-8 text-ink/75 sm:text-lg sm:leading-9">
            <p className="font-serif text-2xl leading-snug text-ink sm:text-[1.75rem]">
              We started PackMyBags because a good trip is more than a booking. It is the right destination, the right hotel, the right flight, the right paperwork and someone to call when plans change. So we take all of that off your plate.
            </p>
            <p>
              Whether it is a pilgrimage, a honeymoon, a family holiday or a quick escape, at home or abroad, the way we work is the same: we plan it, book it and look after it.
            </p>
            <p>
              Every itinerary is built for the person travelling, not copied from a brochure. You pack your bags. We stay with you from the first enquiry to the day you are home.
            </p>
          </div>
        </div>
      </Frame>

      {/* Mission & Vision: two halves of one boarding pass. */}
      <Frame>
        <div className="text-center">
          <p className={eyebrow}>Our purpose</p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">Mission &amp; Vision</h2>
        </div>
        <div className="relative mt-10 grid overflow-hidden rounded-[32px] text-cream md:grid-cols-2">
          <article className="relative bg-pine px-7 pb-10 pt-9 sm:px-10 sm:pb-12 sm:pt-11">
            <p className="flex items-center gap-3 font-header text-xs font-semibold uppercase tracking-[0.24em] text-[#f94f18]">
              <Target aria-hidden className="size-6" strokeWidth={1.5} />
              Our Mission
            </p>
            <h3 className="mt-6 font-serif text-3xl leading-[1.05] tracking-tight sm:text-4xl">To make travel effortless.</h3>
            <p className="mt-4 max-w-md text-base leading-7 text-cream/85">
              We design thoughtful domestic and international trips and handle every detail, from flights, hotels and visas to the itinerary itself, so our travellers can simply pack their bags and enjoy the journey.
            </p>
          </article>
          <article className="relative bg-[#f94f18] px-7 pb-10 pt-9 sm:px-10 sm:pb-12 sm:pt-11">
            <Perforation />
            <p className="flex items-center gap-3 font-header text-xs font-semibold uppercase tracking-[0.24em] text-white">
              <Eye aria-hidden className="size-6" strokeWidth={1.5} />
              Our Vision
            </p>
            <h3 className="mt-6 font-serif text-3xl leading-[1.05] tracking-tight text-white sm:text-4xl">To be the travel company people trust first.</h3>
            <p className="mt-4 max-w-md text-base leading-7 text-white/90">
              For every journey, near or far, we want to be known for trips designed around the traveller, service that stays with them throughout, and value they can see.
            </p>
          </article>
        </div>
      </Frame>

      {/* Three promises */}
      <Frame className="py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className={eyebrow}>How we work</p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-tight sm:text-5xl">Three promises behind every trip</h2>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-3">
          {promises.map((promise) => (
            <div key={promise.title} className="bg-cream p-7 sm:p-8">
              <span aria-hidden className="block h-0.5 w-10 bg-[#f94f18]" />
              <h3 className="mt-6 font-serif text-2xl leading-tight tracking-tight sm:text-[1.7rem]">{promise.title}</h3>
              <p className="mt-3 text-base leading-7 text-ink/75">{promise.copy}</p>
            </div>
          ))}
        </div>
      </Frame>

      {/* What we do */}
      <section className="bg-pine text-cream">
        <Frame className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <div>
            <p className={eyebrow}>What we do</p>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] tracking-tight sm:text-5xl">One partner for the whole journey</h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-cream/80 sm:text-lg">
              Skip juggling five different websites and agents. Packages, flights, hotels, cruises and visas are all handled under one roof.
            </p>
          </div>
          <div className="space-y-3">
            <ul className="flex flex-wrap gap-2.5">
              {services.map((item, index) => (
                <li
                  key={item}
                  className={`rounded-full px-5 py-2.5 font-header text-sm font-medium sm:text-base ${index === 0 ? "bg-[#f94f18] font-semibold text-white" : "ring-1 ring-cream/35"}`}
                >
                  {item}
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-2.5">
              {tripKinds.map((item) => (
                <li key={item} className="rounded-full bg-cream/10 px-5 py-2.5 font-header text-sm text-cream/90 sm:text-base">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Frame>
      </section>

      {/* Call to plan */}
      <Frame className="py-20 text-center sm:py-28">
        <p className={eyebrow}>Let&apos;s plan it</p>
        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-5xl leading-[0.98] tracking-tight [text-wrap:balance] sm:text-6xl">
          Tell us where you want to go.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-ink/75">
          Share your dates and ideas and we will come back with a plan that fits. No pressure, no jargon.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#f94f18] px-7 font-header text-base font-semibold text-white transition hover:bg-[#b85324]"
        >
          Plan my trip
        </Link>
        <div className="mx-auto mt-10 max-w-xl border-t border-line pt-6 text-sm leading-7 text-ink/70 sm:text-base">
          <p>
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-ink">{settings.phone}</a>
            <span aria-hidden className="mx-2 text-mist">·</span>
            <a href={`mailto:${settings.email}`} className="hover:text-ink">{settings.email}</a>
          </p>
          <p className="mt-1">{settings.address}</p>
        </div>
      </Frame>
    </div>
  );
}

// The hero's flight path, in a 560 × 200 box: one arc from the first enquiry to wherever you are going.
const ARC = { p0: [18, 168], p1: [150, 6], p2: [410, 6], p3: [542, 150] } as const;
const ARC_PATH = `M${ARC.p0} C${ARC.p1} ${ARC.p2} ${ARC.p3}`;
const FLIGHT = 2.8;
const stops = [
  { label: "Flights", t: 0.2 },
  { label: "Hotels", t: 0.4 },
  { label: "Visas", t: 0.6 },
  { label: "Itinerary", t: 0.8 },
];

function onArc(t: number) {
  const u = 1 - t;
  const [a, b, c, d] = [ARC.p0, ARC.p1, ARC.p2, ARC.p3];
  const at = (i: 0 | 1) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
  return { x: at(0), y: at(1) };
}

/**
 * A boarding-pass card: the plane flies the arc once, and each thing we take off your plate lights up as
 * it passes. Without motion, the trip is shown already flown.
 */
function Route() {
  const end = onArc(1);
  const pct = (x: number, y: number) => ({ left: `${(x / 560) * 100}%`, top: `${(y / 200) * 100}%` });
  return (
    <div aria-hidden className="relative overflow-hidden rounded-[28px] border border-line bg-cream p-5 shadow-[0_24px_50px_-36px_rgba(23,20,15,0.45)] sm:p-6">
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{ backgroundImage: "radial-gradient(#d9cfbf 1px, transparent 1px)", backgroundSize: "14px 14px" }}
      />
      <div className="relative flex items-start justify-between gap-6 font-header">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist">From</p>
          <p className="mt-1 font-serif text-xl leading-tight sm:text-2xl">First enquiry</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist">To</p>
          <p className="mt-1 font-serif text-xl leading-tight text-[#f94f18] sm:text-2xl">Wherever you want to go</p>
        </div>
      </div>

      <div className="relative mt-4 aspect-[560/200]">
        <svg viewBox="0 0 560 200" className="absolute inset-0 size-full overflow-visible" fill="none">
          <defs>
            <mask id="route-trail" maskUnits="userSpaceOnUse">
              <path
                d={ARC_PATH}
                pathLength={1}
                stroke="#fff"
                strokeWidth="12"
                strokeDasharray="1"
                className="motion-safe:animate-[route-trail_2.8s_cubic-bezier(0.45,0,0.2,1)_both]"
              />
            </mask>
          </defs>
          <path d={ARC_PATH} stroke="#e0d6c8" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
          <path d={ARC_PATH} mask="url(#route-trail)" stroke="#f94f18" strokeWidth="2" strokeDasharray="7 7" strokeLinecap="round" />
          <circle cx={ARC.p0[0]} cy={ARC.p0[1]} r="11" fill="#f94f18" fillOpacity="0.15" />
          <circle cx={ARC.p0[0]} cy={ARC.p0[1]} r="5" fill="#f94f18" />
          {stops.map(({ label, t }, i) => {
            const { x, y } = onArc(t);
            return (
              <circle
                key={label}
                cx={x}
                cy={y}
                r="5"
                fill="#fbf8f3"
                stroke="#f94f18"
                strokeWidth="2"
                className="motion-safe:animate-[route-stop_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
                style={{ animationDelay: `${FLIGHT * (0.12 + i * 0.2)}s`, transformBox: "fill-box", transformOrigin: "center" }}
              />
            );
          })}
          {/* In flight… */}
          <g className="motion-reduce:hidden">
            <path d={PLANE} fill="#f94f18">
              <animateMotion dur={`${FLIGHT}s`} begin="0s" fill="freeze" rotate="auto" path={ARC_PATH} calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1" />
            </path>
          </g>
          {/* …or already landed. */}
          <path d={PLANE} fill="#f94f18" className="hidden motion-reduce:block" transform={`translate(${end.x} ${end.y}) rotate(46)`} />
        </svg>

        {stops.map(({ label, t }, i) => {
          const { x, y } = onArc(t);
          // Alternate above and below the line so neighbours never collide; the last one leans left of the edge.
          const place = `${i % 2 ? "translate-y-[55%]" : "-translate-y-[155%]"} ${i === stops.length - 1 ? "-translate-x-[78%]" : "-translate-x-1/2"}`;
          return (
            <span
              key={label}
              className={`absolute ${place} whitespace-nowrap rounded-full bg-paper px-2.5 py-1 font-header text-[10px] font-semibold uppercase tracking-[0.14em] text-ink ring-1 ring-line motion-safe:animate-[route-label_0.6s_cubic-bezier(0.22,1,0.36,1)_both] sm:text-[11px]`}
              style={{ ...pct(x, y), animationDelay: `${FLIGHT * (0.12 + i * 0.2)}s` }}
            >
              {label}
            </span>
          );
        })}
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t-2 border-dashed border-line pt-4 font-header text-[11px] font-semibold uppercase tracking-[0.22em] text-mist">
        <span>Domestic · International</span>
        <span className="text-ink">PackMyBags</span>
      </div>
    </div>
  );
}

/** A small plane pointing along +x, centred on the origin, for animateMotion. */
const PLANE =
  "M12 0c0-1.3-1.6-2.2-3.2-2.2H3.4L-3.2-11h-3.3l3.9 8.8h-5.2l-2.7-3.4h-2.2L-10.9 0l-1.6 5.6h2.2l2.7-3.4h5.2L-6.5 11h3.3l6.6-8.8h5.4C10.4 2.2 12 1.3 12 0Z";

/** The boarding-pass tear along the Vision half's inner edge: a dashed rule with a notch punched at each end. */
function Perforation() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute inset-x-6 top-0 border-t-2 border-dashed border-paper/80 md:inset-x-auto md:inset-y-6 md:left-0 md:border-l-2 md:border-t-0" />
      <span className="absolute left-0 top-0 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
      <span className="absolute right-0 top-0 size-8 translate-x-1/2 -translate-y-1/2 rounded-full bg-paper md:bottom-0 md:left-0 md:right-auto md:top-auto md:-translate-x-1/2 md:translate-y-1/2" />
    </div>
  );
}
