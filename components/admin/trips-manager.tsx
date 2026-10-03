"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TRIP_TYPES, formatInr } from "@/lib/format";
import type { Trip } from "@/lib/types";

type Filter = "all" | "published" | "draft" | "featured" | "no-dates";

/** The trip list: search, filter, and one-click publish / feature / reorder / duplicate / delete. */
export function TripsManager({ trips }: { trips: Trip[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [type, setType] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (trip: Trip) => (trip.slots ?? []).filter((slot) => slot.date >= today && slot.status !== "cancelled");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trips.filter((trip) => {
      if (q && ![trip.title, trip.destination, trip.region, trip.slug].join(" ").toLowerCase().includes(q)) return false;
      if (type && !trip.types.includes(type as Trip["types"][number])) return false;
      if (filter === "published") return trip.published;
      if (filter === "draft") return !trip.published;
      if (filter === "featured") return trip.featured;
      if (filter === "no-dates") return trip.departures.length === 0;
      return true;
    });
  }, [trips, query, filter, type]);

  async function act(trip: Trip, body: object, method = "PATCH", url = `/api/trips/${trip.id}`) {
    setBusy(trip.id);
    setError("");
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy("");
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "That did not work. Try again.");
      return null;
    }
    router.refresh();
    return response.json().catch(() => null);
  }

  async function remove(trip: Trip) {
    if (!confirm(`Delete “${trip.title}” for good? This cannot be undone.`)) return;
    setBusy(trip.id);
    const response = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
    setBusy("");
    if (!response.ok) setError("Could not delete the trip.");
    router.refresh();
  }

  const counts = {
    all: trips.length,
    published: trips.filter((t) => t.published).length,
    draft: trips.filter((t) => !t.published).length,
    featured: trips.filter((t) => t.featured).length,
    "no-dates": trips.filter((t) => t.departures.length === 0).length,
  };
  const reorderable = !query && !type && filter === "all";

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, destination, region…"
          className="min-h-10 w-full rounded-full border border-line bg-cream px-4 text-sm outline-none focus:border-clay sm:w-72"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="min-h-10 rounded-full border border-line bg-cream px-4 text-sm">
          <option value="">All types</option>
          {TRIP_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <div className="flex flex-wrap gap-1">
          {(["all", "published", "draft", "featured", "no-dates"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`min-h-10 rounded-full px-3.5 text-sm ${filter === f ? "bg-ink text-cream" : "bg-cream text-ink ring-1 ring-line"}`}
            >
              {{ all: "All", published: "Published", draft: "Drafts", featured: "Featured", "no-dates": "No dates" }[f]} · {counts[f]}
            </button>
          ))}
        </div>
      </div>
      {!reorderable ? <p className="mt-2 text-xs text-mist">Clear search and filters to reorder.</p> : null}
      {error ? <p className="mt-3 text-sm text-[#f94f18]" role="alert">{error}</p> : null}

      <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-cream">
        {shown.length === 0 ? <li className="px-5 py-8 text-center text-sm text-mist">No trips match.</li> : null}
        {shown.map((trip, index) => {
          const next = upcoming(trip);
          const seats = next.reduce((sum, slot) => sum + slot.seatsLeft, 0);
          return (
            <li key={trip.id} className={`grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:items-center ${busy === trip.id ? "opacity-50" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={trip.image} alt="" className="hidden size-14 rounded-xl object-cover lg:block" />
              <div className="min-w-0">
                <Link href={`/admin/trips/${trip.id}`} className="font-medium hover:underline">{trip.title}</Link>
                <p className="mt-0.5 flex flex-wrap gap-x-2 text-sm text-mist">
                  <span>{trip.destination}</span>
                  <span>· {formatInr(trip.price)}</span>
                  <span>· {trip.departures.length ? `${trip.departures.length} date${trip.departures.length > 1 ? "s" : ""}` : "no dates"}</span>
                  {trip.slots?.length ? <span>· {seats} seats left</span> : null}
                  {trip.badge ? <span>· “{trip.badge}”</span> : null}
                </p>
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  <Tag tone={trip.published ? "pine" : "mist"}>{trip.published ? "Published" : "Draft"}</Tag>
                  {trip.featured ? <Tag tone="clay">Featured</Tag> : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {reorderable ? (
                  <>
                    <Small label="Move to top" onClick={() => act(trip, { move: "top" })} disabled={index === 0}>⤒</Small>
                    <Small label="Move up" onClick={() => act(trip, { move: "up" })} disabled={index === 0}>↑</Small>
                    <Small label="Move down" onClick={() => act(trip, { move: "down" })} disabled={index === shown.length - 1}>↓</Small>
                  </>
                ) : null}
                <Pill onClick={() => act(trip, { published: !trip.published })}>{trip.published ? "Unpublish" : "Publish"}</Pill>
                <Pill onClick={() => act(trip, { featured: !trip.featured })}>{trip.featured ? "Unfeature" : "Feature"}</Pill>
                <Pill
                  onClick={async () => {
                    const data = await act(trip, { duplicateOf: trip.id }, "POST", "/api/trips");
                    if (data?.item) router.push(`/admin/trips/${data.item.id}`);
                  }}
                >
                  Duplicate
                </Pill>
                {trip.published ? <Link href={`/trips/${trip.slug}`} target="_blank" className="inline-flex min-h-9 items-center rounded-full px-3 text-sm ring-1 ring-line hover:bg-sand">View</Link> : null}
                <Link href={`/admin/trips/${trip.id}`} className="inline-flex min-h-9 items-center rounded-full bg-ink px-3.5 text-sm text-cream">Edit</Link>
                <Small label="Delete" onClick={() => remove(trip)}><span className="text-[#f94f18]">✕</span></Small>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Tag({ tone, children }: { tone: "pine" | "mist" | "clay"; children: React.ReactNode }) {
  const tones = { pine: "bg-pine/10 text-pine", mist: "bg-sand text-mist", clay: "bg-[#f94f18]/10 text-[#c2410c]" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function Pill({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="min-h-9 rounded-full px-3 text-sm ring-1 ring-line hover:bg-sand">{children}</button>;
}

function Small({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid size-9 place-items-center rounded-full text-sm hover:bg-sand disabled:opacity-30">
      {children}
    </button>
  );
}
