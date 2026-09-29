import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types";

export function JournalStrip({ posts }: { posts: Post[] }) {
  const [feature, ...rest] = posts;
  if (!feature) return null;

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:grid-rows-2">
      <Link
        href={`/blog/${feature.slug}`}
        className="flex min-h-80 flex-col justify-between rounded-[28px] bg-pine p-7 text-cream lg:row-span-2 lg:min-h-0 lg:p-9"
      >
        <span className="font-header text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0c7b0]">
          {feature.readMinutes} min read
        </span>
        <span>
          <span className="block font-serif text-4xl leading-[1.02] tracking-tight sm:text-5xl">{feature.title}</span>
          <span className="mt-4 block max-w-md text-sm leading-6 text-cream/70">{feature.excerpt}</span>
          <span className="mt-6 inline-flex rounded-full bg-cream px-4 py-2 font-header text-sm font-semibold text-ink">
            Read story
          </span>
        </span>
      </Link>
      {rest.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`} className="group relative min-h-48 overflow-hidden rounded-[28px]">
          <Image
            src={post.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-r from-pine/80 via-pine/35 to-transparent" />
          <span className="absolute inset-y-0 left-0 flex max-w-xs flex-col justify-end p-5 text-cream">
            <span className="font-header text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/70">{post.readMinutes} min read</span>
            <span className="mt-2 font-serif text-2xl leading-tight tracking-tight">{post.title}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
