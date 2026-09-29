import { notFound } from "next/navigation";
import { TripForm } from "@/components/admin/trip-form";
import { getTrips } from "@/lib/content";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = getTrips().find((item) => item.id === id);
  if (!trip) notFound();

  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">Edit trip</h1>
      <p className="mt-2 text-sm text-mist">/{trip.slug}</p>
      <div className="mt-8 max-w-4xl">
        <TripForm trip={trip} />
      </div>
    </div>
  );
}
