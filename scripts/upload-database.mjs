// Copies the content in /content into the Realtime Database (project pack-my-bags-1c85e).
// Run once after the database is created, and again whenever you want it to match the files:
//   FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" node scripts/upload-database.mjs
// The database lives in asia-southeast1; set FIREBASE_DATABASE_URL only if that changes.
// Add --keep-enquiries to leave enquiries already in the database untouched (do this once the site is live).
// Never touches /users (the CMS logins).
import fs from "fs";
import path from "path";
import { cert, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

const projectId = process.env.FIREBASE_PROJECT_ID || "pack-my-bags-1c85e";
const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`;
const key = process.env.FIREBASE_SERVICE_ACCOUNT;
initializeApp({ projectId, databaseURL, ...(key ? { credential: cert(JSON.parse(key)) } : {}) });
const db = getDatabase();

const dir = path.join(process.cwd(), "content");
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
const keepEnquiries = process.argv.includes("--keep-enquiries");

await db.ref("site/settings").set(read("settings.json"));
console.log("site/settings");
for (const name of ["trips", "posts", "reviews", "faqs", "enquiries"]) {
  if (name === "enquiries" && keepEnquiries) continue;
  const items = read(`${name}.json`);
  const value = Object.fromEntries(items.map((item, order) => [item.id, { ...item, order }]));
  await db.ref(name).set(JSON.parse(JSON.stringify(value)));
  console.log(`${name}: ${items.length}`);
}
console.log("Done.");
process.exit(0);
