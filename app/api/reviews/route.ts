import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getReviews, saveReviews } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanReview } from "@/lib/validate";

export async function POST(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const reviews = await getReviews();
    const item = cleanReview(await request.json(), randomUUID());
    const items = [item, ...reviews];
    await saveReviews(items);
    return NextResponse.json({ item, items });
  } catch (error) {
    return fail(error);
  }
}
