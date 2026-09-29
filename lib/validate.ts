import { slugify, TRIP_TYPES } from "./format";
import type { Faq, Post, Review, SiteSettings, Trip, TripType } from "./types";

const tripTypes = new Set<string>(TRIP_TYPES.map((type) => type.id));

function text(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
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
  if (!image) throw new Error("A cover image URL is required.");
  const types = list(input.types).filter((type): type is TripType => tripTypes.has(type));

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
    days: Math.max(1, Number(input.days) || 1),
    nights: Math.max(0, Number(input.nights) || 0),
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
        }))
      : [],
    departures: list(input.departures),
    featured: Boolean(input.featured),
    published: Boolean(input.published),
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
  if (!image) throw new Error("An image URL is required.");
  const publishedAt = text(input.publishedAt) || new Date().toISOString().slice(0, 10);

  return {
    id,
    slug,
    title,
    excerpt: text(input.excerpt),
    body,
    image,
    author: text(input.author, "Pack my bags desk"),
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
  const name = text(input.name, "Pack my bags");
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
