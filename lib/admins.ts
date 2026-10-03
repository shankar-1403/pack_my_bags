import "server-only";
import fs from "fs";
import path from "path";
import { getAuth } from "firebase-admin/auth";
import { database, firebaseApp, usesDatabase } from "./firebase";

/** A CMS user. In the Realtime Database at `/users/{uid}`, where uid is the user's Firebase Authentication UID. */
export type Admin = {
  email: string;
  name: string;
  active: boolean;
  createdAt?: string;
  lastLoginAt?: string;
};

/** Checks a Firebase sign-in and returns the uid when that person may use the CMS. */
export async function verifyAdmin(idToken: string): Promise<{ uid: string } | { error: string }> {
  let decoded;
  try {
    decoded = await getAuth(firebaseApp()).verifyIdToken(idToken);
  } catch {
    return { error: "Sign-in expired. Try again." };
  }
  const { uid, email = "" } = decoded;

  if (usesDatabase()) {
    const ref = database().ref(`users/${uid}`);
    const admin = (await ref.get()).val() as Admin | null;
    if (!admin || admin.active !== true) return { error: "This account does not have access to the CMS." };
    await ref.update({ lastLoginAt: new Date().toISOString() });
    return { uid };
  }

  // Without the database (a laptop with no key): the allow-list in content/admins.json, matched by uid or email.
  const file = path.join(process.cwd(), "content", "admins.json");
  const list = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as (Admin & { uid?: string })[]) : [];
  const match = list.find((a) => a.active === true && (a.uid === uid || (email && a.email.toLowerCase() === email.toLowerCase())));
  return match ? { uid } : { error: "This account does not have access to the CMS." };
}
