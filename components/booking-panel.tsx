"use client";

import { useState } from "react";
import { dateLabel, departureStatusLabel, durationLabel, formatInr } from "@/lib/format";
import type { Departure, Trip } from "@/lib/types";
import { EnquiryForm } from "./enquiry-form";

export function BookingPanel({ trip }: { trip: Trip }) {
  const today = new Date().toISOString().slice(0, 10);
  // Real batches when the trip has them (past and cancelled ones hidden); otherwise the plain date labels.
  const slots: Departure[] = (trip.slots ?? []).filter((slot) => slot.status !== "cancelled" && (slot.endDate ?? slot.date) >= today);
  const options = slots.length
    ? slots.map((slot) => ({ key: slot.date, label: dateLabel(slot.date), slot }))
    : trip.departures.map((label) => ({ key: label, label, slot: undefined as Departure | undefined }));
  const firstOpen = options.find((o) => o.slot?.status !== "sold-out") ?? options[0];
  const [chosen, setChosen] = useState(firstOpen?.key ?? "");
  const picked = options.find((o) => o.key === chosen);
  const price = picked?.slot?.price ?? trip.price;
  const soldOut = picked?.slot?.status === "sold-out";

  return (
    <aside className="h-fit rounded-[28px] border border-line bg-cream p-5 lg:sticky lg:top-36">
      <p className="text-xs uppercase tracking-[0.18em] text-mist">{picked?.slot?.price ? "For this date" : "From"}</p>
      <p className="mt-1 font-serif text-4xl">{formatInr(price)}</p>
      <p className="mt-1 text-sm text-mist">{trip.priceNote || "per person · twin share"}</p>
      {trip.bookingAmount || trip.singleSupplement ? (
        <ul className="mt-3 space-y-1 text-sm text-ink/75">
          {trip.bookingAmount ? <li>{formatInr(trip.bookingAmount)} holds your seat</li> : null}
          {trip.singleSupplement ? <li>Single room: + {formatInr(trip.singleSupplement)}</li> : null}
        </ul>
      ) : null}
      <p className="mt-4 text-sm text-pine">{durationLabel(trip.days, trip.nights)}</p>

      {options.length ? (
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Departure date">
          {options.map(({ key, label, slot }) => {
            const full = slot?.status === "sold-out";
            const active = chosen === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setChosen(key)}
                className={`flex min-h-10 flex-col items-start rounded-2xl px-3.5 py-2 text-left text-sm ${active ? "bg-ink text-cream" : "bg-paper text-ink"} ${full ? "opacity-60" : ""}`}
              >
                <span className={full ? "line-through" : ""}>{label}</span>
                {slot && slot.status !== "open" ? (
                  <span className={`text-[11px] ${active ? "text-cream/70" : slot.status === "filling" ? "text-[#c2410c]" : "text-mist"}`}>{departureStatusLabel(slot.status)}</span>
                ) : slot && slot.seats > 0 && slot.seatsLeft <= 5 ? (
                  <span className={`text-[11px] ${active ? "text-cream/70" : "text-[#c2410c]"}`}>{slot.seatsLeft} seats left</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-mist">Dates on request — send a note and we will share the next batch.</p>
      )}
      {picked?.slot?.note ? <p className="mt-3 text-sm text-ink/75">{picked.slot.note}</p> : null}
      {soldOut ? <p className="mt-3 text-sm text-[#c2410c]">This date is full. Send a note to join the waitlist.</p> : null}

      <div className="mt-5">
        <EnquiryForm tripSlug={trip.slug} tripTitle={trip.title} departure={picked ? `${picked.label}${soldOut ? " (waitlist)" : ""}` : ""} compact />
      </div>
    </aside>
  );
}
