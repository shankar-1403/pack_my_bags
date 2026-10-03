import { createHmac, timingSafeEqual } from "crypto";

// The CMS session cookie: `uid.expiry.signature`, signed with CMS_SECRET so it cannot be forged.
export const CMS_COOKIE = "pmb_cms";
export const SESSION_DAYS = 14;

function secret() {
  return process.env.CMS_SECRET || "packmybags-local-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSession(uid: string) {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${uid}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** The signed-in admin's uid, or null when the cookie is missing, forged, or expired. */
export function readSession(value: string | undefined) {
  if (!value) return null;
  const [uid, expires, signature] = value.split(".");
  if (!uid || !expires || !signature) return null;
  const expected = Buffer.from(sign(`${uid}.${expires}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expires) < Date.now()) return null;
  return uid;
}
