import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { Frame } from "./frame";
import { Logo } from "./logo";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-pine font-header text-cream">
      <Frame className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo tone="cream" wordmark="header" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-cream/70">{settings.tagline}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45">Trips</p>
          <ul className="mt-4 space-y-2.5 text-sm text-cream/85">
            <li><Link href="/trips" className="hover:text-white">Upcoming trips</Link></li>
            <li><Link href="/trips?type=domestic" className="hover:text-white">Domestic</Link></li>
            <li><Link href="/trips?type=international" className="hover:text-white">International</Link></li>
            <li><Link href="/destinations" className="hover:text-white">Destinations</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45">Company</p>
          <ul className="mt-4 space-y-2.5 text-sm text-cream/85">
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/blog" className="hover:text-white">Journal</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/admin" className="hover:text-white">Studio</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45">Talk to us</p>
          <ul className="mt-4 space-y-2.5 text-sm text-cream/85">
            <li><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-white">{settings.phone}</a></li>
            <li><a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a></li>
            <li><a href={`https://wa.me/${settings.whatsapp}`} className="hover:text-white">WhatsApp</a></li>
          </ul>
          <p className="mt-4 max-w-xs text-sm leading-6 text-cream/55">{settings.address}</p>
        </div>
      </Frame>
      <div className="border-t border-white/10">
        <Frame className="flex flex-col gap-2 py-5 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Pack my bags. Group trips with fixed dates and captains who stay with you.</p>
          <p>Mumbai</p>
        </Frame>
      </div>
    </footer>
  );
}
