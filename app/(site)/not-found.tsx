import Link from "next/link";
import { Frame } from "@/components/frame";

export default function NotFound() {
  return (
    <Frame className="flex min-h-[50vh] flex-col items-start justify-center py-20">
      <div className="max-w-xl">
      <p className="text-xs uppercase tracking-[0.22em] text-clay">404</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">That page is not on the route.</h1>
      <p className="mt-4 text-sm leading-6 text-ink/70">The trip may have been unpublished, or the link is older than the calendar.</p>
      <Link href="/trips" className="mt-6 rounded-full bg-ink px-5 py-3 text-sm text-cream">See upcoming trips</Link>
      </div>
    </Frame>
  );
}
