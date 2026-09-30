"use client";

import { useState } from "react";

export function EnquiryForm({
  tripSlug = "",
  tripTitle = "",
  departure = "",
  compact = false,
}: {
  tripSlug?: string;
  tripTitle?: string;
  departure?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, tripSlug, tripTitle, departure }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "Could not send that. Please try again.");
      setStatus("error");
      return;
    }
    form.reset();
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-[28px] border border-line bg-sand/60 p-6">
        <p className="font-serif text-3xl leading-none">We have it.</p>
        <p className="mt-3 text-sm leading-6 text-ink/75">
          A planner will write back on the email you shared. If the date is filling up, mention that in your reply.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="name" required placeholder="Your name" className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-clay" />
      <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-clay" />
      <input name="phone" placeholder="Phone" className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-clay" />
      <textarea
        name="message"
        required
        rows={compact ? 4 : 6}
        placeholder={tripTitle ? `Ask about ${tripTitle}` : "Where do you want to go, and when?"}
        className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-clay"
      />
      {error ? <p className="text-sm text-[#f94f18]">{error}</p> : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-[#f94f18] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#b85324] disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Request a callback"}
      </button>
    </form>
  );
}
