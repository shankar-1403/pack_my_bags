"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  TRIP_TYPES,
  itineraryToText,
  linesToList,
  listToLines,
  parseItinerary,
} from "@/lib/format";
import type { Trip, TripType } from "@/lib/types";
import { Field, inputClass } from "./fields";

export function TripForm({ trip }: { trip: Trip | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const types = TRIP_TYPES.map((item) => item.id).filter((id) => form.get(`type-${id}`)) as TripType[];
    const payload = {
      id: trip?.id,
      title: form.get("title"),
      slug: form.get("slug"),
      destination: form.get("destination"),
      region: form.get("region"),
      summary: form.get("summary"),
      description: form.get("description"),
      image: form.get("image"),
      gallery: linesToList(String(form.get("gallery") ?? "")),
      days: Number(form.get("days")),
      nights: Number(form.get("nights")),
      price: Number(form.get("price")),
      originalPrice: Number(form.get("originalPrice")),
      types,
      highlights: linesToList(String(form.get("highlights") ?? "")),
      inclusions: linesToList(String(form.get("inclusions") ?? "")),
      exclusions: linesToList(String(form.get("exclusions") ?? "")),
      itinerary: parseItinerary(String(form.get("itinerary") ?? "")),
      departures: String(form.get("departures") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      featured: form.get("featured") === "on",
      published: form.get("published") === "on",
    };

    const response = await fetch(trip ? `/api/trips/${trip.id}` : "/api/trips", {
      method: trip ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; item?: Trip } | null;
    setSaving(false);
    if (!response.ok || !data?.item) {
      setError(data?.error || "Could not save the trip.");
      return;
    }
    if (!trip) {
      router.push(`/admin/trips/${data.item.id}`);
    } else {
      setSaved(true);
    }
    router.refresh();
  }

  async function onDelete() {
    if (!trip || !confirm(`Delete ${trip.title}?`)) return;
    const response = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not delete the trip.");
      return;
    }
    router.push("/admin/trips");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input name="title" required defaultValue={trip?.title} className={inputClass} />
        </Field>
        <Field label="Slug">
          <input name="slug" defaultValue={trip?.slug} placeholder="auto from title" className={inputClass} />
        </Field>
        <Field label="Destination">
          <input name="destination" required defaultValue={trip?.destination} className={inputClass} />
        </Field>
        <Field label="Region">
          <input name="region" defaultValue={trip?.region} className={inputClass} />
        </Field>
        <Field label="Days">
          <input name="days" type="number" min={1} required defaultValue={trip?.days ?? 5} className={inputClass} />
        </Field>
        <Field label="Nights">
          <input name="nights" type="number" min={0} required defaultValue={trip?.nights ?? 4} className={inputClass} />
        </Field>
        <Field label="Price (INR)">
          <input name="price" type="number" min={1} required defaultValue={trip?.price ?? 19999} className={inputClass} />
        </Field>
        <Field label="Original price">
          <input name="originalPrice" type="number" min={0} defaultValue={trip?.originalPrice ?? trip?.price ?? 19999} className={inputClass} />
        </Field>
      </div>
      <Field label="Summary">
        <textarea name="summary" rows={2} defaultValue={trip?.summary} className={inputClass} />
      </Field>
      <Field label="Description">
        <textarea name="description" rows={5} defaultValue={trip?.description} className={inputClass} />
      </Field>
      <Field label="Cover image URL">
        <input name="image" required defaultValue={trip?.image} className={inputClass} />
      </Field>
      <Field label="Gallery URLs, one per line">
        <textarea name="gallery" rows={3} defaultValue={listToLines(trip?.gallery ?? [])} className={inputClass} />
      </Field>
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-mist">Trip types</legend>
        <div className="flex flex-wrap gap-3">
          {TRIP_TYPES.map((item) => (
            <label key={item.id} className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-2 text-sm">
              <input type="checkbox" name={`type-${item.id}`} defaultChecked={trip?.types.includes(item.id)} />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Highlights, one per line">
          <textarea name="highlights" rows={5} defaultValue={listToLines(trip?.highlights ?? [])} className={inputClass} />
        </Field>
        <Field label="Departures, comma separated">
          <textarea name="departures" rows={5} defaultValue={(trip?.departures ?? []).join(", ")} className={inputClass} />
        </Field>
        <Field label="Inclusions, one per line">
          <textarea name="inclusions" rows={5} defaultValue={listToLines(trip?.inclusions ?? [])} className={inputClass} />
        </Field>
        <Field label="Exclusions, one per line">
          <textarea name="exclusions" rows={5} defaultValue={listToLines(trip?.exclusions ?? [])} className={inputClass} />
        </Field>
      </div>
      <Field label="Itinerary, one day per line as Title | Description">
        <textarea name="itinerary" rows={8} defaultValue={itineraryToText(trip?.itinerary ?? [])} className={inputClass} />
      </Field>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={trip?.featured} /> Featured on the homepage
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={trip?.published ?? true} /> Published
        </label>
      </div>
      {error ? <p className="text-sm text-[#f94f18]">{error}</p> : null}
      {saved ? <p className="text-sm text-pine">Saved.</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-ink px-5 py-3 text-sm text-cream disabled:opacity-60">
          {saving ? "Saving…" : trip ? "Save trip" : "Create trip"}
        </button>
        {trip ? (
          <button type="button" onClick={onDelete} className="rounded-full border border-line px-5 py-3 text-sm text-[#f94f18]">
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
