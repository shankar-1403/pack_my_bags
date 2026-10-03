import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";

// Where the site keeps its content.
// - Deployed on Firebase App Hosting (Cloud Run sets K_SERVICE): Realtime Database, signed in automatically.
// - Anywhere with a service-account key in FIREBASE_SERVICE_ACCOUNT (the key file's JSON): Realtime Database.
// - Otherwise (a laptop without the key): the JSON files in /content, so local work needs no account.
// CONTENT_SOURCE=files or CONTENT_SOURCE=database forces one or the other.
export const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "pack-my-bags-1c85e";
// Copy this from Realtime Database → Data (the URL at the top) if it differs.
export const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || `https://${PROJECT_ID}-default-rtdb.asia-southeast1.firebasedatabase.app`;

export function usesDatabase() {
  const forced = process.env.CONTENT_SOURCE;
  if (forced === "files") return false;
  if (forced === "database") return true;
  return Boolean(process.env.K_SERVICE || process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

export function firebaseApp(): App {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT;
  const options = { projectId: PROJECT_ID, databaseURL: DATABASE_URL };
  return getApps()[0] ?? initializeApp(key ? { ...options, credential: cert(JSON.parse(key)) } : options);
}

export function database(): Database {
  return getDatabase(firebaseApp());
}

/** Realtime Database rejects `undefined` and drops empty lists; send plain JSON. */
export const plain = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
