import { NextResponse } from "next/server";
import { getPosts, savePosts } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanPost } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const posts = await getPosts();
    if (!posts.some((post) => post.id === id)) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }
    const item = cleanPost(await request.json(), id, posts);
    await savePosts(posts.map((post) => (post.id === id ? item : post)));
    return NextResponse.json({ item });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  await savePosts((await getPosts()).filter((post) => post.id !== id));
  return NextResponse.json({ ok: true });
}
