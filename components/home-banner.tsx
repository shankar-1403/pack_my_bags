import Image from "next/image";
import Link from "next/link";
import { formatInr } from "@/lib/format";
import type { Trip } from "@/lib/types";

export function HomeBanner({
  routeCount,
  startsFrom,
  spotlight,
  companions,
  fill = false,
}: {
  routeCount: number;
  startsFrom: number;
  spotlight?: Trip;
  companions: Trip[];
  fill?: boolean;
}) {
  return (
    <section className={`relative isolate -mt-[var(--site-header-height,7.5rem)] min-h-[760px] w-full overflow-hidden bg-pine pt-[var(--site-header-height,7.5rem)] ${fill ? "md:motion-safe:min-h-[100dvh]" : ""}`}>
        {spotlight ? (
          <Image
            src={spotlight.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-pine via-pine/80 to-pine/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-pine/80 via-transparent to-pine/55" />

        <div className={`relative mx-auto flex min-h-[680px] w-full max-w-7xl flex-col justify-between px-3 py-10 text-cream sm:px-5 sm:py-14 ${fill ? "md:motion-safe:min-h-[calc(100dvh-var(--site-header-height,7.5rem))]" : ""}`}>
          <div className="max-w-xl">
            <p className="font-header text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f94f18]">
              Upcoming group departures
            </p>
            <h1 className="mt-4 font-serif text-[2.75rem] leading-[0.95] tracking-tight sm:text-6xl">
              Trips with a pulse, planned to the last mile.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-cream/80">
              Fixed dates across India and a few places further out. Small groups, handpicked stays, and a captain who is on the trip with you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trips" className="rounded-full bg-[#f94f18] px-5 py-3 font-header text-sm font-semibold text-white transition hover:bg-white">
                Browse upcoming trips
              </Link>
              <Link href="/contact" className="rounded-full border border-white/35 px-5 py-3 font-header text-sm font-semibold text-cream transition hover:bg-white/10">
                Plan a private date
              </Link>
            </div>
            {spotlight ? (
              <Link href={`/trips/${spotlight.slug}`} className="mt-6 inline-flex font-header text-sm font-medium text-cream/90 underline-offset-4 hover:underline">
                Featured now · {spotlight.title}
              </Link>
            ) : null}
          </div>

          <div className="mt-12 grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
            <dl className="grid max-w-md grid-cols-3 border-t border-white/20 pt-5">
              <Stat value={String(routeCount)} label="Open routes" />
              <Stat value="4.8" label="Traveller rating" />
              <Stat value={formatInr(startsFrom)} label="Starts from" />
            </dl>
            {companions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {companions.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.slug}`}
                    className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/12 p-2 pr-4 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20 sm:w-64"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Image src={trip.image} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-header text-[10px] font-medium uppercase tracking-[0.16em] text-cream/70">{trip.region}</span>
                      <span className="mt-0.5 block truncate font-header text-sm font-semibold">{trip.title}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-header text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dt>
      <dd className="mt-1 font-header text-[11px] font-medium uppercase tracking-[0.14em] text-cream/65">{label}</dd>
    </div>
  );
}
