import Link from "next/link";
import { getTrips } from "@/lib/content";
import { formatInr } from "@/lib/format";

export default function AdminTripsPage() {
  const trips = getTrips();

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl tracking-tight">Trips</h1>
          <p className="mt-2 text-sm text-mist">{trips.length} in the catalog</p>
        </div>
        <Link href="/admin/trips/new" className="rounded-full bg-ink px-5 py-3 text-sm text-cream">New trip</Link>
      </div>
      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-cream">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link href={`/admin/trips/${trip.id}`} className="grid gap-2 px-5 py-4 transition hover:bg-sand/50 sm:grid-cols-[1.4fr_0.8fr_auto] sm:items-center">
              <span>
                <span className="block font-medium">{trip.title}</span>
                <span className="text-sm text-mist">{trip.destination} · {trip.published ? "Published" : "Draft"}{trip.featured ? " · Featured" : ""}</span>
              </span>
              <span className="text-sm text-mist">{trip.departures.slice(0, 2).join(", ")}</span>
              <span className="font-serif text-xl">{formatInr(trip.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
