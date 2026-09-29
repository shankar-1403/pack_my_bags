import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Frame } from "@/components/frame";
import { publishedPosts } from "@/lib/content";

type Context = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const post = publishedPosts().find((item) => item.slug === slug);
  return { title: post?.title ?? "Journal", description: post?.excerpt };
}

export default async function PostPage({ params }: Context) {
  const { slug } = await params;
  const post = publishedPosts().find((item) => item.slug === slug);
  if (!post) notFound();
  const paragraphs = post.body.split(/\n\n+/);

  return (
    <Frame className="py-12">
    <article className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.18em] text-clay">{post.author}</p>
      <h1 className="mt-3 font-serif text-5xl leading-[1] tracking-tight">{post.title}</h1>
      <p className="mt-4 text-sm text-mist">
        {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {post.readMinutes} min read
      </p>
      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[28px]">
        <Image src={post.image} alt="" fill priority className="object-cover" sizes="(min-width: 768px) 720px, 100vw" />
      </div>
      <div className="mt-8 space-y-5 text-lg leading-8 text-ink/85">
        {paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>
    </article>
    </Frame>
  );
}
