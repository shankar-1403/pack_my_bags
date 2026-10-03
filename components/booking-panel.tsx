"use client";

import { useState } from "react";
import { durationLabel, formatInr } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { EnquiryForm } from "./enquiry-form";

export function BookingPanel({ trip }: { trip: Trip }) {
  const [departure, setDeparture] = useState(trip.departures[0] ?? "");

  return (
    <aside className="h-fit rounded-[28px] border border-line bg-cream p-5 lg:sticky lg:top-36">
      <p className="text-xs uppercase tracking-[0.18em] text-mist">From</p>
      <p className="mt-1 font-serif text-4xl">{formatInr(trip.price)}</p>
      <p className="mt-1 text-sm text-mist">per person · twin share</p>
      <p className="mt-4 text-sm text-pine">{durationLabel(trip.days, trip.nights)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {trip.departures.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => setDeparture(date)}
            className={`min-h-10 rounded-full px-3.5 py-2 text-sm ${departure === date ? "bg-ink text-cream" : "bg-paper text-ink"}`}
          >
            {date}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <EnquiryForm tripSlug={trip.slug} tripTitle={trip.title} departure={departure} compact />
      </div>
    </aside>
  );
}
