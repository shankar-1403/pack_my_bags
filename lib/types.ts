export type TripType =
  | "domestic"
  | "international"
  | "weekend"
  | "bike"
  | "spiritual"
  | "group";

export type ItineraryDay = {
  day: number;
  title: string;
  description: string;
  meals?: string;
  stay?: string;
  image?: string;
};

export type Difficulty = "easy" | "moderate" | "challenging" | "strenuous";
export type DepartureStatus = "open" | "filling" | "sold-out" | "cancelled";

/** One dated batch of a trip. `date`/`endDate` are YYYY-MM-DD; `price` overrides the trip price. */
export type Departure = {
  date: string;
  endDate?: string;
  seats: number;
  seatsLeft: number;
  status: DepartureStatus;
  price?: number;
  note?: string;
};

export type TripFaq = { question: string; answer: string };

export type Trip = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  region: string;
  summary: string;
  description: string;
  image: string;
  gallery: string[];
  days: number;
  nights: number;
  price: number;
  originalPrice: number;
  types: TripType[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  /** Display labels ("10 Oct 2026"), derived from `slots` when the trip has them. */
  departures: string[];
  featured: boolean;
  published: boolean;
  // Everything below is optional: trips saved before the full editor simply leave it out.
  slots?: Departure[];
  tagline?: string;
  badge?: string;
  difficulty?: Difficulty;
  groupMin?: number;
  groupMax?: number;
  ageMin?: number;
  ageMax?: number;
  startCity?: string;
  endCity?: string;
  pickup?: string;
  bestSeason?: string;
  maxAltitude?: string;
  priceNote?: string;
  bookingAmount?: number;
  singleSupplement?: number;
  thingsToCarry?: string[];
  cancellationPolicy?: string;
  faqs?: TripFaq[];
  imageAlt?: string;
  mapUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  sortOrder?: number;
  updatedAt?: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
  author: string;
  publishedAt: string;
  readMinutes: number;
  published: boolean;
};

export type Review = {
  id: string;
  name: string;
  trip: string;
  quote: string;
  rating: number;
  published: boolean;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tripSlug: string;
  tripTitle: string;
  departure: string;
  message: string;
  createdAt: string;
  status: "new" | "contacted";
};

export type SiteSettings = {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  promo: string;
};
