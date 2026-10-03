import { NextResponse } from "next/server";
import { getFaqs, saveFaqs } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import { cleanFaq } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const faqs = await getFaqs();
    if (!faqs.some((faq) => faq.id === id)) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    const item = cleanFaq(await request.json(), id);
    const items = faqs.map((faq) => (faq.id === id ? item : faq));
    await saveFaqs(items);
    return NextResponse.json({ item, items });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  const { id } = await context.params;
  const items = (await getFaqs()).filter((faq) => faq.id !== id);
  await saveFaqs(items);
  return NextResponse.json({ items });
}
