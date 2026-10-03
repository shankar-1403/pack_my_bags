// The destination form as a document: one definition that writes the downloadable form (blank or filled
// from a trip) and reads a filled form back into the CMS editor.
//
// Format, line by line:
//   Label: value                     single fields (Title, Price, Days…)
//   SECTION NAME                     a heading on its own line (HIGHLIGHTS, ITINERARY…)
//   - item                           list items under a list section
//   Day 1: Title                     starts a day in ITINERARY; "Meals:" / "Stay:" lines belong to that day
//   Q: question / A: answer          pairs under FAQS
//   10 Oct 2026 to 16 Oct 2026 | seats 12 | left 8 | status open | price 24499 | note …   under DEPARTURES
// Lines starting with "#" are guidance and are ignored.

import { DEPARTURE_STATUSES, DIFFICULTIES, TRIP_TYPES, dateLabel } from "./format";
import type { Departure, DepartureStatus, Difficulty, ItineraryDay, Trip, TripFaq, TripType } from "./types";

export type TripImport = Partial<
  Pick<
    Trip,
    | "title" | "slug" | "destination" | "region" | "tagline" | "badge" | "summary" | "description"
    | "days" | "nights" | "price" | "originalPrice" | "priceNote" | "bookingAmount" | "singleSupplement"
    | "types" | "difficulty" | "groupMin" | "groupMax" | "ageMin" | "ageMax" | "maxAltitude"
    | "startCity" | "endCity" | "bestSeason" | "pickup" | "mapUrl" | "highlights" | "inclusions"
    | "exclusions" | "thingsToCarry" | "itinerary" | "slots" | "faqs" | "cancellationPolicy"
    | "imageAlt" | "seoTitle" | "seoDescription"
  >
>;

export type ParseResult = { data: TripImport; found: string[]; warnings: string[] };

/* ----------------------------------------------------------------------------------------------- */
/* Writing                                                                                          */
/* ----------------------------------------------------------------------------------------------- */

export type Block =
  | { kind: "title"; text: string }
  | { kind: "note"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "field"; label: string; value: string }
  | { kind: "text"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "gap" };

const typeName = (id: string) => TRIP_TYPES.find((t) => t.id === id)?.label ?? id;
const statusName = (id: string) => DEPARTURE_STATUSES.find((s) => s.id === id)?.label ?? id;
const num = (n?: number) => (n || n === 0 ? String(n) : "");
const range = (a?: number, b?: number) => (a && b ? `${a}-${b}` : a ? String(a) : b ? `up to ${b}` : "");

/** The form as blocks. With no trip it is a blank form with an example in every guidance line. */
export function tripToBlocks(trip: Partial<Trip> | null): Block[] {
  const t = trip ?? {};
  const blank = !trip;
  const b: Block[] = [];
  const field = (label: string, value: string) => b.push({ kind: "field", label, value });
  const note = (text: string) => blank && b.push({ kind: "note", text });
  const heading = (text: string) => {
    b.push({ kind: "gap" });
    b.push({ kind: "heading", text });
  };
  const bullets = (items: string[] | undefined, example: string) => {
    if (items?.length) items.forEach((text) => b.push({ kind: "bullet", text }));
    else if (blank) b.push({ kind: "bullet", text: "" }, { kind: "note", text: `# Example: - ${example}` });
  };

  b.push({ kind: "title", text: "PackMyBags — Destination form" });
  b.push({
    kind: "note",
    text: "# Fill in after each colon, and add list items under each heading. Leave anything you don't know blank. Lines starting with # are guidance and can stay or go. Photos are added in the CMS, not here.",
  });

  heading("BASICS");
  field("Title", t.title ?? "");
  note("# Example: Winter Spiti Circuit");
  field("Web address", t.slug ?? "");
  note("# Optional. Made from the title if left blank, e.g. winter-spiti-circuit");
  field("Destination", t.destination ?? "");
  note("# Groups trips on the site, e.g. Spiti Valley");
  field("Region", t.region ?? "");
  field("Tagline", t.tagline ?? "");
  field("Badge", t.badge ?? "");
  note("# Optional label on cards, e.g. Bestseller");
  field("Days", num(t.days));
  field("Nights", num(t.nights));
  field("Trip types", (t.types ?? []).map(typeName).join(", "));
  note(`# Any of: ${TRIP_TYPES.map((x) => x.label).join(", ")}`);

  heading("PRICING");
  field("Price", num(t.price));
  note("# Rupees per person, e.g. 24499");
  field("Original price", num(t.originalPrice));
  note("# Optional. Higher than the price shows a discount tag");
  field("Price note", t.priceNote ?? "");
  field("Booking amount", num(t.bookingAmount));
  field("Single room supplement", num(t.singleSupplement));

  heading("TRIP FACTS");
  field("Difficulty", t.difficulty ? DIFFICULTIES.find((d) => d.id === t.difficulty)?.label ?? "" : "");
  note(`# One of: ${DIFFICULTIES.map((d) => d.label).join(", ")}`);
  field("Group size", range(t.groupMin, t.groupMax));
  note("# e.g. 6-14");
  field("Ages", range(t.ageMin, t.ageMax));
  note("# e.g. 18-50");
  field("Highest altitude", t.maxAltitude ?? "");
  field("Starts in", t.startCity ?? "");
  field("Ends in", t.endCity ?? "");
  field("Best season", t.bestSeason ?? "");
  field("Pickup point", t.pickup ?? "");
  field("Map link", t.mapUrl ?? "");

  heading("SUMMARY");
  note("# One or two lines for cards and the top of the trip page");
  b.push({ kind: "text", text: t.summary ?? "" });

  heading("DESCRIPTION");
  (t.description ?? "").split(/\n+/).forEach((text) => b.push({ kind: "text", text }));

  heading("HIGHLIGHTS");
  bullets(t.highlights, "Chicham bridge at golden hour");

  heading("DEPARTURES");
  note("# One line per date: start [to end] | seats 12 | left 8 | status Open / Filling fast / Sold out / Cancelled | price 24499 | note Diwali batch");
  if (t.slots?.length) {
    for (const s of t.slots) {
      const parts = [s.endDate ? `${dateLabel(s.date)} to ${dateLabel(s.endDate)}` : dateLabel(s.date), `seats ${s.seats}`, `left ${s.seatsLeft}`, `status ${statusName(s.status)}`];
      if (s.price) parts.push(`price ${s.price}`);
      if (s.note) parts.push(`note ${s.note}`);
      b.push({ kind: "bullet", text: parts.join(" | ") });
    }
  } else if (t.departures?.length) {
    t.departures.forEach((text) => b.push({ kind: "bullet", text }));
  } else if (blank) {
    b.push({ kind: "bullet", text: "" }, { kind: "note", text: "# Example: - 10 Oct 2026 to 16 Oct 2026 | seats 12 | left 12 | status Open" });
  }

  heading("ITINERARY");
  note("# Start each day with “Day 1: Title”. Write what happens below it, then optional Meals: and Stay: lines.");
  if (t.itinerary?.length) {
    t.itinerary.forEach((d, i) => {
      if (i) b.push({ kind: "gap" });
      b.push({ kind: "field", label: `Day ${i + 1}`, value: d.title });
      if (d.description) b.push({ kind: "text", text: d.description });
      if (d.meals) field("Meals", d.meals);
      if (d.stay) field("Stay", d.stay);
    });
  } else if (blank) {
    b.push({ kind: "field", label: "Day 1", value: "" });
    b.push({ kind: "note", text: "# Example: Day 1: Shimla arrival / Meet the group and walk Mall Road. / Meals: Dinner / Stay: Hotel, Shimla" });
  }

  heading("INCLUDED");
  bullets(t.inclusions, "Breakfast and dinner on travel days");
  heading("NOT INCLUDED");
  bullets(t.exclusions, "Flights");
  heading("THINGS TO CARRY");
  bullets(t.thingsToCarry, "Warm base layer");

  heading("FAQS");
  note("# Questions for this trip only. Q: on one line, A: on the next.");
  if (t.faqs?.length) {
    t.faqs.forEach((f, i) => {
      if (i) b.push({ kind: "gap" });
      field("Q", f.question);
      field("A", f.answer);
    });
  } else if (blank) {
    field("Q", "");
    field("A", "");
  }

  heading("CANCELLATION POLICY");
  (t.cancellationPolicy ?? "").split(/\n+/).forEach((text) => b.push({ kind: "text", text }));

  heading("SEARCH & SHARING");
  field("Search title", t.seoTitle ?? "");
  field("Search description", t.seoDescription ?? "");
  field("Cover photo description", t.imageAlt ?? "");

  return b;
}

export function blocksToText(blocks: Block[]) {
  return blocks
    .map((x) => {
      switch (x.kind) {
        case "title":
        case "heading":
        case "note":
        case "text":
          return x.text;
        case "field":
          return `${x.label}: ${x.value}`;
        case "bullet":
          return `- ${x.text}`;
        case "gap":
          return "";
      }
    })
    .join("\n");
}

/* ----------------------------------------------------------------------------------------------- */
/* Reading                                                                                          */
/* ----------------------------------------------------------------------------------------------- */

type Section =
  | "basics" | "summary" | "description" | "highlights" | "departures" | "itinerary" | "included"
  | "excluded" | "carry" | "faqs" | "policy";

const SECTIONS: [Section | "fields", string[]][] = [
  ["fields", ["basics", "basic details", "pricing", "price", "trip facts", "facts", "search & sharing", "search and sharing", "seo", "details", "trip details"]],
  ["summary", ["summary", "short summary", "overview"]],
  ["description", ["description", "about the trip", "about this trip", "trip description"]],
  ["highlights", ["highlights", "trip highlights"]],
  ["departures", ["departures", "dates", "departure dates", "batches"]],
  ["itinerary", ["itinerary", "day by day", "day-by-day", "how the days go", "day wise itinerary", "day-wise itinerary"]],
  ["included", ["included", "inclusions", "what's included", "whats included", "what is included"]],
  ["excluded", ["not included", "exclusions", "what's not included", "whats not included", "excluded"]],
  ["carry", ["things to carry", "what to pack", "packing list", "packing", "carry"]],
  ["faqs", ["faqs", "faq", "questions", "frequently asked questions"]],
  ["policy", ["cancellation policy", "cancellation", "refund policy", "cancellation & refund policy"]],
];

const FIELDS: [keyof TripImport | "duration" | "groupSize" | "ages" | "skip", string[]][] = [
  ["title", ["title", "trip name", "trip title", "name"]],
  ["slug", ["web address", "slug", "url", "link name"]],
  ["destination", ["destination", "place"]],
  ["region", ["region", "state", "country", "area"]],
  ["tagline", ["tagline", "subtitle", "one liner"]],
  ["badge", ["badge", "label", "tag"]],
  ["days", ["days", "no of days", "number of days"]],
  ["nights", ["nights", "no of nights", "number of nights"]],
  ["duration", ["duration", "trip length"]],
  ["types", ["trip types", "trip type", "types", "type", "category", "categories"]],
  ["price", ["price", "price (inr)", "price (₹)", "price inr", "cost", "trip price", "price per person"]],
  ["originalPrice", ["original price", "mrp", "was", "old price", "price before discount"]],
  ["priceNote", ["price note", "pricing note"]],
  ["bookingAmount", ["booking amount", "advance", "advance amount", "booking advance", "amount to hold a seat", "token amount"]],
  ["singleSupplement", ["single room supplement", "single supplement", "single room", "single occupancy"]],
  ["difficulty", ["difficulty", "difficulty level", "grade", "level"]],
  ["groupSize", ["group size", "group"]],
  ["groupMin", ["group size from", "minimum group size", "min group size"]],
  ["groupMax", ["group size up to", "maximum group size", "max group size"]],
  ["ages", ["ages", "age", "age group", "age range"]],
  ["ageMin", ["minimum age", "min age"]],
  ["ageMax", ["maximum age", "max age"]],
  ["maxAltitude", ["highest altitude", "max altitude", "maximum altitude", "altitude"]],
  ["startCity", ["starts in", "start city", "starting point", "start", "starts from", "start point"]],
  ["endCity", ["ends in", "end city", "ending point", "end", "ends at", "end point"]],
  ["bestSeason", ["best season", "season", "best time", "best time to visit"]],
  ["pickup", ["pickup point", "pickup", "pick up", "pick-up", "meeting point"]],
  ["mapUrl", ["map link", "map", "google maps", "maps link", "location link"]],
  ["summary", ["summary", "short summary", "overview"]],
  ["description", ["description", "about"]],
  ["cancellationPolicy", ["cancellation policy", "cancellation", "refund policy"]],
  ["seoTitle", ["search title", "seo title", "meta title"]],
  ["seoDescription", ["search description", "seo description", "meta description"]],
  ["imageAlt", ["cover photo description", "cover image description", "image description", "alt text"]],
];

const LABELS: Partial<Record<string, string>> = {
  title: "Title", slug: "Web address", destination: "Destination", region: "Region", tagline: "Tagline", badge: "Badge",
  days: "Days", nights: "Nights", types: "Trip types", price: "Price", originalPrice: "Original price", priceNote: "Price note",
  bookingAmount: "Booking amount", singleSupplement: "Single room supplement", difficulty: "Difficulty", groupMin: "Group size",
  groupMax: "Group size", ageMin: "Ages", ageMax: "Ages", maxAltitude: "Highest altitude", startCity: "Starts in", endCity: "Ends in",
  bestSeason: "Best season", pickup: "Pickup point", mapUrl: "Map link", summary: "Summary", description: "Description",
  highlights: "Highlights", inclusions: "Included", exclusions: "Not included", thingsToCarry: "Things to carry",
  itinerary: "Itinerary", slots: "Departures", faqs: "FAQs", cancellationPolicy: "Cancellation policy",
  seoTitle: "Search title", seoDescription: "Search description", imageAlt: "Cover photo description",
};

const clean = (s: string) => s.replace(/[   ]/g, " ").replace(/\s+/g, " ").trim();
const key = (s: string) => clean(s).toLowerCase().replace(/[*_:]+$/g, "").replace(/^[*_#\s]+/, "").trim();
const bullet = /^\s*(?:[-–—•*●◦▪]|\d+[.)])\s+/;

function sectionOf(line: string): Section | "fields" | null {
  const k = key(line);
  if (k.length > 40) return null;
  for (const [section, names] of SECTIONS) if (names.includes(k)) return section;
  return null;
}

function fieldOf(label: string) {
  const k = key(label);
  for (const [field, names] of FIELDS) if (names.includes(k)) return field;
  return null;
}

/** "₹24,499/-", "Rs. 24499", "24,499 INR" → 24499 */
function money(value: string) {
  const digits = value.replace(/(rs\.?|inr|₹|\/-|,|\s)/gi, "").match(/\d+(\.\d+)?/);
  return digits ? Math.round(Number(digits[0])) : undefined;
}

function int(value: string) {
  const m = value.match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

function pair(value: string): [number | undefined, number | undefined] {
  const nums = value.match(/\d+/g)?.map(Number) ?? [];
  if (/up\s*to|max|under|below/i.test(value) && nums.length === 1) return [undefined, nums[0]];
  return [nums[0], nums[1]];
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Dates as written in India: 10 Oct 2026, 10-Oct-26, 10/10/2026 (day first), 2026-10-10, Oct 10, 2026. */
function isoFrom(text: string): string | undefined {
  const t = text.trim();
  let m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = t.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${year}-${pad(+m[2])}-${pad(+m[1])}`;
  }
  m = t.match(/(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})[\s,-]+(\d{2,4})/i);
  if (m) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (month >= 0) return `${year}-${pad(month + 1)}-${pad(+m[1])}`;
  }
  m = t.match(/([a-z]{3,9})[\s-]+(\d{1,2})(?:st|nd|rd|th)?,?[\s-]+(\d{4})/i);
  if (m) {
    const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (month >= 0) return `${m[3]}-${pad(month + 1)}-${pad(+m[2])}`;
  }
  return undefined;
}

function parseDeparture(line: string, warnings: string[]): Departure | null {
  const parts = line.split(/\s*\|\s*/);
  const dates = parts[0].split(/\s+(?:to|till|until|–|—|-)\s+/i);
  const date = isoFrom(dates[0]);
  if (!date) {
    warnings.push(`Departure skipped — no date found in “${line}”`);
    return null;
  }
  const slot: Departure = { date, seats: 12, seatsLeft: 12, status: "open" };
  const end = dates[1] ? isoFrom(dates[1]) : undefined;
  if (end && end >= date) slot.endDate = end;
  let leftGiven = false;
  for (const part of parts.slice(1)) {
    const [, name = "", rest = ""] = part.match(/^\s*([a-z ]+?)\s*[:\-]?\s+(.+)$/i) ?? [];
    const k = name.toLowerCase();
    if (/^(seats?|total seats?|capacity)$/.test(k)) slot.seats = int(rest) ?? slot.seats;
    else if (/^(left|seats left|available|remaining)$/.test(k)) {
      slot.seatsLeft = int(rest) ?? slot.seatsLeft;
      leftGiven = true;
    } else if (k === "status") {
      const v = rest.toLowerCase();
      slot.status = (v.includes("sold") ? "sold-out" : v.includes("cancel") ? "cancelled" : v.includes("fill") ? "filling" : "open") as DepartureStatus;
    } else if (k === "price") slot.price = money(rest);
    else if (k === "note") slot.note = rest.trim();
  }
  if (!leftGiven) slot.seatsLeft = slot.status === "sold-out" ? 0 : slot.seats;
  slot.seatsLeft = Math.min(slot.seatsLeft, slot.seats);
  return slot;
}

/** Joins lines into running text, closing each with a full stop if it has none (bullets read as sentences). */
function sentence(before: string, next: string) {
  if (!before) return next;
  return `${/[.!?…:;]$/.test(before) ? before : `${before}.`} ${next}`;
}

function typesFrom(value: string): TripType[] {
  return value
    .split(/[,/&|]|\band\b/i)
    .map((v) => v.trim().toLowerCase())
    .map((v) => TRIP_TYPES.find((t) => t.id === v || t.label.toLowerCase() === v || (v && t.label.toLowerCase().startsWith(v)))?.id)
    .filter((v): v is TripType => Boolean(v));
}

function difficultyFrom(value: string): Difficulty | undefined {
  const v = value.toLowerCase();
  return DIFFICULTIES.find((d) => v.includes(d.id))?.id ?? (v.includes("moderate") ? "moderate" : v.includes("hard") || v.includes("difficult") ? "challenging" : undefined);
}

/** Reads a filled destination form (as plain text) into editor fields, with notes on anything skipped. */
export function parseTripDocument(raw: string): ParseResult {
  const data: TripImport = {};
  const warnings: string[] = [];
  const lists: Record<"highlights" | "inclusions" | "exclusions" | "thingsToCarry", string[]> = { highlights: [], inclusions: [], exclusions: [], thingsToCarry: [] };
  const text: Record<"summary" | "description" | "cancellationPolicy", string[]> = { summary: [], description: [], cancellationPolicy: [] };
  const days: ItineraryDay[] = [];
  const faqs: TripFaq[] = [];
  const slots: Departure[] = [];
  let section: Section | "fields" = "fields";
  let multiline: "summary" | "description" | "cancellationPolicy" | null = null;
  let faq: TripFaq | null = null;

  const lines = raw.replace(/\r/g, "").split("\n");
  for (const rawLine of lines) {
    const line = clean(rawLine);
    if (!line || line.startsWith("#") || /^packmybags\s*[—-]\s*destination form$/i.test(line)) continue;

    // A heading is a known section name on its own line ("ITINERARY" or "Itinerary:"), not "Summary: text".
    const heading = sectionOf(line);
    if (heading && (!line.includes(":") || /:\s*$/.test(line))) {
      section = heading;
      multiline = heading === "summary" ? "summary" : heading === "description" ? "description" : heading === "policy" ? "cancellationPolicy" : null;
      faq = null;
      continue;
    }

    const field = line.match(/^([^:]{1,48}?)\s*[:：]\s*(.*)$/);

    if (section === "itinerary") {
      const bare = line.replace(bullet, "");
      const dayLine = bare.match(/^day\s*(\d+)\s*[:.\-–—)]?\s*(.*)$/i);
      const itemField = bare.match(/^([^:]{1,24}?)\s*[:：]\s*(.*)$/);
      if (dayLine) {
        days.push({ day: days.length + 1, title: dayLine[2].trim() || `Day ${days.length + 1}`, description: "" });
        continue;
      }
      const current = days[days.length - 1];
      if (!current) {
        warnings.push(`Itinerary text before “Day 1”: “${line.slice(0, 60)}”`);
        continue;
      }
      if (itemField && /^(meals?|food)$/i.test(key(itemField[1]))) current.meals = itemField[2].trim() || undefined;
      else if (itemField && /^(stay|stays|accommodation|hotel|overnight)$/i.test(key(itemField[1]))) current.stay = itemField[2].trim() || undefined;
      else current.description = sentence(current.description, bare);
      continue;
    }

    if (section === "faqs") {
      const q = line.match(/^(?:q|question|q\d+)\s*[:.)]\s*(.*)$/i);
      const a = line.match(/^(?:a|answer|a\d+)\s*[:.)]\s*(.*)$/i);
      if (q) {
        faq = { question: q[1].trim(), answer: "" };
        faqs.push(faq);
      } else if (a && faq) faq.answer = [faq.answer, a[1].trim()].filter(Boolean).join(" ");
      else if (faq) faq.answer = [faq.answer, line].filter(Boolean).join(" ");
      else warnings.push(`FAQ line without “Q:” skipped: “${line.slice(0, 60)}”`);
      continue;
    }

    if (section === "departures") {
      const value = line.replace(bullet, "").trim();
      if (!value) continue;
      const slot = parseDeparture(value, warnings);
      if (slot) slots.push(slot);
      continue;
    }

    const listKey = section === "highlights" ? "highlights" : section === "included" ? "inclusions" : section === "excluded" ? "exclusions" : section === "carry" ? "thingsToCarry" : null;
    if (listKey) {
      const value = line.replace(bullet, "").trim();
      if (value) lists[listKey].push(value);
      continue;
    }

    if (field) {
      const target = fieldOf(field[1]);
      const value = field[2].trim();
      if (target) {
        multiline = null;
        if (target === "summary" || target === "description" || target === "cancellationPolicy") {
          if (value) text[target].push(value);
          multiline = target;
          continue;
        }
        if (!value) continue;
        switch (target) {
          case "days":
          case "nights":
          case "groupMin":
          case "groupMax":
          case "ageMin":
          case "ageMax":
            data[target] = int(value);
            break;
          case "price":
          case "originalPrice":
          case "bookingAmount":
          case "singleSupplement":
            data[target] = money(value);
            if (data[target] === undefined) warnings.push(`${field[1]}: “${value}” is not a number`);
            break;
          case "duration": {
            const d = value.match(/(\d+)\s*d/i);
            const n = value.match(/(\d+)\s*n/i);
            if (d) data.days = +d[1];
            if (n) data.nights = +n[1];
            break;
          }
          case "groupSize":
            [data.groupMin, data.groupMax] = pair(value);
            break;
          case "ages":
            [data.ageMin, data.ageMax] = pair(value);
            break;
          case "types": {
            const types = typesFrom(value);
            if (types.length) data.types = types;
            else warnings.push(`Trip types: none recognised in “${value}”`);
            break;
          }
          case "difficulty": {
            const d = difficultyFrom(value);
            if (d) data.difficulty = d;
            else warnings.push(`Difficulty: “${value}” is not Easy, Moderate, Challenging or Strenuous`);
            break;
          }
          case "skip":
            break;
          default:
            (data as Record<string, unknown>)[target] = value;
        }
        continue;
      }
      if (!multiline) {
        warnings.push(`Not recognised: “${field[1]}”`);
        continue;
      }
    }

    if (multiline) {
      text[multiline].push(line);
      continue;
    }
    warnings.push(`Skipped: “${line.slice(0, 70)}${line.length > 70 ? "…" : ""}”`);
  }

  if (text.summary.length) data.summary = text.summary.join(" ");
  if (text.description.length) data.description = text.description.join("\n\n");
  if (text.cancellationPolicy.length) data.cancellationPolicy = text.cancellationPolicy.join("\n");
  if (lists.highlights.length) data.highlights = lists.highlights;
  if (lists.inclusions.length) data.inclusions = lists.inclusions;
  if (lists.exclusions.length) data.exclusions = lists.exclusions;
  if (lists.thingsToCarry.length) data.thingsToCarry = lists.thingsToCarry;
  const realDays = days.filter((d) => d.description || d.meals || d.stay || !/^day \d+$/i.test(d.title));
  if (realDays.length) data.itinerary = realDays.map((d, i) => ({ ...d, day: i + 1 }));
  const realFaqs = faqs.filter((f) => f.question && f.answer);
  if (realFaqs.length) data.faqs = realFaqs;
  if (slots.length) data.slots = slots.sort((a, b) => (a.date < b.date ? -1 : 1));
  if (data.days && data.nights && data.nights > data.days) warnings.push("Nights are more than days — please check.");
  if (data.itinerary && data.days && data.itinerary.length !== data.days) warnings.push(`The itinerary has ${data.itinerary.length} days but Days says ${data.days}.`);

  const found = [...new Set(Object.keys(data).map((k) => LABELS[k] ?? k))];
  if (!data.title) warnings.unshift("No Title found — is this the PackMyBags destination form?");
  return { data, found, warnings };
}
