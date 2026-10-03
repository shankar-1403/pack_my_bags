import { labelsFromSlots, slugify, TRIP_TYPES } from "./format";
import type { Departure, DepartureStatus, Difficulty, Faq, Post, Review, SiteSettings, Trip, TripType } from "./types";

const tripTypes = new Set<string>(TRIP_TYPES.map((type) => type.id));

function text(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

const difficulties = new Set(["easy", "moderate", "challenging", "strenuous"]);
const statuses = new Set(["open", "filling", "sold-out", "cancelled"]);
const isoDay = /^\d{4}-\d{2}-\d{2}$/;

function count(value: unknown) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function optional(value: unknown) {
  return text(value) || undefined;
}

function cleanSlots(value: unknown): Departure[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw: Partial<Departure>) => {
      const date = text(raw?.date);
      if (!isoDay.test(date)) throw new Error("Every departure needs a start date.");
      const endDate = text(raw.endDate);
      if (endDate && (!isoDay.test(endDate) || endDate < date)) throw new Error(`The end date of the ${date} departure is before it starts.`);
      const seats = Math.max(0, Math.round(Number(raw.seats) || 0));
      const seatsLeft = Math.min(seats, Math.max(0, Math.round(Number(raw.seatsLeft) || 0)));
      let status = statuses.has(String(raw.status)) ? (raw.status as DepartureStatus) : "open";
      if (seats > 0 && seatsLeft === 0 && status !== "cancelled") status = "sold-out";
      return { date, endDate: endDate || undefined, seats, seatsLeft, status, price: count(raw.price), note: optional(raw.note) };
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function cleanTrip(input: Partial<Trip>, id: string, trips: Trip[]): Trip {
  const title = text(input.title);
  if (!title) throw new Error("Title is required.");
  let slug = slugify(text(input.slug) || title);
  if (!slug) throw new Error("A slug is required.");
  if (trips.some((trip) => trip.slug === slug && trip.id !== id)) {
    slug = `${slug}-${id.slice(0, 4)}`;
  }
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Price must be greater than zero.");
  const original = Number(input.originalPrice);
  const destination = text(input.destination);
  if (!destination) throw new Error("Destination is required.");
  const image = text(input.image);
  if (!image) throw new Error("Upload a cover photo.");
  const types = list(input.types).filter((type): type is TripType => tripTypes.has(type));
  const days = Math.max(1, Number(input.days) || 1);
  const nights = Math.max(0, Number(input.nights) || 0);
  if (nights > days) throw new Error("A trip cannot have more nights than days.");
  const groupMin = count(input.groupMin);
  const groupMax = count(input.groupMax);
  if (groupMin && groupMax && groupMin > groupMax) throw new Error("Smallest group size is larger than the largest.");
  const ageMin = count(input.ageMin);
  const ageMax = count(input.ageMax);
  if (ageMin && ageMax && ageMin > ageMax) throw new Error("Minimum age is higher than the maximum.");
  const slots = cleanSlots(input.slots);
  const previous = trips.find((trip) => trip.id === id);

  return {
    id,
    slug,
    title,
    destination,
    region: text(input.region),
    summary: text(input.summary),
    description: text(input.description),
    image,
    gallery: list(input.gallery),
    days,
    nights,
    price,
    originalPrice: Number.isFinite(original) && original > 0 ? original : price,
    types,
    highlights: list(input.highlights),
    inclusions: list(input.inclusions),
    exclusions: list(input.exclusions),
    itinerary: Array.isArray(input.itinerary)
      ? input.itinerary.map((day, index) => ({
          day: index + 1,
          title: text(day.title, `Day ${index + 1}`),
          description: text(day.description),
          meals: optional(day.meals),
          stay: optional(day.stay),
          image: optional(day.image),
        }))
      : [],
    // Slots are the source of truth when present; the old free-text list stays for trips without them.
    departures: slots.length > 0 ? labelsFromSlots(slots) : list(input.departures),
    featured: Boolean(input.featured),
    published: Boolean(input.published),
    slots: slots.length > 0 ? slots : undefined,
    tagline: optional(input.tagline),
    badge: optional(input.badge),
    difficulty: difficulties.has(String(input.difficulty)) ? (input.difficulty as Difficulty) : undefined,
    groupMin,
    groupMax,
    ageMin,
    ageMax,
    startCity: optional(input.startCity),
    endCity: optional(input.endCity),
    pickup: optional(input.pickup),
    bestSeason: optional(input.bestSeason),
    maxAltitude: optional(input.maxAltitude),
    priceNote: optional(input.priceNote),
    bookingAmount: count(input.bookingAmount),
    singleSupplement: count(input.singleSupplement),
    thingsToCarry: list(input.thingsToCarry),
    cancellationPolicy: optional(input.cancellationPolicy),
    faqs: Array.isArray(input.faqs)
      ? input.faqs.map((faq) => ({ question: text(faq?.question), answer: text(faq?.answer) })).filter((faq) => faq.question && faq.answer)
      : [],
    imageAlt: optional(input.imageAlt),
    mapUrl: optional(input.mapUrl),
    seoTitle: optional(input.seoTitle),
    seoDescription: optional(input.seoDescription),
    ogImage: optional(input.ogImage),
    sortOrder: previous?.sortOrder,
    updatedAt: new Date().toISOString(),
  };
}

export function cleanPost(input: Partial<Post>, id: string, posts: Post[]): Post {
  const title = text(input.title);
  if (!title) throw new Error("Title is required.");
  let slug = slugify(text(input.slug) || title);
  if (posts.some((post) => post.slug === slug && post.id !== id)) {
    slug = `${slug}-${id.slice(0, 4)}`;
  }
  const body = text(input.body);
  if (!body) throw new Error("The story needs a body.");
  const image = text(input.image);
  if (!image) throw new Error("Upload a photo for the story.");
  const publishedAt = text(input.publishedAt) || new Date().toISOString().slice(0, 10);

  return {
    id,
    slug,
    title,
    excerpt: text(input.excerpt),
    body,
    image,
    author: text(input.author, "PackMyBags desk"),
    publishedAt,
    readMinutes: Math.max(1, Number(input.readMinutes) || 4),
    published: input.published !== false,
  };
}

export function cleanReview(input: Partial<Review>, id: string): Review {
  const name = text(input.name);
  const quote = text(input.quote);
  const trip = text(input.trip);
  if (!name || !quote || !trip) throw new Error("Name, trip, and quote are required.");
  const rating = Math.min(5, Math.max(1, Number(input.rating) || 5));
  return { id, name, trip, quote, rating, published: Boolean(input.published) };
}

export function cleanFaq(input: Partial<Faq>, id: string): Faq {
  const question = text(input.question);
  const answer = text(input.answer);
  if (!question || !answer) throw new Error("Question and answer are required.");
  return { id, question, answer };
}

export function cleanSettings(input: Partial<SiteSettings>): SiteSettings {
  const name = text(input.name, "PackMyBags");
  const email = text(input.email);
  if (!email.includes("@")) throw new Error("A valid email is required.");
  return {
    name,
    tagline: text(input.tagline),
    phone: text(input.phone),
    whatsapp: text(input.whatsapp).replace(/[^\d]/g, ""),
    email,
    address: text(input.address),
    promo: text(input.promo),
  };
}
