import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { TripExplorer } from "@/components/trip-explorer";
import { publishedTrips } from "@/lib/content";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Browse Pack my bags group departures by destination, style, and budget.",
};

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; destination?: string; q?: string }>;
}) {
  const params = await searchParams;
  const trips = await publishedTrips();

  return (
    <Frame className="py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">The calendar</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
        Explore destinations
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
        Domestic loops, a few international weeks, weekend treks, and supported bike rides. Filter until the date fits your life.
      </p>
      <div className="mt-8">
        <TripExplorer
          trips={trips}
          initialType={params.type ?? ""}
          initialDestination={params.destination ?? ""}
          initialQuery={params.q ?? ""}
        />
      </div>
    </Frame>
  );
}
