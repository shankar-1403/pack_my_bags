"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/trips", label: "Trips" },
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
    <aside className="bg-pine text-cream md:min-h-screen">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" className="font-header text-xl font-semibold leading-none tracking-tight">Pack my bags</Link>
        <span className="text-[11px] uppercase tracking-[0.2em] text-cream/50">CMS</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm whitespace-nowrap ${active ? "bg-cream text-ink" : "text-cream/80 hover:bg-white/10"}`}
            >
              {link.label}
            </Link>
          );
        })}
        <button type="button" onClick={logout} className="rounded-full px-4 py-2 text-left text-sm text-cream/70 hover:bg-white/10">
          Log out
        </button>
        <Link href="/" className="rounded-full px-4 py-2 text-sm text-cream/70 hover:bg-white/10">
          View site
        </Link>
      </nav>
    </aside>
  );
}
