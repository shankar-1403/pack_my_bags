import type { ItineraryDay } from "./types";

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
