import Link from "next/link";
import { TripsManager } from "@/components/admin/trips-manager";
import { getTrips } from "@/lib/content";

export default async function AdminTripsPage() {
  const trips = await getTrips();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl tracking-tight">Destinations</h1>
          <p className="mt-2 text-sm text-mist">Every trip on the site, in the order it appears.</p>
        </div>
        <Link href="/admin/trips/new" className="rounded-full bg-ink px-5 py-3 text-sm text-cream">New trip</Link>
      </div>
      <TripsManager trips={trips} />
    </div>
  );
}
