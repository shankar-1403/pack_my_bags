import Image from "next/image";
import Link from "next/link";
import { discountAmount, durationLabel, formatInr, typeLabel } from "@/lib/format";
import type { Trip } from "@/lib/types";

export function TripCard({ trip }: { trip: Trip }) {
  const save = discountAmount(trip.price, trip.originalPrice);

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-cream shadow-[0_24px_50px_-36px_rgba(23,20,15,0.85)] transition hover:-translate-y-1"
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <Image
          src={trip.image}
          alt={trip.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {trip.types.slice(0, 2).map((type) => (
            <span key={type} className="rounded-full bg-cream/90 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-ink">
              {typeLabel(type)}
            </span>
          ))}
        </div>
        {save > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-clay px-3 py-1 text-xs font-medium text-white">
            {formatInr(save)} off
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{trip.region}</p>
        <h3 className="mt-2 font-serif text-[1.7rem] leading-none tracking-tight">{trip.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/70">{trip.summary}</p>
        <p className="mt-4 text-sm text-pine">{durationLabel(trip.days, trip.nights)}</p>
        <p className="mt-1 line-clamp-1 text-sm text-mist">{trip.departures.join(" · ")}</p>
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="font-serif text-3xl leading-none">{formatInr(trip.price)}</p>
            {save > 0 ? <p className="mt-1 text-xs text-mist line-through">{formatInr(trip.originalPrice)}</p> : null}
          </div>
          <span className="text-sm font-medium text-clay">View trip</span>
        </div>
      </div>
    </Link>
  );
}
