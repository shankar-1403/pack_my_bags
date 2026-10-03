import Image from "next/image";
import Link from "next/link";
import { discountAmount, durationLabel, formatInr, typeLabel } from "@/lib/format";
import type { Trip } from "@/lib/types";

export function DepartureBoard({ trips }: { trips: Trip[] }) {
  const [lead, ...rest] = trips;
  if (!lead) return null;
  const rail = rest.slice(0, 2);
  const tiles = rest.slice(2, 5);

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:grid-rows-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
      <LeadCard trip={lead} />
      {rail.map((trip) => (
        <RailCard key={trip.id} trip={trip} />
      ))}
      {tiles.map((trip) => (
        <TileCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

function LeadCard({ trip }: { trip: Trip }) {
  const save = discountAmount(trip.price, trip.originalPrice);

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="group relative min-h-[420px] overflow-hidden rounded-[28px] lg:col-span-2 lg:row-span-2 lg:min-h-0"
    >
      <Image src={trip.image} alt={trip.title} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/25 to-pine/10" />
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        {trip.types.slice(0, 2).map((type) => (
          <span key={type} className="rounded-full bg-cream/90 px-2.5 py-1 font-header text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
            {typeLabel(type)}
          </span>
        ))}
      </div>
      {save > 0 ? (
        <span className="absolute right-4 top-4 rounded-full bg-[#f94f18] px-3 py-1 font-header text-xs font-semibold text-white">
          {formatInr(save)} off
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-6 text-cream sm:p-8">
        <p className="font-header text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/70">{trip.region}</p>
        <h3 className="mt-2 max-w-md font-serif text-4xl leading-none tracking-tight sm:text-5xl">{trip.title}</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-cream/80">{trip.summary}</p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-header text-3xl font-semibold tracking-tight">{formatInr(trip.price)}</p>
            <p className="mt-1 font-header text-xs text-cream/70">
              {durationLabel(trip.days, trip.nights)} · {trip.departures.slice(0, 2).join(" · ")}
            </p>
          </div>
          <span className="rounded-full bg-cream px-4 py-2 font-header text-sm font-semibold text-ink">View trip</span>
        </div>
      </div>
    </Link>
  );
}

function RailCard({ trip }: { trip: Trip }) {
  return (
    <Link href={`/trips/${trip.slug}`} className="group flex h-full min-h-40 overflow-hidden rounded-[24px] border border-line bg-cream">
      <span className="relative w-28 shrink-0 self-stretch sm:w-36">
        <Image src={trip.image} alt="" fill sizes="160px" className="object-cover transition duration-700 group-hover:scale-105" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <span>
          <span className="font-header text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">{trip.region}</span>
          <span className="mt-1 block font-serif text-2xl leading-none tracking-tight">{trip.title}</span>
        </span>
        <span className="mt-3 flex items-end justify-between gap-3">
          <span>
            <span className="block font-header text-lg font-semibold">{formatInr(trip.price)}</span>
            <span className="block font-header text-[11px] text-mist">{trip.departures[0]}</span>
          </span>
          <span className="font-header text-xs font-semibold text-[#f94f18]">View</span>
        </span>
      </span>
    </Link>
  );
}

function TileCard({ trip }: { trip: Trip }) {
  const save = discountAmount(trip.price, trip.originalPrice);

  return (
    <Link href={`/trips/${trip.slug}`} className="group relative aspect-[16/10] overflow-hidden rounded-[24px]">
      <Image src={trip.image} alt={trip.title} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-pine/85 via-pine/10 to-transparent" />
      {save > 0 ? (
        <span className="absolute right-3 top-3 rounded-full bg-[#f94f18] px-2.5 py-1 font-header text-[11px] font-semibold text-white">
          {formatInr(save)} off
        </span>
      ) : null}
      <span className="absolute inset-x-0 bottom-0 p-4 text-cream">
        <span className="font-header text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/70">{trip.region}</span>
        <span className="mt-1 block font-serif text-2xl leading-none">{trip.title}</span>
        <span className="mt-2 block font-header text-sm font-semibold">{formatInr(trip.price)}</span>
      </span>
    </Link>
  );
}
