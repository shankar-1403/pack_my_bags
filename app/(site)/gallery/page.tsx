import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { Frame } from "@/components/frame";
import { PolaroidTable, type Print } from "@/components/polaroid-table";
import { publishedGallery } from "@/lib/content";

export const metadata: Metadata = { title: "Gallery" };

// Marker-pen captions on the white border, as written by hand on the back of a trip.
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-hand" });

export default async function GalleryPage() {
  // The prints come from CMS → Gallery, in that order.
  const items = await publishedGallery();
  const prints: Print[] = items.slice(0, 22).map((item) => ({ place: item.place, region: item.region, photo: item.image }));

  return (
    <Frame className={`py-12 lg:motion-safe:pt-3 ${hand.variable}`}>
      {prints.length ? (
        <PolaroidTable prints={prints} />
      ) : (
        <p className="py-24 text-center text-lg text-ink/60">Photos from the road are on their way.</p>
      )}
    </Frame>
  );
}
