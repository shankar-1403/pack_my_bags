import Image from "next/image";
import Link from "next/link";
import { DepartureBoard } from "@/components/departure-board";
import { FaqList } from "@/components/faq-list";
import { Frame } from "@/components/frame";
import { HomeBanner } from "@/components/home-banner";
import { TrolleyIntro } from "@/components/intro/trolley-intro";
import { JournalStrip } from "@/components/journal-strip";
import { PlacesGrid } from "@/components/places-grid";
import { RoadNotes } from "@/components/road-notes";
import { getFaqs, getPosts, getReviews, publishedTrips } from "@/lib/content";

const reasons = [
  {
    title: "Solo is a normal way to arrive",
    copy: "Most seats are booked by people travelling alone. The captain makes the introductions, and you are never left to find the hotel on your own.",
  },
  {
    title: "Stays we have slept in",
    copy: "Homestays, houseboats, and city hotels are picked for heat, water, and a quiet night — then checked again before the next departure.",
  },
  {
    title: "Captains, not megaphones",
    copy: "The person on the trip is a host. They handle permits, pace, and the moment someone needs the day to slow down.",
  },
  {
    title: "The price is the price",
    copy: "Breakfast, the vehicle, and the captain sit inside the number. Flights and lunches are named on the trip, not discovered at checkout.",
  },
];

export default function HomePage() {
  const trips = publishedTrips();
  const featured = trips.filter((trip) => trip.featured).slice(0, 3);
  const spotlight = featured[0] ?? trips[0];
  const side = featured.slice(1);
  const posts = getPosts().filter((post) => post.published).slice(0, 3);
  const reviews = getReviews().filter((review) => review.published).slice(0, 3);
  const faqs = getFaqs().slice(0, 4);
  const lowest = trips.reduce((min, trip) => Math.min(min, trip.price), trips[0]?.price ?? 0);

  const destinations = [...trips.reduce((map, trip) => {
    const current = map.get(trip.destination);
    if (current) current.count += 1;
    else map.set(trip.destination, { name: trip.destination, region: trip.region, image: trip.image, count: 1 });
    return map;
  }, new Map<string, { name: string; region: string; image: string; count: number }>()).values()].slice(0, 6);

  return (
    <div>
      <TrolleyIntro>
        <HomeBanner
          routeCount={trips.length}
          startsFrom={lowest}
          spotlight={spotlight}
          companions={side}
          fill
        />
      </TrolleyIntro>

      <Frame className="py-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">The board</p>
            <h2 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">Departures with seats open</h2>
          </div>
          <Link href="/trips" className="hidden min-h-10 shrink-0 items-center whitespace-nowrap text-sm text-pine sm:inline-flex">See the full calendar</Link>
        </div>
        <DepartureBoard trips={trips.slice(0, 6)} />
      </Frame>

      <section className="bg-pine text-cream">
        <Frame className="py-8 sm:py-10">
          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-[minmax(0,0.85fr)_repeat(4,minmax(0,1fr))] xl:gap-0">
            <h2 className="max-w-xs font-serif text-3xl leading-[0.95] tracking-tight sm:col-span-2 sm:text-4xl xl:col-span-1 xl:pr-6">
              A group trip should feel chosen.
            </h2>
            {reasons.map((reason, index) => (
              <div key={reason.title} className="border-white/15 xl:border-l xl:px-5">
                <p className="font-header text-[11px] font-semibold tracking-[0.18em] text-[#f94f18]">0{index + 1}</p>
                <h3 className="mt-2 font-header text-base font-semibold leading-snug">{reason.title}</h3>
                <p className="mt-2 text-sm leading-6 text-cream/70">{reason.copy}</p>
              </div>
            ))}
          </div>
        </Frame>
      </section>

      <Frame className="py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">Places</p>
        <h2 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">Where the next groups are going</h2>
        <PlacesGrid places={destinations} />
      </Frame>

      <Frame className="pb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">From the road</p>
        <h2 className="mt-2 max-w-xl font-serif text-4xl tracking-tight sm:text-5xl">Notes sent after the drop.</h2>
        <RoadNotes reviews={reviews} />
      </Frame>

      <Frame className="py-16">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">Journal</h2>
          <Link href="/blog" className="inline-flex min-h-10 items-center font-header text-sm font-medium text-pine">All stories</Link>
        </div>
        <JournalStrip posts={posts} />
      </Frame>

      <Frame className="pb-8">
        <div id="questions" className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.8fr)] lg:gap-10">
          <div>
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">Questions, answered plainly</h2>
            <div className="mt-6">
              <FaqList faqs={faqs} />
            </div>
          </div>
          <div className="relative h-72 overflow-hidden rounded-[28px] lg:h-full lg:min-h-80">
            <Image
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80"
              alt=""
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Frame>
    </div>
  );
}
