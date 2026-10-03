import { NextResponse } from "next/server";
import { getWeekend, saveWeekend } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import type { WeekendBanner } from "@/lib/types";

/** Saves all weekend banners at once, in order. */
export async function PUT(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const body = (await request.json()) as { items?: Partial<WeekendBanner>[] };
    if (!Array.isArray(body.items)) throw new Error("Nothing to save.");
    const ids = new Set<string>();
    const items: WeekendBanner[] = body.items.map((raw, index) => {
      const image = String(raw.image ?? "").trim();
      if (!image) throw new Error(`Banner ${index + 1} has no image.`);
      const link = String(raw.link ?? "").trim();
      if (link && !link.startsWith("/") && !/^https?:\/\//.test(link)) throw new Error(`Banner ${index + 1}: the link must start with / or https://`);
      let id = String(raw.id ?? "").trim() || crypto.randomUUID();
      if (ids.has(id)) id = crypto.randomUUID();
      ids.add(id);
      return {
        id,
        image,
        title: String(raw.title ?? "").trim(),
        subtitle: String(raw.subtitle ?? "").trim(),
        link,
        published: raw.published !== false,
      };
    });
    await saveWeekend(items);
    return NextResponse.json({ items: await getWeekend() });
  } catch (error) {
    return fail(error);
  }
}
