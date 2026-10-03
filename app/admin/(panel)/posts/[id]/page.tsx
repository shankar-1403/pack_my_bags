import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getPosts } from "@/lib/content";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = (await getPosts()).find((item) => item.id === id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">Edit story</h1>
      <div className="mt-8 max-w-3xl"><PostForm post={post} /></div>
    </div>
  );
}
