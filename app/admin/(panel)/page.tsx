import Link from "next/link";
import { getEnquiries, getFaqs, getPosts, getReviews, getTrips } from "@/lib/content";

export default function AdminHome() {
  const trips = getTrips();
  const posts = getPosts();
  const reviews = getReviews();
  const faqs = getFaqs();
  const enquiries = getEnquiries();
  const fresh = enquiries.filter((item) => item.status === "new");

  const stats = [
    { label: "Trips", value: trips.length, href: "/admin/trips" },
    { label: "Stories", value: posts.length, href: "/admin/posts" },
    { label: "Reviews", value: reviews.length, href: "/admin/reviews" },
    { label: "Open enquiries", value: fresh.length, href: "/admin/enquiries" },
  ];

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[#f94f18]">Studio</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">Overview</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink/70">
        Edit the calendar, the journal, and the notes on the homepage. Changes are stored in the content files and show up on the public site immediately.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-3xl border border-line bg-cream p-5 transition hover:-translate-y-0.5">
            <p className="font-serif text-4xl">{stat.value}</p>
            <p className="mt-2 text-sm text-mist">{stat.label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/trips/new" className="rounded-full bg-ink px-5 py-3 text-sm text-cream">New trip</Link>
        <Link href="/admin/posts/new" className="rounded-full border border-line px-5 py-3 text-sm">New story</Link>
        <Link href="/admin/faqs" className="rounded-full border border-line px-5 py-3 text-sm">{faqs.length} FAQs</Link>
      </div>
      <section className="mt-10">
        <h2 className="font-serif text-3xl">Latest enquiries</h2>
        <ul className="mt-4 space-y-3">
          {enquiries.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded-3xl border border-line bg-cream px-5 py-4 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-mist"> · {item.tripTitle || "General"} · {item.status}</span>
              <p className="mt-1 text-ink/75">{item.message}</p>
            </li>
          ))}
          {enquiries.length === 0 ? <li className="text-sm text-mist">No messages yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
