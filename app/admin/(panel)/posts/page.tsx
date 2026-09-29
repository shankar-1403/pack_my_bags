import Link from "next/link";
import { getPosts } from "@/lib/content";

export default function AdminPostsPage() {
  const posts = getPosts();

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-5xl tracking-tight">Journal</h1>
        <Link href="/admin/posts/new" className="rounded-full bg-ink px-5 py-3 text-sm text-cream">New story</Link>
      </div>
      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-cream">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/admin/posts/${post.id}`} className="block px-5 py-4 hover:bg-sand/50">
              <span className="font-medium">{post.title}</span>
              <span className="mt-1 block text-sm text-mist">{post.publishedAt} · {post.published ? "Published" : "Draft"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
