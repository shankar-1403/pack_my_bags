# Firebase handover — PackMyBags

Everything the Firebase account owner needs. The code is done; nothing below needs code changes.

| | |
|---|---|
| Project ID | `pack-my-bags-1c85e` |
| Hosting | Firebase **App Hosting**, backend `packmybags` (see `firebase.json`, `apphosting.yaml`) |
| Database | **Realtime Database** (default instance) |
| Database URL | `https://pack-my-bags-1c85e-default-rtdb.asia-southeast1.firebasedatabase.app` (Singapore) |
| Sign-in | Firebase **Authentication**, Email/Password |
| Server SDK | `firebase-admin` (server only — browsers never touch the database) |

---

## 1. Setup steps

1. **Create the Realtime Database**: console → Build → Realtime Database → Create database → *locked mode*. Copy the URL shown at the top of the Data tab.
2. **Publish the rules** (file `database.rules.json`: all browser access denied; the site's server is not affected by rules):
   ```
   firebase login
   firebase deploy --only database
   ```
   or paste the contents of `database.rules.json` into Realtime Database → Rules → Publish.
3. **Turn on CMS sign-in**:
   - Authentication → Sign-in method → enable **Email/Password**.
   - Authentication → Users → **Add user** for each person. Copy their **User UID**.
   - Realtime Database → Data → add **`users` → `{User UID}`** with children:
     `email` (string), `name` (string), `active` (`true`), `createdAt` (string, ISO time), `lastLoginAt` (string, `""`).
   - Create the session secret: `firebase apphosting:secrets:set CMS_SECRET` (any long random string), then add it to `apphosting.yaml` (section 3).
   - **The web API key in `lib/firebase-client.ts` was reported as *suspended* by Google on 3 Oct 2026.** Check it in Google Cloud console → APIs & Services → Credentials (restore it, or create a new browser key restricted to the site's domains and paste it into `lib/firebase-client.ts`). Sign-in fails until this is fixed.
4. **Upload the current content** — easiest way, no key needed: Realtime Database → Data → ⋮ menu → **Import JSON** → choose `database-import.json` from the repo. It does not include `users`, so existing logins are kept only if you import into the root carefully — prefer the script below. Import replaces everything in the database, so only use it on an empty database.
   Or with a key: console → Project settings → Service accounts → *Generate new private key* → save as `service-account.json` in the repo root (git-ignored — never commit it), then:
   ```
   FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" node scripts/upload-database.mjs
   ```
   After launch, add `--keep-enquiries` so real enquiries are never overwritten. The script never touches `users`.
5. **Deploy**: `firebase deploy --only apphosting` (or push to the branch App Hosting watches). If the database URL differs from the default, add `FIREBASE_DATABASE_URL` to `apphosting.yaml` first.

---

## 2. Database layout

```
/
├── trips/{tripId}          one trip per id
├── posts/{postId}          journal stories
├── reviews/{reviewId}
├── faqs/{faqId}
├── gallery/{photoId}      prints on the Gallery page
├── enquiries/{enquiryId}   form submissions
├── site/
│   └── settings            phone, email, address, promo bar…
└── users/{uid}            CMS users (uid = Firebase Authentication User UID)
```

| Path | Key | Holds | Written by |
|---|---|---|---|
| `trips` | the trip's `id` (UUID) | Destinations / trips | CMS → Destinations |
| `posts` | the post's `id` | Journal stories | CMS → Journal |
| `reviews` | the review's `id` | Traveller reviews | CMS → Reviews |
| `faqs` | the FAQ's `id` | Site-wide FAQs | CMS → FAQs |
| `gallery` | the photo's `id` | Gallery page prints | CMS → Gallery |
| `enquiries` | the enquiry's `id` | Contact / trip form submissions | Website forms; CMS → Enquiries |
| `site/settings` | fixed | Site settings | CMS → Settings |
| `users` | the user's **UID** | Who may use the CMS | You, in the console |

**Every item under the five lists also has `order` (number)** — the site sorts by it (lowest first).
New enquiries get a negative `order` so the newest shows first.
Lists inside an item (e.g. `highlights`) are stored as the database stores arrays (`0`, `1`, `2`… keys); empty lists simply don't appear.

Dates are strings: `YYYY-MM-DD` for calendar dates, full ISO (`2026-10-03T10:15:00.000Z`) for timestamps.
Fields marked *optional* may be missing.

### `trips`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as its key |
| `slug` | string | Web address: `/trips/{slug}`. Unique |
| `title` | string | |
| `destination` | string | Groups trips on the site, e.g. `Spiti Valley` |
| `region` | string | e.g. `Himachal Pradesh` |
| `summary` | string | One or two lines for cards |
| `description` | string | Long text, line breaks kept |
| `image` | string | Cover image URL (https) |
| `gallery` | string[] | Image URLs |
| `days` | number | |
| `nights` | number | |
| `price` | number | Rupees, e.g. `24499` |
| `originalPrice` | number | Higher than `price` shows a "₹X off" tag |
| `types` | string[] | Any of `domestic`, `international`, `weekend`, `bike`, `spiritual`, `group` |
| `highlights` | string[] | |
| `inclusions` | string[] | |
| `exclusions` | string[] | |
| `itinerary` | map[] | `{ day: number, title: string, description: string, meals?: string, stay?: string, image?: string }` |
| `departures` | string[] | Display labels like `10 Oct 2026` (generated from `slots` when present) |
| `featured` | boolean | Shown on the home page |
| `published` | boolean | Hidden from visitors when `false` |
| `slots` | map[] *optional* | Dated batches: `{ date: "YYYY-MM-DD", endDate?: "YYYY-MM-DD", seats: number, seatsLeft: number, status: "open" \| "filling" \| "sold-out" \| "cancelled", price?: number, note?: string }` |
| `tagline` | string *optional* | Line under the title |
| `badge` | string *optional* | e.g. `Bestseller` on cards |
| `difficulty` | string *optional* | `easy`, `moderate`, `challenging` or `strenuous` |
| `groupMin`, `groupMax` | number *optional* | Group size |
| `ageMin`, `ageMax` | number *optional* | |
| `startCity`, `endCity` | string *optional* | |
| `pickup` | string *optional* | |
| `bestSeason` | string *optional* | e.g. `Oct – Mar` |
| `maxAltitude` | string *optional* | e.g. `4,550 m` |
| `priceNote` | string *optional* | e.g. `per person · twin share` |
| `bookingAmount` | number *optional* | Amount that holds a seat |
| `singleSupplement` | number *optional* | Single-room extra |
| `thingsToCarry` | string[] *optional* | |
| `cancellationPolicy` | string *optional* | |
| `faqs` | map[] *optional* | `{ question: string, answer: string }` — this trip only |
| `imageAlt` | string *optional* | Cover image description |
| `mapUrl` | string *optional* | Google Maps link |
| `seoTitle`, `seoDescription`, `ogImage` | string *optional* | Search and sharing |
| `sortOrder` | number *optional* | Reserved |
| `updatedAt` | string *optional* | ISO timestamp of last CMS save |
| `order` | number | List position (see above) |

### `posts`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as its key |
| `slug` | string | `/blog/{slug}`. Unique |
| `title` | string | |
| `excerpt` | string | |
| `body` | string | Paragraphs separated by blank lines |
| `image` | string | Cover image URL |
| `author` | string | Default `Pack my bags desk` |
| `publishedAt` | string | `YYYY-MM-DD` |
| `readMinutes` | number | |
| `published` | boolean | |
| `order` | number | |

### `reviews`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as its key |
| `name` | string | Traveller's name |
| `trip` | string | Trip name as written in the review |
| `quote` | string | |
| `rating` | number | 1–5 |
| `published` | boolean | |
| `order` | number | |

### `faqs`

| Field | Type |
|---|---|
| `id` | string |
| `question` | string |
| `answer` | string |
| `order` | number |

### `gallery`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as its key |
| `image` | string | Photo URL (uploaded to Storage) |
| `place` | string | Written on the print |
| `region` | string | Optional |
| `published` | boolean | Hidden when `false` |
| `order` | number | Position on the table |

### Photos (Firebase Storage)
CMS uploads go to the bucket `pack-my-bags-1c85e.firebasestorage.app` under `uploads/YYYY/MM/{uuid}.webp`
(resized to ≤ 2400 px, WebP). The site saves a download-token link, so Storage rules can stay fully locked:
```
rules_version = '2';
service firebase.storage { match /b/{bucket}/o { match /{allPaths=**} { allow read, write: if false; } } }
```

### `enquiries`

| Field | Type | Notes |
|---|---|---|
| `id` | string | Same as its key |
| `name` | string | Letters only, 2+ characters |
| `email` | string | |
| `phone` | string | 10 digits, or 12 with country code |
| `message` | string | 10+ characters |
| `tripSlug` | string | Empty when sent from the Contact page |
| `tripTitle` | string | |
| `departure` | string | Chosen date label; may end in `(waitlist)` |
| `createdAt` | string | ISO timestamp |
| `status` | string | `new` or `contacted` |
| `order` | number | Negative timestamp for new ones (newest first) |

### `site/settings`

| Field | Type | Example |
|---|---|---|
| `name` | string | `Pack my bags` |
| `tagline` | string | |
| `phone` | string | `+91 89601 60190` |
| `whatsapp` | string | Digits only: `918960160190` |
| `email` | string | `info@packmybags.in` |
| `address` | string | Studio address |
| `promo` | string | Orange bar at the top of every page; empty hides it |

---

## 3. Environment variables and secrets

| Name | Where | Required | What it does |
|---|---|---|---|
| `CMS_SECRET` | App Hosting secret | **Yes, before launch** | Long random string that signs the CMS login cookie |
| `FIREBASE_SERVICE_ACCOUNT` | Local only (`.env.local` or shell) | No | Service-account key JSON, to use the database from a laptop or run the upload script |
| `FIREBASE_DATABASE_URL` | App Hosting env / local | Only if not the default URL | Realtime Database URL |
| `FIREBASE_PROJECT_ID` | Optional | No | Defaults to `pack-my-bags-1c85e` |
| `CONTENT_SOURCE` | Optional | No | `database` or `files` to force a data source |

On App Hosting the server signs in to the database automatically (no key needed). Add the secret to `apphosting.yaml` **after** creating it in step 1.3:

```yaml
env:
  - variable: CMS_SECRET
    secret: CMS_SECRET
```

### Where the site reads data from
- Deployed on App Hosting → Realtime Database.
- Locally with `FIREBASE_SERVICE_ACCOUNT` set → Realtime Database.
- Locally without it → the JSON files in `/content` (no account needed).

### `users` (CMS logins)

| Field | Type | Notes |
|---|---|---|
| *(key)* | — | The person's **User UID** from Authentication |
| `email` | string | Same email as in Authentication |
| `name` | string | |
| `active` | boolean | `true` to allow; `false` blocks access without deleting the user |
| `createdAt` | string | ISO time |
| `lastLoginAt` | string | Written by the site at each sign-in |

Passwords live only in Firebase Authentication, never in the database. Without the database (a laptop with no key),
the allow-list is `content/admins.json`: `[{ "email": "...", "name": "...", "active": true }]`.

### Files involved
`lib/firebase.ts` (connection), `lib/admins.ts` + `lib/firebase-client.ts` + `app/api/auth/login` (CMS sign-in), `lib/content.ts` (all reads/writes), `lib/types.ts` (the shapes above),
`database.rules.json`, `scripts/upload-database.mjs`, `content/*.json` (starting data).

## Images on App Hosting
- App Hosting does not run Next's image optimiser (`/_next/image` returns 404 there), so `next.config.ts`
  sets `images.unoptimized: true` and photos load straight from Firebase Storage / Unsplash.
- The 3D intros draw photos into WebGL, which needs cross-origin access. `storage.cors.json` allows GET from
  any origin on the bucket; it has been applied. To re-apply: `gsutil cors set storage.cors.json gs://pack-my-bags-1c85e.firebasestorage.app`.
