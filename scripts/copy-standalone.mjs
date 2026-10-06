// After `next build` (output: "standalone"), copy what the standalone server does not bundle by itself:
// public/ (logo, images), .next/static (CSS, JS, fonts) and content/ (starting data the site can fall back
// to). Without this, Firebase App Hosting serves the pages but every image and asset is missing.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.warn("Standalone output not found; skipping copy.");
  process.exit(0);
}

for (const [from, to] of [
  ["public", "public"],
  [join(".next", "static"), join(".next", "static")],
  ["content", "content"],
]) {
  const source = join(root, from);
  if (!existsSync(source)) continue;
  const target = join(standalone, to);
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

console.log("Copied public/, .next/static and content/ into the standalone output.");
