"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { Frame } from "./frame";
import Image from "next/image";
import Logo from "../public/logo.webp";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/trips", label: "Upcoming trips" },
  { href: "/blog", label: "Journal" },
  { href: "/destinations", label: "Destinations" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const setHeight = () => document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [settings.promo]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-transparent font-header">
      {settings.promo ? (
        <div className="bg-[#f94f18] px-4 py-1.5 text-center text-[11px] font-medium tracking-tight text-cream short:py-1 md:text-[13px] short:md:text-xs">
          {settings.promo}
        </div>
      ) : null}
      <Frame className="py-3 short:py-1.5">
        <div className={`rounded-[28px] border backdrop-blur-xl border-white/80 bg-cream/80 shadow-[0_18px_50px_-32px_rgba(23,20,15,0.65)]`}>
          <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-4 short:py-1">
            <Link href="/" aria-label="Pack my bags home" className="flex min-h-11 shrink-0 items-center" onClick={() => setOpen(false)}>
              <Image src={Logo} alt="Pack my bags" priority className="h-9 w-auto sm:h-11 lg:h-14 xl:h-16 short:h-8 short:sm:h-9 short:lg:h-11" />
            </Link>
            <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1">
              {links.map((link) => {
                const current = isCurrent(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium tracking-tight transition xl:px-3.5 ${current ? "bg-pine text-cream" : "text-ink/70 hover:bg-[#f94f18]/10 hover:text-ink"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper text-ink lg:hidden"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {open ? (
            <nav className="absolute inset-x-0 mt-2 max-h-[calc(100dvh-var(--site-header-height,7.5rem)-1rem)] space-y-1 overflow-y-auto overscroll-contain rounded-[28px] border border-line bg-white px-3 py-3 shadow-[0_24px_60px_-30px_rgba(23,20,15,0.5)] lg:hidden">
              {links.map((link) => {
                const current = isCurrent(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`block rounded-2xl px-3 py-3 text-sm font-medium
                      ${current ? "bg-pine text-cream" : "hover:bg-sand text-ink"}`}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a href={`https://wa.me/${settings.whatsapp}`} className={`block rounded-2xl px-3 py-3 text-sm font-medium hover:bg-pine text-ink`}>
                WhatsApp {settings.phone}
              </a>
            </nav>
          ) : null}
        </div>
      </Frame>
    </header>
  );
}
