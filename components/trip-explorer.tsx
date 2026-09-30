"use client";

import { useMemo, useState, type ReactNode } from "react";
import { TRIP_TYPES } from "@/lib/format";
import type { Trip, TripType } from "@/lib/types";
import { TripCatalog } from "./trip-catalog";

const budgets = [
  { id: "any", label: "Any budget", min: 0, max: Infinity },
  { id: "15", label: "Under ₹15,000", min: 0, max: 15000 },
  { id: "30", label: "₹15,000 – ₹30,000", min: 15000, max: 30000 },
  { id: "50", label: "₹30,000 – ₹50,000", min: 30000, max: 50000 },
  { id: "50p", label: "₹50,000+", min: 50000, max: Infinity },
];

export function TripExplorer({
  trips,
  initialType = "",
  initialDestination = "",
  initialQuery = "",
}: {
  trips: Trip[];
  initialType?: string;
  initialDestination?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [destination, setDestination] = useState(initialDestination);
  const [budget, setBudget] = useState("any");
  const [sort, setSort] = useState("featured");

  const destinations = useMemo(
    () => [...new Set(trips.map((trip) => trip.destination))].sort(),
    [trips],
  );

  const visible = useMemo(() => {
    const band = budgets.find((item) => item.id === budget) ?? budgets[0];
    const filtered = trips.filter((trip) => {
      const haystack = `${trip.title} ${trip.destination} ${trip.region} ${trip.summary}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesType = !type || trip.types.includes(type as TripType);
      const matchesDestination = !destination || trip.destination === destination;
      const matchesBudget = trip.price >= band.min && trip.price < band.max;
      return matchesQuery && matchesType && matchesDestination && matchesBudget;
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return 0;
    });
  }, [budget, destination, query, sort, trips, type]);

  return (
    <div>
      <div className="rounded-[28px] border border-line bg-cream p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Spiti, Vietnam, weekend…"
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-clay"
            aria-label="Search trips"
          />
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none"
            aria-label="Destination"
          >
            <option value="">All destinations</option>
            {destinations.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none"
            aria-label="Budget"
          >
            {budgets.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none"
            aria-label="Sort trips"
          >
            <option value="featured">Featured first</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={!type} onClick={() => setType("")}>All trips</FilterChip>
          {TRIP_TYPES.map((item) => (
            <FilterChip key={item.id} active={type === item.id} onClick={() => setType(item.id)}>
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-mist">
        {visible.length} {visible.length === 1 ? "departure" : "departures"}
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-line bg-cream px-6 py-16 text-center">
          <p className="font-serif text-3xl">Nothing on that combination yet.</p>
          <button type="button" className="mt-4 text-sm text-[#f94f18]" onClick={() => { setQuery(""); setType(""); setDestination(""); setBudget("any"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <TripCatalog trips={visible} />
      )}
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${active ? "bg-ink text-cream" : "bg-paper text-ink hover:bg-sand"}`}
    >
      {children}
    </button>
  );
}
