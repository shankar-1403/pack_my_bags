import fs from "fs";
import path from "path";
import type {
  Enquiry,
  Faq,
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

export function getSettings() {
  return readFile<SiteSettings>("settings.json");
}

export function saveSettings(settings: SiteSettings) {
  writeFile("settings.json", settings);
}

export function getTrips() {
  return readFile<Trip[]>("trips.json");
}

export function saveTrips(trips: Trip[]) {
  writeFile("trips.json", trips);
}

export function getPosts() {
  return readFile<Post[]>("posts.json");
}

export function savePosts(posts: Post[]) {
  writeFile("posts.json", posts);
}

export function getReviews() {
  return readFile<Review[]>("reviews.json");
}

export function saveReviews(reviews: Review[]) {
  writeFile("reviews.json", reviews);
}

export function getFaqs() {
  return readFile<Faq[]>("faqs.json");
}

export function saveFaqs(faqs: Faq[]) {
  writeFile("faqs.json", faqs);
}

export function getEnquiries() {
  return readFile<Enquiry[]>("enquiries.json");
}

export function saveEnquiries(enquiries: Enquiry[]) {
  writeFile("enquiries.json", enquiries);
}

export function publishedTrips() {
  return getTrips().filter((trip) => trip.published);
}

export function publishedPosts() {
  return getPosts()
    .filter((post) => post.published)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function publishedReviews() {
  return getReviews().filter((review) => review.published);
}
