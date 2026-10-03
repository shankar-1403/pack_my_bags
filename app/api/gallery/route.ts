import { NextResponse } from "next/server";
import { getGallery, saveGallery } from "@/lib/content";
import { denyIfGuest, fail } from "@/lib/guard";
import type { GalleryItem } from "@/lib/types";

/** Saves the whole gallery at once (the CMS edits it as one ordered list). */
export async function PUT(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const body = (await request.json()) as { items?: Partial<GalleryItem>[] };
    if (!Array.isArray(body.items)) throw new Error("Nothing to save.");
    const ids = new Set<string>();
    const items: GalleryItem[] = body.items.map((raw, index) => {
      const image = String(raw.image ?? "").trim();
      const place = String(raw.place ?? "").trim();
      if (!image) throw new Error(`Photo ${index + 1} has no image.`);
      if (!place) throw new Error(`Photo ${index + 1} needs a place name — it is written on the print.`);
      let id = String(raw.id ?? "").trim() || crypto.randomUUID();
      if (ids.has(id)) id = crypto.randomUUID();
      ids.add(id);
      return { id, image, place, region: String(raw.region ?? "").trim(), published: raw.published !== false };
    });
    await saveGallery(items);
    return NextResponse.json({ items: await getGallery() });
  } catch (error) {
    return fail(error);
  }
}
