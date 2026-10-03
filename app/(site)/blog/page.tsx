import type { Metadata } from "next";
import { Frame } from "@/components/frame";
import { JournalShelf } from "@/components/journal-shelf";
import { JournalStrip } from "@/components/journal-strip";
import { publishedPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes from Pack my bags on packing, pacing, and choosing a first group trip.",
};

export default async function BlogPage() {
  const posts = await publishedPosts();

  return (
    <Frame className="py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">Journal</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Stories from the desk</h1>
      <div className="short:hidden">
        <JournalShelf posts={posts} />
      </div>
      <div className="hidden short:block">
        <JournalStrip posts={posts} />
      </div>
    </Frame>
  );
}
