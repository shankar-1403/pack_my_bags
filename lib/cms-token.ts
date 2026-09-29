import { createHmac, timingSafeEqual } from "crypto";

export const CMS_COOKIE = "tripsody_cms";

function secret() {
  return process.env.CMS_SECRET || "tripsody-local-secret";
}

export function cmsToken() {
  return createHmac("sha256", secret()).update("tripsody-cms-session").digest("hex");
}

export function cmsPassword() {
  return process.env.CMS_PASSWORD || "tripsody";
}

export function passwordsMatch(input: string) {
  const expected = cmsPassword();
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
