import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/booking-panel";
import { FaqList } from "@/components/faq-list";
import { Frame } from "@/components/frame";
import { TripCard } from "@/components/trip-card";
import { publishedTrips } from "@/lib/content";
import { difficultyLabel, durationLabel, typeLabel } from "@/lib/format";

type Context = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const trip = (await publishedTrips()).find((item) => item.slug === slug);
  if (!trip) return { title: "Trip" };
  const image = trip.ogImage || trip.image;
  return {
    title: trip.seoTitle || trip.title,
    description: trip.seoDescription || trip.summary,
    openGraph: { title: trip.seoTitle || trip.title, description: trip.seoDescription || trip.summary, images: [{ url: image }] },
  };
}

export default async function TripPage({ params }: Context) {
  const { slug } = await params;
  const trips = await publishedTrips();
  const trip = trips.find((item) => item.slug === slug);
  if (!trip) notFound();

  const related = trips
    .filter((item) => item.id !== trip.id && (item.destination === trip.destination || item.types.some((type) => trip.types.includes(type))))
    .slice(0, 3);
  const gallery = trip.gallery.length > 0 ? trip.gallery : [trip.image];
  const range = (a?: number, b?: number, unit = "") => (a && b ? `${a}–${b}${unit}` : a ? `${a}+${unit}` : b ? `Up to ${b}${unit}` : "");
  const facts = (
    [
      ["Difficulty", difficultyLabel(trip.difficulty)],
      ["Group size", range(trip.groupMin, trip.groupMax, " people")],
      ["Ages", range(trip.ageMin, trip.ageMax)],
      ["Starts", trip.startCity],
      ["Ends", trip.endCity],
      ["Best season", trip.bestSeason],
      ["Highest point", trip.maxAltitude],
      ["Pickup", trip.pickup],
    ] as [string, string | undefined][]
  ).filter((fact): fact is [string, string] => Boolean(fact[1]));

  return (
    <article>
      <header className="relative min-h-[78vh]">
        <Image src={trip.image} alt={trip.imageAlt || trip.title} fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/35 to-pine/20" />
        <div className="absolute inset-x-0 bottom-0 pb-12 text-cream">
          <Frame>
          <p className="text-xs uppercase tracking-[0.22em] text-cream/70">{trip.region}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight sm:text-7xl">{trip.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-cream/80">{trip.tagline || trip.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
            {trip.types.map((type) => (
              <span key={type} className="rounded-full border border-white/30 px-3 py-1">{typeLabel(type)}</span>
            ))}
            <span className="rounded-full border border-white/30 px-3 py-1">{durationLabel(trip.days, trip.nights)}</span>
            {trip.badge ? <span className="rounded-full bg-[#f94f18] px-3 py-1 text-white">{trip.badge}</span> : null}
          </div>
          </Frame>
        </div>
      </header>

      <Frame className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {facts.length > 0 ? (
            <dl className="mb-10 flex flex-wrap gap-px overflow-hidden rounded-[24px] border border-line bg-line">
              {facts.map(([label, value]) => (
                <div key={label} className="min-w-[45%] flex-1 bg-cream px-4 py-3 sm:min-w-[30%]">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">{label}</dt>
                  <dd className="mt-1 text-sm font-medium sm:text-base">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="max-w-3xl whitespace-pre-line text-lg leading-8 text-ink/80">{trip.description}</p>

          {gallery.length > 1 ? (
            <div className="mt-8 grid grid-cols-3 gap-3">
              {gallery.slice(0, 3).map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                  <Image src={src} alt="" fill className="object-cover" sizes="30vw" />
                </div>
              ))}
            </div>
          ) : null}

          <section className="mt-12">
            <h2 className="font-serif text-4xl">Highlights</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {trip.highlights.map((item) => (
                <li key={item} className="rounded-3xl border border-line bg-cream px-4 py-4 text-sm leading-6 sm:text-base">{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-4xl">How the days go</h2>
            <ol className="mt-6 space-y-5">
              {trip.itinerary.map((day) => (
                <li key={day.day} className="grid gap-2 border-t border-line pt-5 sm:grid-cols-[88px_1fr]">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#f94f18]">Day {day.day}</p>
                  <div>
                    <h3 className="font-serif text-2xl">{day.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-ink/75 sm:text-base">{day.description}</p>
                    {day.meals || day.stay ? (
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist">
                        {day.meals ? <span>Meals · {day.meals}</span> : null}
                        {day.stay ? <span>Stay · {day.stay}</span> : null}
                      </p>
                    ) : null}
                    {day.image ? (
                      <div className="relative mt-4 aspect-[16/9] max-w-xl overflow-hidden rounded-3xl">
                        <Image src={day.image} alt="" fill className="object-cover" sizes="(min-width: 1024px) 560px, 100vw" />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl">Included</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 sm:text-base sm:leading-7">
                {trip.inclusions.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-3xl">Not included</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/75 sm:text-base sm:leading-7">
                {trip.exclusions.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </div>
          </section>

          {trip.thingsToCarry?.length ? (
            <section className="mt-12">
              <h2 className="font-serif text-3xl">What to pack</h2>
              <ul className="mt-4 grid gap-2 text-sm leading-6 sm:grid-cols-2 sm:text-base sm:leading-7">
                {trip.thingsToCarry.map((item) => <li key={item}>· {item}</li>)}
              </ul>
            </section>
          ) : null}

          {trip.faqs?.length ? (
            <section className="mt-12">
              <h2 className="font-serif text-3xl">Questions about this trip</h2>
              <div className="mt-4">
                <FaqList faqs={trip.faqs} firstOpen={false} />
              </div>
            </section>
          ) : null}

          {trip.cancellationPolicy ? (
            <section className="mt-12">
              <h2 className="font-serif text-3xl">Cancellation policy</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-7 text-ink/75 sm:text-base">{trip.cancellationPolicy}</p>
            </section>
          ) : null}
        </div>
        <BookingPanel trip={trip} />
      </Frame>

      {related.length > 0 ? (
        <Frame className="pb-8">
          <h2 className="font-serif text-4xl">You might also look at</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {related.map((item) => <TripCard key={item.id} trip={item} />)}
          </div>
          <Link href="/trips" className="mt-6 inline-flex min-h-10 items-center text-sm text-pine">Back to all trips</Link>
        </Frame>
      ) : null}
    </article>
  );
}
