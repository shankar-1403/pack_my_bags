import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/enquiry-form";
import { Frame } from "@/components/frame";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const channels = [
    { label: "Call", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}`, icon: Phone },
    { label: "WhatsApp", value: settings.phone, href: `https://wa.me/${settings.whatsapp}`, icon: MessageCircle, external: true },
    { label: "Email", value: settings.email, href: `mailto:${settings.email}`, icon: Mail, wide: true },
    {
      label: "Studio",
      value: settings.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`,
      icon: MapPin,
      external: true,
      wide: true,
    },
  ];

  return (
    <Frame className="py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
        <div>
          <p className="font-header text-xs font-semibold uppercase tracking-[0.24em] text-[#f94f18]">Desk</p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-tight [text-wrap:balance] sm:text-6xl xl:text-7xl">
            Tell us the month. <span className="italic text-[#f94f18]">We will tell you the trip.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/70">
            Private groups, solo seats, and questions about a date already on the calendar all come through here.
          </p>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {channels.map(({ label, value, href, icon: Icon, external, wide }) => (
              <li key={label} className={wide ? "sm:col-span-2" : ""}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex h-full items-start gap-4 rounded-[24px] border border-line bg-cream p-5 transition duration-300 hover:-translate-y-0.5 hover:border-pine/30 hover:shadow-[0_18px_40px_-28px_rgba(23,20,15,0.5)]"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-pine text-cream transition-colors duration-300 group-hover:bg-[#f94f18]">
                    <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-header text-[11px] font-semibold uppercase tracking-[0.2em] text-mist">{label}</span>
                    <span className={`mt-1 block text-base leading-6 text-ink ${label === "Email" ? "break-all" : ""}`}>{value}</span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-5 shrink-0 text-mist transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#f94f18]"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* The form, as an enquiry slip: header band, perforated tear, then the fields. */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="relative [filter:drop-shadow(0_1px_1px_rgba(23,20,15,0.08))_drop-shadow(0_28px_36px_rgba(23,20,15,0.14))]">
            <div className="notch-bottom relative overflow-hidden rounded-t-[32px] bg-pine px-6 pb-8 pt-7 text-cream sm:px-8">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{ backgroundImage: "radial-gradient(#fbf8f3 1px, transparent 1px)", backgroundSize: "16px 16px" }}
              />
              <svg aria-hidden viewBox="0 0 240 60" fill="none" className="pointer-events-none absolute right-6 top-6 w-40 text-[#f94f18] sm:w-52">
                <path d="M4 52 C 70 52, 120 10, 214 12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" strokeLinecap="round" opacity="0.8" />
                <path
                  transform="translate(224 12) rotate(-6) scale(0.7)"
                  fill="currentColor"
                  d="M12 0c0-1.3-1.6-2.2-3.2-2.2H3.4L-3.2-11h-3.3l3.9 8.8h-5.2l-2.7-3.4h-2.2L-10.9 0l-1.6 5.6h2.2l2.7-3.4h5.2L-6.5 11h3.3l6.6-8.8h5.4C10.4 2.2 12 1.3 12 0Z"
                />
              </svg>
              <p className="relative font-header text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f94f18]">Enquiry</p>
              <h2 className="relative mt-2 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">Where to next?</h2>
            </div>
            <div className="notch-top relative rounded-b-[32px] bg-cream p-6 pt-7 sm:p-8">
              <span aria-hidden className="absolute inset-x-6 top-0 border-t-2 border-dashed border-line" />
              <EnquiryForm />
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}
