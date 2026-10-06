import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { Frame } from "./frame";
import Image from "next/image";
import Logo from "../public/logo_white.webp";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-pine font-header text-cream">
      <Frame className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-14 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <Image src={Logo} alt="PackMyBags" className="h-10 w-auto md:h-14" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-cream/70">{settings.tagline}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45">Trips</p>
          <ul className="mt-3 text-sm text-cream/85">
            <li><Link href="/trips" className="inline-flex min-h-10 items-center hover:text-white">Destinations</Link></li>
            <li><Link href="/trips?type=domestic" className="inline-flex min-h-10 items-center hover:text-white">Domestic</Link></li>
            <li><Link href="/trips?type=international" className="inline-flex min-h-10 items-center hover:text-white">International</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45">Company</p>
          <ul className="mt-3 text-sm text-cream/85">
            <li><Link href="/about" className="inline-flex min-h-10 items-center hover:text-white">About</Link></li>
            <li><Link href="/blog" className="inline-flex min-h-10 items-center hover:text-white">Journal</Link></li>
            <li><Link href="/contact" className="inline-flex min-h-10 items-center hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45">Talk to us</p>
          <ul className="mt-3 text-sm text-cream/85">
            <li><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="inline-flex min-h-10 items-center hover:text-white">{settings.phone}</a></li>
            <li><a href={`mailto:${settings.email}`} className="inline-flex min-h-10 items-center break-all hover:text-white">{settings.email}</a></li>
            <li><a href={`https://wa.me/${settings.whatsapp}`} className="inline-flex min-h-10 items-center hover:text-white">WhatsApp</a></li>
          </ul>
          <p className="mt-4 max-w-xs text-sm leading-6 text-cream/55">{settings.address}</p>
        </div>
      </Frame>
      <div className="border-t border-white/10">
        <Frame className="flex flex-col gap-2 pb-24 pt-5 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between md:pb-5 md:pr-24">
          <p>
            © {year} PackMyBags · A division of{" "}
            <a href="https://pcred.org" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#f94f18] transition-colors hover:text-[#ff7a4a]">
              PCRED Venture Pvt. Ltd.
            </a>
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/privacy" className="inline-flex min-h-10 items-center hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="inline-flex min-h-10 items-center hover:text-white">Terms &amp; Conditions</Link>
          </nav>
        </Frame>
      </div>
    </footer>
  );
}
