// Saves the smaller copies the site's image loader expects (uploads/…/<name>_w<width>.webp) for every CMS
// upload in Firebase Storage that does not have them yet. Safe to run any number of times.
//   FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" node scripts/image-variants.mjs
import { cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const WIDTHS = [320, 640, 960, 1280, 1920]; // keep in step with lib/image-sizes.ts
const projectId = process.env.FIREBASE_PROJECT_ID || "pack-my-bags-1c85e";
const key = process.env.FIREBASE_SERVICE_ACCOUNT;
initializeApp({ projectId, ...(key ? { credential: cert(JSON.parse(key)) } : {}) });
const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`);

const [files] = await bucket.getFiles({ prefix: "uploads/" });
const names = new Set(files.map((f) => f.name));
const originals = files.filter((f) => f.name.endsWith(".webp") && !/_w\d+\.webp$/.test(f.name));
let made = 0;
for (const file of originals) {
  const missing = WIDTHS.filter((w) => !names.has(file.name.replace(/\.webp$/, `_w${w}.webp`)));
  if (!missing.length) continue;
  const [meta] = await file.getMetadata();
  const token = meta.metadata?.firebaseStorageDownloadTokens?.split(",")[0];
  if (!token) {
    console.warn("skipped (no download token):", file.name);
    continue;
  }
  const [data] = await file.download();
  await Promise.all(
    missing.map(async (w) => {
      const out = await sharp(data).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      await bucket.file(file.name.replace(/\.webp$/, `_w${w}.webp`)).save(out, {
        resumable: false,
        contentType: "image/webp",
        metadata: { cacheControl: "public, max-age=31536000, immutable", metadata: { firebaseStorageDownloadTokens: token } },
      });
    }),
  );
  made += missing.length;
  process.stdout.write(".");
}
console.log(`\n${originals.length} uploads checked, ${made} copies saved.`);
process.exit(0);
