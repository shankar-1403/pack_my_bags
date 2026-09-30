import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { Frame } from "@/components/frame";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const settings = getSettings();

  return (
    <Frame className="grid gap-12 py-12 lg:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">Desk</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Tell us the month. We will tell you the trip.</h1>
        <p className="mt-4 text-lg leading-8 text-ink/70">
          Private groups, solo seats, and questions about a date already on the calendar all come through here.
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-mist">Phone</dt>
            <dd className="mt-1"><a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a></dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-mist">Email</dt>
            <dd className="mt-1"><a href={`mailto:${settings.email}`}>{settings.email}</a></dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-mist">Studio</dt>
            <dd className="mt-1 max-w-sm leading-6">{settings.address}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-[32px] border border-line bg-cream p-6">
        <EnquiryForm />
      </div>
    </Frame>
  );
}
