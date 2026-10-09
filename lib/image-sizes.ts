// Serves every image at about the size it is shown, since Firebase App Hosting turns off Next's own image
// optimiser. Unsplash photos are resized by Unsplash itself; photos uploaded through the CMS have smaller
// copies saved next to them in Firebase Storage (see app/api/uploads and scripts/image-variants.mjs).

/** Widths saved for every CMS upload, as `<name>_w<width>.webp` beside the original. */
export const VARIANT_WIDTHS = [320, 640, 960, 1280, 1920] as const;

const STORAGE_UPLOAD = /^(https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/uploads%2F.+?)(\.webp)(\?alt=media.*)$/;

/** The URL of `src` at (at least) `width` pixels wide. Unknown sources are returned as they are. */
export function sizedImage(src: string, width: number, quality = 75): string {
  if (!src) return src;
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(Math.round(width)));
    url.searchParams.set("q", String(quality));
    if (!url.searchParams.has("auto")) url.searchParams.set("auto", "format");
    return url.toString();
  }
  const upload = src.match(STORAGE_UPLOAD);
  if (upload && !/_w\d+$/.test(upload[1])) {
    const variant = VARIANT_WIDTHS.find((w) => w >= width);
    return variant ? `${upload[1]}_w${variant}${upload[2]}${upload[3]}` : src;
  }
  return src;
}
