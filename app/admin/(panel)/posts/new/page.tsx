import { PostForm } from "@/components/admin/post-form";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-serif text-5xl tracking-tight">New story</h1>
      <div className="mt-8 max-w-3xl"><PostForm post={null} /></div>
    </div>
  );
}
