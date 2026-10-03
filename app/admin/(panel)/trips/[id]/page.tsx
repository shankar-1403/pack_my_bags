import Link from "next/link";
import { notFound } from "next/navigation";
import { TripForm } from "@/components/admin/trip-form";
import { getTrips } from "@/lib/content";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = (await getTrips()).find((item) => item.id === id);
  if (!trip) notFound();

  return (
    <div>
      <Link href="/admin/trips" className="text-sm text-mist hover:text-ink">← All destinations</Link>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">{trip.title}</h1>
      <p className="mt-2 text-sm text-mist">/trips/{trip.slug}{trip.updatedAt ? ` · last saved ${new Date(trip.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""}</p>
      <div className="mt-8">
        <TripForm trip={trip} />
      </div>
    </div>
  );
}
