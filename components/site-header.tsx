"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { Frame } from "./frame";
import { Logo } from "./logo";

const links = [
  { href: "/about", label: "About" },
  { href: "/trips", label: "Upcoming trips" },
  { href: "/blog", label: "Journal" },
  { href: "/destinations", label: "Destinations" },
  { href: "/contact", label: "Contact" },
];

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const onHome = pathname === "/";
  const [solid, setSolid] = useState(!onHome);
  const [open, setOpen] = useState(false);
  const overBanner = onHome && !solid;

  useEffect(() => {
    const header = headerRef.current;
    const setHeight = () => {
      if (!header) return;
      document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    };
    setHeight();
    const observer = new ResizeObserver(setHeight);
    if (header) observer.observe(header);

    const onScroll = () => setSolid(!onHome || window.scrollY > 12 || document.documentElement.dataset.intro === "on");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [onHome, settings.promo]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-transparent font-header">
      {settings.promo ? (
        <div className={`px-5 py-2 text-center text-[13px] font-medium tracking-tight ${overBanner ? "bg-transparent text-cream" : "bg-pine text-cream"}`}>
          {settings.promo}
        </div>
      ) : null}
      <Frame className="py-3">
        <div className={`rounded-[28px] border backdrop-blur-xl ${overBanner ? "border-transparent bg-transparent shadow-none" : "border-white/80 bg-cream/80 shadow-[0_18px_50px_-32px_rgba(23,20,15,0.65)]"}`}>
          <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-4">
            <Link href="/" aria-label="Pack my bags home" onClick={() => setOpen(false)}>
              <Logo tone={overBanner ? "cream" : "ink"} wordmark="header" />
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const current = isCurrent(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`rounded-full px-3.5 py-2 text-[13px] font-medium tracking-tight transition ${overBanner ? (current ? "bg-white/20 text-cream" : "text-cream/85 hover:bg-white/10 hover:text-cream") : current ? "bg-pine text-cream" : "text-ink/70 hover:bg-sand hover:text-ink"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                className="hidden rounded-full bg-clay px-4 py-2 text-[13px] font-semibold tracking-tight text-white transition hover:bg-[#b85324] sm:inline-flex"
              >
                {settings.phone}
              </a>
              <button
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${overBanner ? "border-white/30 text-cream" : "border-line bg-paper"}`}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {open ? (
            <nav className={`space-y-1 border-t px-3 py-3 md:hidden ${overBanner ? "border-white/15 text-cream" : "border-line"}`}>
              {links.map((link) => {
                const current = isCurrent(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`block rounded-2xl px-3 py-3 text-sm font-medium ${overBanner ? (current ? "bg-white/20 text-cream" : "hover:bg-white/10") : current ? "bg-pine text-cream" : "hover:bg-sand"}`}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <a href={`https://wa.me/${settings.whatsapp}`} className={`block rounded-2xl px-3 py-3 text-sm font-medium ${overBanner ? "hover:bg-white/10" : "hover:bg-sand"}`}>
                WhatsApp {settings.phone}
              </a>
            </nav>
          ) : null}
        </div>
      </Frame>
    </header>
  );
}
