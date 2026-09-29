import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getFaqs, saveFaqs } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanFaq } from "@/lib/validate";

export async function POST(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const faqs = getFaqs();
    const item = cleanFaq(await request.json(), randomUUID());
    const items = [...faqs, item];
    saveFaqs(items);
    return NextResponse.json({ item, items });
  } catch (error) {
    return fail(error);
  }
}
