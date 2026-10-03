import Link from "next/link";
import { Frame } from "@/components/frame";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/content";

export default async function NotFound() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader settings={settings} />
      <Frame className="flex min-h-[50vh] flex-1 flex-col items-start justify-center py-20">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">404</p>
          <h1 className="mt-3 font-serif text-5xl tracking-tight">The page not found.</h1>
          <p className="mt-4 text-sm text-ink/70 mb-6">Try the calendar, or write to the desk if a link used to work.</p>
          <Link href="/trips" className="rounded-full bg-ink px-5 py-3 text-sm text-cream">See destinations</Link>
        </div>
      </Frame>
      <SiteFooter settings={settings} />
    </div>
  );
}
