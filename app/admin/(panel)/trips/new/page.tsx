import { TripForm } from "@/components/admin/trip-form";

export default function NewTripPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">New trip</h1>
      <div className="mt-8">
        <TripForm trip={null} />
      </div>
    </div>
  );
}
