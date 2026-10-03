import type { Departure, DepartureStatus, Difficulty, ItineraryDay } from "./types";

export const TRIP_TYPES = [
  { id: "domestic", label: "Domestic" },
  { id: "international", label: "International" },
  { id: "weekend", label: "Weekend" },
  { id: "bike", label: "Bike" },
  { id: "spiritual", label: "Spiritual" },
  { id: "group", label: "Group" },
] as const;

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function durationLabel(days: number, nights: number) {
  return `${days} days / ${nights} nights`;
}

export function typeLabel(id: string) {
  return TRIP_TYPES.find((type) => type.id === id)?.label ?? id;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function listToLines(list: string[]) {
  return list.join("\n");
}

export function parseItinerary(value: string): ItineraryDay[] {
  return linesToList(value).map((line, index) => {
    const [title, ...rest] = line.split("|").map((part) => part.trim());
    return {
      day: index + 1,
      title: title || `Day ${index + 1}`,
      description: rest.join(" | "),
    };
  });
}

export function itineraryToText(days: ItineraryDay[]) {
  return days.map((day) => `${day.title} | ${day.description}`).join("\n");
}

export function discountAmount(price: number, originalPrice: number) {
  return Math.max(0, originalPrice - price);
}

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "moderate", label: "Moderate" },
  { id: "challenging", label: "Challenging" },
  { id: "strenuous", label: "Strenuous" },
];

export const DEPARTURE_STATUSES: { id: DepartureStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "filling", label: "Filling fast" },
  { id: "sold-out", label: "Sold out" },
  { id: "cancelled", label: "Cancelled" },
];

export const difficultyLabel = (id?: string) => DIFFICULTIES.find((item) => item.id === id)?.label ?? "";
export const departureStatusLabel = (id?: string) => DEPARTURE_STATUSES.find((item) => item.id === id)?.label ?? "";

/** "2026-10-10" → "10 Oct 2026" (the label the site has always shown). */
export function dateLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "10 Oct 2026" → "2026-10-10"; empty when it is not a date (e.g. "Dates on request"). */
export function isoDate(label: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label;
  const date = new Date(label);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Slots for a trip saved before slots existed: one open batch per old date label. */
export function slotsFromLabels(labels: string[]): Departure[] {
  return labels
    .map((label) => isoDate(label))
    .filter(Boolean)
    .map((date) => ({ date, seats: 12, seatsLeft: 12, status: "open" as const }));
}

/** The labels shown on cards: upcoming, bookable batches in date order. */
export function labelsFromSlots(slots: Departure[]) {
  return [...slots]
    .filter((slot) => slot.status !== "cancelled")
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((slot) => dateLabel(slot.date));
}
