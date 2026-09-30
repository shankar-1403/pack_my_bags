import type { Metadata } from "next";
import { DestinationAtlas } from "@/components/destination-atlas";
import { Frame } from "@/components/frame";
import { publishedTrips } from "@/lib/content";

export const metadata: Metadata = { title: "Destinations" };

export default function DestinationsPage() {
  const places = [...publishedTrips().reduce((map, trip) => {
    const current = map.get(trip.destination);
    if (current) current.trips.push(trip.title);
    else map.set(trip.destination, { name: trip.destination, region: trip.region, image: trip.image, trips: [trip.title] });
    return map;
  }, new Map<string, { name: string; region: string; image: string; trips: string[] }>()).values()];

  return (
    <Frame className="py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">Atlas</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Destinations</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
        Each place is a set of dated departures, not an open-ended package. Pick a landscape, then pick a date.
      </p>
      <DestinationAtlas places={places} />
    </Frame>
  );
}
