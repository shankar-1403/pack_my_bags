import "server-only";
import fs from "fs";
import path from "path";
import { database, plain, usesDatabase } from "./firebase";
import type {
  Enquiry,
  Faq,
  GalleryItem,
  WeekendBanner,
  Post,
  Review,
  SiteSettings,
  Trip,
} from "./types";

const contentDir = path.join(process.cwd(), "content");

function readFile<T>(name: string): T {
  const file = path.join(contentDir, name);
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeFile(name: string, data: unknown) {
  const file = path.join(contentDir, name);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

// In the Realtime Database each list is a node keyed by item id (`/trips/{id}`), and `order` keeps the list's
// order. Settings live at `/site/settings`. The database drops empty lists, so they are restored on read.
type Item = { id: string };
const LISTS: Record<string, string[]> = {
  trips: ["gallery", "types", "highlights", "inclusions", "exclusions", "itinerary", "departures"],
};

async function readList<T extends Item>(name: string): Promise<T[]> {
  if (!usesDatabase()) return readFile<T[]>(`${name}.json`);
  const value = ((await database().ref(name).get()).val() ?? {}) as Record<string, T & { order?: number }>;
  return Object.values(value)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(({ order: _order, ...item }) => {
      void _order;
      for (const key of LISTS[name] ?? []) (item as Record<string, unknown>)[key] ??= [];
      return item as unknown as T;
    });
}

async function writeList<T extends Item>(name: string, items: T[]) {
  if (!usesDatabase()) return writeFile(`${name}.json`, items);
  const value = Object.fromEntries(items.map((item, order) => [item.id, { ...item, order }]));
  await database().ref(name).set(plain(value));
}

export async function getSettings(): Promise<SiteSettings> {
  if (!usesDatabase()) return readFile<SiteSettings>("settings.json");
  const value = (await database().ref("site/settings").get()).val() as SiteSettings | null;
  // Before the first upload, fall back to the settings shipped with the code.
  return value ?? readFile<SiteSettings>("settings.json");
}

export async function saveSettings(settings: SiteSettings) {
  if (!usesDatabase()) return writeFile("settings.json", settings);
  await database().ref("site/settings").set(plain(settings));
}

export const getTrips = () => readList<Trip>("trips");
export const saveTrips = (trips: Trip[]) => writeList("trips", trips);
export const getPosts = () => readList<Post>("posts");
export const savePosts = (posts: Post[]) => writeList("posts", posts);
export const getReviews = () => readList<Review>("reviews");
export const saveReviews = (reviews: Review[]) => writeList("reviews", reviews);
export const getFaqs = () => readList<Faq>("faqs");
export const saveFaqs = (faqs: Faq[]) => writeList("faqs", faqs);
export const getGallery = () => readList<GalleryItem>("gallery");
export const saveGallery = (items: GalleryItem[]) => writeList("gallery", items);
export const getWeekend = () => readList<WeekendBanner>("weekend");
export const saveWeekend = (items: WeekendBanner[]) => writeList("weekend", items);
export const getEnquiries = () => readList<Enquiry>("enquiries");
export const saveEnquiries = (enquiries: Enquiry[]) => writeList("enquiries", enquiries);

/** A new enquiry: one write, newest first, without rewriting the whole list. */
export async function addEnquiry(enquiry: Enquiry) {
  if (!usesDatabase()) return writeFile("enquiries.json", [enquiry, ...readFile<Enquiry[]>("enquiries.json")]);
  await database().ref(`enquiries/${enquiry.id}`).set(plain({ ...enquiry, order: -Date.now() }));
}

export async function publishedTrips() {
  return (await getTrips()).filter((trip) => trip.published);
}

export async function publishedPosts() {
  return (await getPosts())
    .filter((post) => post.published)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function publishedGallery() {
  return (await getGallery()).filter((item) => item.published);
}

export async function publishedWeekend() {
  return (await getWeekend()).filter((item) => item.published);
}

export async function publishedReviews() {
  return (await getReviews()).filter((review) => review.published);
}
