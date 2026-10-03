"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEPARTURE_STATUSES,
  DIFFICULTIES,
  TRIP_TYPES,
  formatInr,
  slotsFromLabels,
  slugify,
} from "@/lib/format";
import type { Departure, ItineraryDay, Trip, TripFaq, TripType } from "@/lib/types";
import { Field, inputClass } from "./fields";
import { ImageUpload, MultiUpload } from "./image-upload";

type Draft = Omit<Trip, "id" | "slots" | "faqs" | "thingsToCarry"> & {
  slots: Departure[];
  faqs: TripFaq[];
  thingsToCarry: string[];
};

const blank: Draft = {
  slug: "",
  title: "",
  destination: "",
  region: "",
  summary: "",
  description: "",
  image: "",
  gallery: [],
  days: 5,
  nights: 4,
  price: 19999,
  originalPrice: 19999,
  types: [],
  highlights: [],
  inclusions: [],
  exclusions: [],
  itinerary: [],
  departures: [],
  featured: false,
  published: false,
  slots: [],
  faqs: [],
  thingsToCarry: [],
  priceNote: "per person · twin share",
};

function toDraft(trip: Trip | null): Draft {
  if (!trip) return blank;
  return {
    ...blank,
    ...trip,
    slots: trip.slots?.length ? trip.slots : slotsFromLabels(trip.departures),
    faqs: trip.faqs ?? [],
    thingsToCarry: trip.thingsToCarry ?? [],
  };
}

const sections = [
  ["basics", "Basics"],
  ["pricing", "Pricing"],
  ["departures", "Departures"],
  ["facts", "Trip facts"],
  ["story", "Story"],
  ["itinerary", "Itinerary"],
  ["lists", "Included & packing"],
  ["faqs", "FAQs & policy"],
  ["media", "Photos"],
  ["seo", "Search & sharing"],
] as const;

const smallInput = inputClass.replace("px-4 py-3", "px-3 py-2");

export function TripForm({ trip }: { trip: Trip | null }) {
  const router = useRouter();
  const initial = useMemo(() => toDraft(trip), [trip]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(draft) !== baseline;
  const formRef = useRef<HTMLFormElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Warn before leaving with unsaved changes; Ctrl/Cmd+S saves.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    const save = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("keydown", save);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("keydown", save);
    };
  }, [dirty]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(trip ? `/api/trips/${trip.id}` : "/api/trips", {
      method: trip ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, id: trip?.id }),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; item?: Trip } | null;
    setSaving(false);
    if (!response.ok || !data?.item) {
      setError(data?.error || "Could not save the trip.");
      return;
    }
    const saved = toDraft(data.item);
    setBaseline(JSON.stringify(saved));
    setDraft(saved);
    setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    if (!trip) router.push(`/admin/trips/${data.item.id}`);
    router.refresh();
  }

  async function onDelete() {
    if (!trip || !confirm(`Delete “${trip.title}” for good? This cannot be undone.`)) return;
    const response = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Could not delete the trip.");
      return;
    }
    setBaseline(JSON.stringify(draft));
    router.push("/admin/trips");
    router.refresh();
  }

  async function onDuplicate() {
    if (!trip) return;
    if (dirty && !confirm("Duplicate the last saved version? Unsaved changes here are not copied.")) return;
    const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duplicateOf: trip.id }) });
    const data = (await response.json().catch(() => null)) as { item?: Trip; error?: string } | null;
    if (!response.ok || !data?.item) return setError(data?.error || "Could not duplicate the trip.");
    router.push(`/admin/trips/${data.item.id}`);
  }

  const discount = Math.max(0, (draft.originalPrice || 0) - (draft.price || 0));
  const seoTitle = draft.seoTitle || draft.title;
  const seoDescription = draft.seoDescription || draft.summary;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid grid-cols-[minmax(0,1fr)] gap-8 pb-28 lg:grid-cols-[180px_minmax(0,1fr)]">
      <nav aria-label="Sections" className="hidden lg:block">
        <ul className="sticky top-6 space-y-1 text-sm">
          {sections.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="block rounded-xl px-3 py-2 text-ink/70 hover:bg-sand/60 hover:text-ink">{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
        <Section id="basics" title="Basics" hint="What the trip is called and where it goes.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input required value={draft.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Web address">
              <div className="flex items-center rounded-2xl border border-line bg-cream pl-4 text-sm focus-within:border-clay">
                <span className="shrink-0 text-mist">/trips/</span>
                <input
                  value={draft.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder={slugify(draft.title) || "auto-from-title"}
                  className="w-full bg-transparent py-3 pr-4 outline-none"
                />
              </div>
            </Field>
            <Field label="Destination (groups trips on the site)">
              <input required value={draft.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Spiti Valley" className={inputClass} />
            </Field>
            <Field label="Region">
              <input value={draft.region} onChange={(e) => set("region", e.target.value)} placeholder="Himachal Pradesh" className={inputClass} />
            </Field>
            <Field label="Tagline (one line under the title)">
              <input value={draft.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Badge on cards (optional)">
              <input value={draft.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="Bestseller, New, Last seats…" className={inputClass} />
            </Field>
            <Field label="Days">
              <input type="number" min={1} required value={draft.days} onChange={(e) => set("days", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Nights">
              <input type="number" min={0} required value={draft.nights} onChange={(e) => set("nights", Number(e.target.value))} className={inputClass} />
            </Field>
          </div>
          <fieldset className="mt-5">
            <legend className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-mist">Trip types (filters on the site)</legend>
            <div className="flex flex-wrap gap-2">
              {TRIP_TYPES.map((item) => {
                const on = draft.types.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("types", on ? draft.types.filter((t) => t !== item.id) : [...draft.types, item.id as TripType])}
                    className={`min-h-10 rounded-full px-4 text-sm transition ${on ? "bg-ink text-cream" : "bg-cream text-ink ring-1 ring-line hover:bg-sand"}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </Section>

        <Section id="pricing" title="Pricing" hint="The price shown everywhere. A higher original price shows as a discount.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Price (₹)">
              <input type="number" min={1} required value={draft.price} onChange={(e) => set("price", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Original price (₹)">
              <input type="number" min={0} value={draft.originalPrice} onChange={(e) => set("originalPrice", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Price note">
              <input value={draft.priceNote ?? ""} onChange={(e) => set("priceNote", e.target.value)} placeholder="per person · twin share" className={inputClass} />
            </Field>
            <Field label="Booking amount to hold a seat (₹)">
              <input type="number" min={0} value={draft.bookingAmount ?? ""} onChange={(e) => set("bookingAmount", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Single room supplement (₹)">
              <input type="number" min={0} value={draft.singleSupplement ?? ""} onChange={(e) => set("singleSupplement", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>
          <p className="mt-3 text-sm text-mist">
            Shows as <strong className="text-ink">{formatInr(draft.price || 0)}</strong>
            {discount > 0 ? <> with a <strong className="text-[#f94f18]">{formatInr(discount)} off</strong> tag</> : " with no discount tag"}.
          </p>
        </Section>

        <Section id="departures" title="Departures" hint="Each dated batch. Sold-out and cancelled batches stay visible to you; cancelled ones are hidden from visitors.">
          <Repeater<Departure>
            items={draft.slots}
            onChange={(slots) => set("slots", slots)}
            make={() => ({ date: "", seats: draft.groupMax ?? 12, seatsLeft: draft.groupMax ?? 12, status: "open" })}
            addLabel="Add departure"
            empty="No dates yet — the site will say “Dates on request”."
            render={(slot, update) => (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_90px_90px_1fr_1fr]">
                <Mini label="Starts">
                  <input type="date" required value={slot.date} onChange={(e) => update({ ...slot, date: e.target.value })} className={smallInput} />
                </Mini>
                <Mini label="Ends">
                  <input type="date" value={slot.endDate ?? ""} min={slot.date} onChange={(e) => update({ ...slot, endDate: e.target.value || undefined })} className={smallInput} />
                </Mini>
                <Mini label="Seats">
                  <input type="number" min={0} value={slot.seats} onChange={(e) => update({ ...slot, seats: Number(e.target.value) })} className={smallInput} />
                </Mini>
                <Mini label="Left">
                  <input type="number" min={0} max={slot.seats} value={slot.seatsLeft} onChange={(e) => update({ ...slot, seatsLeft: Number(e.target.value) })} className={smallInput} />
                </Mini>
                <Mini label="Status">
                  <select value={slot.status} onChange={(e) => update({ ...slot, status: e.target.value as Departure["status"] })} className={smallInput}>
                    {DEPARTURE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </Mini>
                <Mini label="Price for this date (₹)">
                  <input type="number" min={0} value={slot.price ?? ""} placeholder={String(draft.price)} onChange={(e) => update({ ...slot, price: e.target.value ? Number(e.target.value) : undefined })} className={smallInput} />
                </Mini>
                <div className="sm:col-span-2 xl:col-span-6">
                  <Mini label="Note (optional)">
                    <input value={slot.note ?? ""} onChange={(e) => update({ ...slot, note: e.target.value || undefined })} placeholder="Diwali batch, women-only, festival week…" className={smallInput} />
                  </Mini>
                </div>
              </div>
            )}
          />
        </Section>

        <Section id="facts" title="Trip facts" hint="Shown as a quick facts strip on the trip page. Leave blank to hide.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Difficulty">
              <select value={draft.difficulty ?? ""} onChange={(e) => set("difficulty", (e.target.value || undefined) as Draft["difficulty"])} className={inputClass}>
                <option value="">Not set</option>
                {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Group size, from">
              <input type="number" min={1} value={draft.groupMin ?? ""} onChange={(e) => set("groupMin", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Group size, up to">
              <input type="number" min={1} value={draft.groupMax ?? ""} onChange={(e) => set("groupMax", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Minimum age">
              <input type="number" min={1} value={draft.ageMin ?? ""} onChange={(e) => set("ageMin", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Maximum age">
              <input type="number" min={1} value={draft.ageMax ?? ""} onChange={(e) => set("ageMax", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Highest altitude">
              <input value={draft.maxAltitude ?? ""} onChange={(e) => set("maxAltitude", e.target.value)} placeholder="4,550 m" className={inputClass} />
            </Field>
            <Field label="Starts in">
              <input value={draft.startCity ?? ""} onChange={(e) => set("startCity", e.target.value)} placeholder="Shimla" className={inputClass} />
            </Field>
            <Field label="Ends in">
              <input value={draft.endCity ?? ""} onChange={(e) => set("endCity", e.target.value)} placeholder="Manali" className={inputClass} />
            </Field>
            <Field label="Best season">
              <input value={draft.bestSeason ?? ""} onChange={(e) => set("bestSeason", e.target.value)} placeholder="Oct – Mar" className={inputClass} />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Pickup point">
              <input value={draft.pickup ?? ""} onChange={(e) => set("pickup", e.target.value)} placeholder="Shimla ISBT, 9 am" className={inputClass} />
            </Field>
            <Field label="Map link (Google Maps)">
              <input type="url" value={draft.mapUrl ?? ""} onChange={(e) => set("mapUrl", e.target.value)} placeholder="https://maps.app.goo.gl/…" className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section id="story" title="Story" hint="The words on the trip page.">
          <Field label={`Summary (cards and hero) · ${draft.summary.length}/160`}>
            <textarea rows={2} value={draft.summary} onChange={(e) => set("summary", e.target.value)} className={inputClass} />
          </Field>
          <div className="mt-4">
            <Field label="Description">
              <textarea rows={6} value={draft.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <div className="mt-4">
            <ListEditor label="Highlights" items={draft.highlights} onChange={(v) => set("highlights", v)} placeholder="Chicham bridge at golden hour" />
          </div>
        </Section>

        <Section id="itinerary" title="Itinerary" hint="One card per day. Days renumber themselves when you move them.">
          <Repeater<ItineraryDay>
            items={draft.itinerary}
            onChange={(days) => set("itinerary", days.map((day, i) => ({ ...day, day: i + 1 })))}
            make={() => ({ day: draft.itinerary.length + 1, title: "", description: "" })}
            addLabel="Add day"
            empty="No days yet."
            label={(_, i) => `Day ${i + 1}`}
            render={(day, update) => (
              <div className="grid gap-3">
                <Mini label="Title">
                  <input value={day.title} onChange={(e) => update({ ...day, title: e.target.value })} placeholder="Shimla arrival" className={smallInput} />
                </Mini>
                <Mini label="What happens">
                  <textarea rows={3} value={day.description} onChange={(e) => update({ ...day, description: e.target.value })} className={smallInput} />
                </Mini>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Mini label="Meals">
                    <input value={day.meals ?? ""} onChange={(e) => update({ ...day, meals: e.target.value || undefined })} placeholder="Breakfast, dinner" className={smallInput} />
                  </Mini>
                  <Mini label="Stay">
                    <input value={day.stay ?? ""} onChange={(e) => update({ ...day, stay: e.target.value || undefined })} placeholder="Homestay, Kaza" className={smallInput} />
                  </Mini>
                  <div>
                    <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-mist">Photo</span>
                    <ImageUpload value={day.image ?? ""} onChange={(url) => update({ ...day, image: url || undefined })} aspect="aspect-[16/9]" compact />
                  </div>
                </div>
              </div>
            )}
          />
        </Section>

        <Section id="lists" title="Included & packing">
          <div className="grid gap-6 md:grid-cols-2">
            <ListEditor label="Included" items={draft.inclusions} onChange={(v) => set("inclusions", v)} placeholder="Breakfast and dinner" />
            <ListEditor label="Not included" items={draft.exclusions} onChange={(v) => set("exclusions", v)} placeholder="Flights" />
          </div>
          <div className="mt-6">
            <ListEditor label="Things to carry" items={draft.thingsToCarry} onChange={(v) => set("thingsToCarry", v)} placeholder="Warm base layer" />
          </div>
        </Section>

        <Section id="faqs" title="FAQs & policy" hint="Questions answered on this trip's page (the site-wide FAQs live under FAQs).">
          <Repeater<TripFaq>
            items={draft.faqs}
            onChange={(faqs) => set("faqs", faqs)}
            make={() => ({ question: "", answer: "" })}
            addLabel="Add question"
            empty="No trip questions yet."
            render={(faq, update) => (
              <div className="grid gap-3">
                <Mini label="Question">
                  <input value={faq.question} onChange={(e) => update({ ...faq, question: e.target.value })} className={smallInput} />
                </Mini>
                <Mini label="Answer">
                  <textarea rows={2} value={faq.answer} onChange={(e) => update({ ...faq, answer: e.target.value })} className={smallInput} />
                </Mini>
              </div>
            )}
          />
          <div className="mt-6">
            <Field label="Cancellation policy">
              <textarea rows={4} value={draft.cancellationPolicy ?? ""} onChange={(e) => set("cancellationPolicy", e.target.value)} placeholder="Full refund up to 30 days before departure…" className={inputClass} />
            </Field>
          </div>
        </Section>

        <Section id="media" title="Photos" hint="Upload photos from your computer or phone. They are resized and compressed for the web automatically.">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-mist">Cover photo</p>
              <ImageUpload value={draft.image} onChange={(url) => set("image", url)} label="Upload the cover photo" required />
            </div>
            <div className="self-end">
              <Field label="Cover photo description (for screen readers)">
                <input value={draft.imageAlt ?? ""} onChange={(e) => set("imageAlt", e.target.value)} placeholder="Snow on the road to Kaza" className={inputClass} />
              </Field>
            </div>
          </div>
          <div className="mt-8">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-mist">Gallery · {draft.gallery.length} photo{draft.gallery.length === 1 ? "" : "s"}</p>
            {draft.gallery.length ? (
              <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {draft.gallery.map((src, index) => (
                  <li key={`${src}-${index}`} className="relative">
                    <ImageUpload value={src} onChange={(url) => set("gallery", url ? draft.gallery.map((g, i) => (i === index ? url : g)) : draft.gallery.filter((_, i) => i !== index))} />
                    <div className="absolute left-2 top-2 flex gap-1">
                      <IconButton label="Move left" onClick={() => index > 0 && set("gallery", swap(draft.gallery, index, index - 1))} disabled={index === 0}>
                        <span className="grid size-7 place-items-center rounded-full bg-white/90 shadow">←</span>
                      </IconButton>
                      <IconButton label="Move right" onClick={() => index < draft.gallery.length - 1 && set("gallery", swap(draft.gallery, index, index + 1))} disabled={index === draft.gallery.length - 1}>
                        <span className="grid size-7 place-items-center rounded-full bg-white/90 shadow">→</span>
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <MultiUpload onAdd={(urls) => set("gallery", [...draft.gallery, ...urls])} label="Add gallery photos" />
          </div>
        </Section>

        <Section id="seo" title="Search & sharing" hint="How the trip looks on Google and when shared. Blank fields use the title, summary and cover.">
          <div className="grid gap-4">
            <Field label={`Search title · ${seoTitle.length}/60`}>
              <input value={draft.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} placeholder={draft.title} className={inputClass} />
            </Field>
            <Field label={`Search description · ${seoDescription.length}/160`}>
              <textarea rows={2} value={draft.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} placeholder={draft.summary} className={inputClass} />
            </Field>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-mist">Share image (optional — the cover is used if empty)</p>
              <div className="max-w-sm">
                <ImageUpload value={draft.ogImage ?? ""} onChange={(url) => set("ogImage", url || undefined)} aspect="aspect-[1200/630]" label="Upload a share image" />
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <p className="text-xs text-[#1a0dab]/70">packmybags.in › trips › {draft.slug || slugify(draft.title)}</p>
            <p className="mt-1 truncate text-lg text-[#1a0dab]">{seoTitle || "Trip title"} · PackMyBags</p>
            <p className="mt-1 line-clamp-2 text-sm text-ink/70">{seoDescription || "The trip summary appears here."}</p>
          </div>
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur md:left-[240px]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <label className="inline-flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.published} onChange={(e) => set("published", e.target.checked)} className="size-4" /> Published
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4" /> Featured on home
          </label>
          <span className="order-last w-full text-sm text-mist sm:order-none sm:w-auto" aria-live="polite">
            {error ? <span className="text-[#f94f18]">{error}</span> : dirty ? "Unsaved changes" : savedAt ? `Saved at ${savedAt}` : ""}
          </span>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            {trip ? (
              <>
                {trip.published ? (
                  <Link href={`/trips/${trip.slug}`} target="_blank" className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm">View live</Link>
                ) : null}
                <button type="button" onClick={onDuplicate} className="min-h-10 rounded-full border border-line px-4 text-sm">Duplicate</button>
                <button type="button" onClick={onDelete} className="min-h-10 rounded-full border border-line px-4 text-sm text-[#f94f18]">Delete</button>
              </>
            ) : null}
            <button type="submit" disabled={saving} className="min-h-10 rounded-full bg-ink px-5 text-sm text-cream disabled:opacity-60">
              {saving ? "Saving…" : trip ? "Save" : "Create trip"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 md:scroll-mt-6 rounded-[28px] border border-line bg-white/60 p-5 sm:p-6">
      <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-mist">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-mist">{label}</span>
      {children}
    </label>
  );
}

/** A list of rows you can add to, remove from, and reorder. */
function Repeater<T>({
  items,
  onChange,
  make,
  render,
  addLabel,
  empty,
  label,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  make: () => T;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
  addLabel: string;
  empty: string;
  label?: (item: T, index: number) => string;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="grid gap-3">
      {items.length === 0 ? <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-mist">{empty}</p> : null}
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-line bg-cream p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-1">
            <span className="mr-auto text-xs font-semibold uppercase tracking-[0.14em] text-[#f94f18]">{label ? label(item, index) : `#${index + 1}`}</span>
            <IconButton label="Move up" onClick={() => move(index, index - 1)} disabled={index === 0}>↑</IconButton>
            <IconButton label="Move down" onClick={() => move(index, index + 1)} disabled={index === items.length - 1}>↓</IconButton>
            <IconButton label="Copy" onClick={() => onChange([...items.slice(0, index + 1), structuredClone(item), ...items.slice(index + 1)])}>⧉</IconButton>
            <IconButton label="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))}>✕</IconButton>
          </div>
          {render(item, (next) => onChange(items.map((current, i) => (i === index ? next : current))))}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, make()])} className="min-h-10 justify-self-start rounded-full border border-dashed border-ink/30 px-4 text-sm hover:bg-sand/60">
        + {addLabel}
      </button>
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid size-9 place-items-center rounded-full text-sm text-ink/70 hover:bg-sand disabled:opacity-30">
      {children}
    </button>
  );
}

/** One line per item, with add / remove / reorder. Pasting several lines adds them all. */
function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder: string }) {
  const [value, setValue] = useState("");
  const add = () => {
    const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length) onChange([...items, ...lines]);
    setValue("");
  };
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-mist">{label} · {items.length}</p>
      <ul className="grid gap-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1 rounded-xl bg-cream pl-3 ring-1 ring-line">
            <input value={item} onChange={(e) => onChange(items.map((v, i) => (i === index ? e.target.value : v)))} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
            <IconButton label="Move up" onClick={() => index > 0 && onChange(items.map((v, i) => (i === index - 1 ? items[index] : i === index ? items[index - 1] : v)))} disabled={index === 0}>↑</IconButton>
            <IconButton label="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))}>✕</IconButton>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes("\n")) {
              e.preventDefault();
              onChange([...items, ...text.split("\n").map((l) => l.trim()).filter(Boolean)]);
            }
          }}
          placeholder={`${placeholder} — press Enter`}
          className={smallInput}
        />
        <button type="button" onClick={add} className="min-h-10 shrink-0 rounded-full border border-line px-4 text-sm">Add</button>
      </div>
    </div>
  );
}

const swap = <T,>(list: T[], a: number, b: number) => list.map((item, i) => (i === a ? list[b] : i === b ? list[a] : item));


