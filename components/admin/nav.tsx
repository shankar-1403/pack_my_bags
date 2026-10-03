"use client";

import Image from "next/image";
import Link from "next/link";
import LogoWhite from "../../public/logo_white.webp";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/trips", label: "Destinations" },
  { href: "/admin/weekend", label: "Weekend banners" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/posts", label: "Journal" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 z-40 bg-pine text-cream md:h-screen md:overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 md:py-6">
        <Link href="/admin" aria-label="PackMyBags CMS home">
          <Image src={LogoWhite} alt="PackMyBags" priority className="h-8 w-auto md:h-9" />
        </Link>
        <span className="text-[11px] uppercase tracking-[0.2em] text-cream/50">CMS</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] md:flex-col md:pb-6 [&::-webkit-scrollbar]:hidden">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${active ? "bg-cream text-ink" : "text-cream/80 hover:bg-white/10"}`}
            >
              {link.label}
            </Link>
          );
        })}
        <button type="button" onClick={logout} className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-left text-sm text-cream/70 hover:bg-white/10 md:mt-4">
          Log out
        </button>
        <Link href="/" target="_blank" className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm text-cream/70 hover:bg-white/10">
          View site
        </Link>
      </nav>
    </aside>
  );
}
