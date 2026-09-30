import Image from "next/image";
import Link from "next/link";
import { discountAmount, formatInr, typeLabel } from "@/lib/format";
import type { Trip } from "@/lib/types";

export function TripCatalog({ trips }: { trips: Trip[] }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripTile key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

function TripTile({ trip }: { trip: Trip }) {
  const save = discountAmount(trip.price, trip.originalPrice);
  const style = trip.types[0] ? typeLabel(trip.types[0]) : "";

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="group flex h-full flex-col rounded-[28px] bg-cream p-2 ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-pine/35"
    >
      <span className="relative h-40 overflow-hidden rounded-[22px]">
        <Image
          src={trip.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-pine/70 to-transparent" />
        {style ? (
          <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 font-header text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
            {style}
          </span>
        ) : null}
        {save > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-[#f94f18] px-2.5 py-1 font-header text-[10px] font-semibold text-white">
            {formatInr(save)} off
          </span>
        ) : null}
        <span className="absolute bottom-3 left-3 font-header text-[11px] font-semibold uppercase tracking-[0.14em] text-cream">
          {trip.days}d / {trip.nights}n
        </span>
      </span>

      <span className="flex flex-1 flex-col px-3 pb-3 pt-3">
        <span className="font-header text-[10px] font-semibold uppercase tracking-[0.16em] text-mist">{trip.region}</span>
        <span className="mt-1 line-clamp-2 min-h-12 font-serif text-[1.65rem] leading-none tracking-tight">{trip.title}</span>
        <span className="mt-2 font-header text-xs text-ink/55">{trip.departures[0]}</span>
        <span className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-pine px-3.5 py-2.5 text-cream">
          <span className="font-header text-lg font-semibold tracking-tight">{formatInr(trip.price)}</span>
          <span className="font-header text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/75">View</span>
        </span>
      </span>
    </Link>
  );
}
