"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Post } from "@/lib/types";
import { Field, inputClass } from "./fields";
import { ImageUpload } from "./image-upload";

export function PostForm({ post }: { post: Post | null }) {
  const [image, setImage] = useState(post?.image ?? "");
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      id: post?.id,
      title: form.get("title"),
      slug: form.get("slug"),
      excerpt: form.get("excerpt"),
      body: form.get("body"),
      image: form.get("image"),
      author: form.get("author"),
      publishedAt: form.get("publishedAt"),
      readMinutes: Number(form.get("readMinutes")),
      published: form.get("published") === "on",
    };
    const response = await fetch(post ? `/api/posts/${post.id}` : "/api/posts", {
      method: post ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; item?: Post } | null;
    setSaving(false);
    if (!response.ok || !data?.item) {
      setError(data?.error || "Could not save the story.");
      return;
    }
    router.push("/admin/posts");
    router.refresh();
  }

  async function onDelete() {
    if (!post || !confirm(`Delete ${post.title}?`)) return;
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="Title"><input name="title" required defaultValue={post?.title} className={inputClass} /></Field>
      <Field label="Slug"><input name="slug" defaultValue={post?.slug} className={inputClass} /></Field>
      <Field label="Excerpt"><textarea name="excerpt" rows={2} defaultValue={post?.excerpt} className={inputClass} /></Field>
      <Field label="Body, blank line between paragraphs"><textarea name="body" rows={12} required defaultValue={post?.body} className={inputClass} /></Field>
      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-mist">Cover photo</span>
        <div className="max-w-md">
          <ImageUpload value={image} onChange={setImage} label="Upload the story photo" required />
        </div>
        <input type="hidden" name="image" value={image} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Author"><input name="author" defaultValue={post?.author ?? "PackMyBags desk"} className={inputClass} /></Field>
        <Field label="Published date"><input name="publishedAt" type="date" defaultValue={post?.publishedAt?.slice(0, 10)} className={inputClass} /></Field>
        <Field label="Read minutes"><input name="readMinutes" type="number" min={1} defaultValue={post?.readMinutes ?? 5} className={inputClass} /></Field>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published ?? true} /> Published
      </label>
      {error ? <p className="text-sm text-[#f94f18]">{error}</p> : null}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-ink px-5 py-3 text-sm text-cream disabled:opacity-60">
          {saving ? "Saving…" : "Save story"}
        </button>
        {post ? <button type="button" onClick={onDelete} className="rounded-full border border-line px-5 py-3 text-sm text-[#f94f18]">Delete</button> : null}
      </div>
    </form>
  );
}
