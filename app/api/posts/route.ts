import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getPosts, savePosts } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanPost } from "@/lib/validate";

export async function POST(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const posts = getPosts();
    const item = cleanPost(await request.json(), randomUUID(), posts);
    posts.unshift(item);
    savePosts(posts);
    return NextResponse.json({ item });
  } catch (error) {
    return fail(error);
  }
}
