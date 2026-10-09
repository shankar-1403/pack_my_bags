import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getStorage } from "firebase-admin/storage";
import { firebaseApp, PROJECT_ID, usesDatabase } from "@/lib/firebase";
import { denyIfGuest, fail } from "@/lib/guard";
import { VARIANT_WIDTHS } from "@/lib/image-sizes";

const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"];
/** Smaller WebP copies of an image, one per VARIANT_WIDTHS entry (never enlarged). */
async function variants(image: Buffer): Promise<[number, Buffer][]> {
  return Promise.all(
    VARIANT_WIDTHS.map(async (w): Promise<[number, Buffer]> => [w, await sharp(image).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()]),
  );
}

export const BUCKET = process.env.FIREBASE_STORAGE_BUCKET || `${PROJECT_ID}.firebasestorage.app`;

/**
 * CMS photo upload. Every image is turned the right way up, scaled to at most 2400 px wide and saved as WebP.
 * Live (and with a key): Firebase Storage, served by a long-lived download link. Without a key: /public/uploads.
 */
export async function POST(request: Request) {
  const denied = await denyIfGuest();
  if (denied) return denied;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Choose an image to upload.");
    if (!ACCEPTED.includes(file.type)) throw new Error("Use a JPG, PNG, WebP, AVIF, GIF or HEIC image.");
    if (file.size > MAX_BYTES) throw new Error("That image is over 15 MB. Pick a smaller one.");

    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { failOn: "error" }).rotate().resize({ width: 2400, withoutEnlargement: true });
    const output = await image.webp({ quality: 82 }).toBuffer();
    const { width, height } = await sharp(output).metadata();
    const date = new Date();
    const name = `uploads/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;

    if (!usesDatabase()) {
      const target = path.join(process.cwd(), "public", name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, output);
      for (const [w, data] of await variants(output)) fs.writeFileSync(target.replace(/\.webp$/, `_w${w}.webp`), data);
      return NextResponse.json({ url: `/${name}`, width, height });
    }

    // The original plus smaller copies (same download token) that the site's image loader picks between.
    const token = randomUUID();
    const bucket = getStorage(firebaseApp()).bucket(BUCKET);
    const save = (file: string, data: Buffer) =>
      bucket.file(file).save(data, {
        resumable: false,
        contentType: "image/webp",
        metadata: { cacheControl: "public, max-age=31536000, immutable", metadata: { firebaseStorageDownloadTokens: token } },
      });
    const copies = await variants(output);
    await Promise.all([save(name, output), ...copies.map(([w, data]) => save(name.replace(/\.webp$/, `_w${w}.webp`), data))]);
    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
    return NextResponse.json({ url, width, height });
  } catch (error) {
    if (error instanceof Error && /unsupported image format|Input buffer/i.test(error.message)) {
      return fail(new Error("That file could not be read as an image."));
    }
    return fail(error);
  }
}
