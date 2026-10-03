"use client";

import { useState } from "react";
import { checkEnquiry, refuses, type EnquiryErrors, type EnquiryFields } from "@/lib/enquiry-rules";

const EMPTY: EnquiryFields = { name: "", email: "", phone: "", message: "" };
const field = "w-full rounded-2xl border bg-paper px-4 py-3 text-sm outline-none";
const look = (bad?: string) => `${field} ${bad ? "border-[#f94f18] focus:border-[#f94f18]" : "border-line focus:border-clay"}`;

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
  const [form, setForm] = useState<EnquiryFields>(EMPTY);
  const [errors, setErrors] = useState<EnquiryErrors>({});

  function onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    if (refuses(name, value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = checkEnquiry(form);
    const first = (["name", "email", "phone", "message"] as const).find((key) => found[key]);
    if (first) {
      setErrors(found);
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    setError("");
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tripSlug, tripTitle, departure }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "Could not send that. Please try again.");
      setStatus("error");
      return;
    }
    setForm(EMPTY);
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
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <div>
        <input name="name" value={form.name} onChange={onChange} placeholder="Your name" autoComplete="name" aria-invalid={Boolean(errors.name)} className={look(errors.name)} />
        {errors.name ? <p className="mt-1.5 px-1 text-xs text-[#f94f18]">{errors.name}</p> : null}
      </div>
      <div>
        <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={look(errors.email)} />
        {errors.email ? <p className="mt-1.5 px-1 text-xs text-[#f94f18]">{errors.email}</p> : null}
      </div>
      <div>
        <input name="phone" type="tel" inputMode="tel" value={form.phone} onChange={onChange} placeholder="Phone" autoComplete="tel" aria-invalid={Boolean(errors.phone)} className={look(errors.phone)} />
        {errors.phone ? <p className="mt-1.5 px-1 text-xs text-[#f94f18]">{errors.phone}</p> : null}
      </div>
      <div>
        <textarea
          name="message"
          value={form.message}
          onChange={onChange}
          rows={compact ? 4 : 6}
          placeholder={tripTitle ? `Ask about ${tripTitle}` : "Where do you want to go, and when?"}
          aria-invalid={Boolean(errors.message)}
          className={look(errors.message)}
        />
        {errors.message ? <p className="mt-1.5 px-1 text-xs text-[#f94f18]">{errors.message}</p> : null}
      </div>
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
