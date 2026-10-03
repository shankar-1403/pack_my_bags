import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { Frame } from "@/components/frame";
import { PolaroidTable, type Print } from "@/components/polaroid-table";
import { publishedTrips } from "@/lib/content";

export const metadata: Metadata = { title: "Gallery" };

// Marker-pen captions on the white border, as written by hand on the back of a trip.
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-hand" });

export default function GalleryPage() {
  // Every destination first, then further trips to the same places, each with its own photo.
  const trips = publishedTrips();
  const firsts = trips.filter((trip, i) => trips.findIndex((other) => other.destination === trip.destination) === i);
  const photos = new Set(firsts.map((trip) => trip.image));
  const extras = trips.filter((trip) => !firsts.includes(trip) && !photos.has(trip.image) && photos.add(trip.image));
  // A few more scenes from the road while the gallery's own photos are on their way.
  const scenes = [
    { destination: "Jaisalmer", region: "Thar Desert", image: "https://images.unsplash.com/photo-1624664929067-5bc278a7c57e?auto=format&fit=crop&w=900&q=80" },
    { destination: "Cherrapunji", region: "Meghalaya", image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80" },
    { destination: "Almaty", region: "Tian Shan", image: "https://images.unsplash.com/photo-1659651117607-d2b397cf100f?auto=format&fit=crop&w=900&q=80" },
    { destination: "Agra", region: "Uttar Pradesh", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80" },
    { destination: "Goa", region: "Konkan coast", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80" },
    { destination: "Annapurna", region: "Nepal", image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80" },
    { destination: "Dolomites", region: "Italy", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80" },
  ].filter((scene) => !photos.has(scene.image));
  const prints: Print[] = [...firsts, ...extras, ...scenes].slice(0, 22).map((trip) => ({ place: trip.destination, region: trip.region, photo: trip.image }));

  return (
    <Frame className={`py-12 lg:motion-safe:pt-3 ${hand.variable}`}>
      <PolaroidTable prints={prints} />
    </Frame>
  );
}
