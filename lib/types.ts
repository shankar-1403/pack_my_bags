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
};

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
  departures: string[];
  featured: boolean;
  published: boolean;
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
