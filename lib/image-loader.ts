"use client";

import { sizedImage } from "./image-sizes";

/** next/image loader (see next.config.ts): asks for a copy about as wide as the image is shown. */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("/")) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  const sized = sizedImage(src, width, quality ?? 75);
  // Next expects the URL to change with the width; sources without sizes just carry it along harmlessly.
  return sized === src ? `${src}${src.includes("#") ? "" : `#w${width}`}` : sized;
}
