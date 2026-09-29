import { NextResponse } from "next/server";
import { getReviews, saveReviews } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanReview } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const reviews = getReviews();
    if (!reviews.some((review) => review.id === id)) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }
    const item = cleanReview(await request.json(), id);
    const items = reviews.map((review) => (review.id === id ? item : review));
    saveReviews(items);
    return NextResponse.json({ item, items });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const items = getReviews().filter((review) => review.id !== id);
  saveReviews(items);
  return NextResponse.json({ items });
}
