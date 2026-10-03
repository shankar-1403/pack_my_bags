"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Place = {
  name: string;
  region: string;
  image: string;
  trips: string[];
};

const depths = [0.1, 0.2, 0.14];

export function DestinationAtlas({ places }: { places: Place[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const cards = [...node.querySelectorAll<HTMLElement>("[data-card]")];
    const photos = [...node.querySelectorAll<HTMLElement>("[data-photo]")];
    let frame = 0;

    const update = () => {
      frame = 0;
      const view = window.innerHeight || document.documentElement.clientHeight || 1;
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const depth = Number(card.dataset.depth) || 0.12;
        const offset = rect.top + rect.height / 2 - view / 2;
        const shift = Math.max(-42, Math.min(42, offset * depth));
        card.style.transform = `translate3d(0, ${shift}px, 0)`;
      }
      for (const photo of photos) {
        const card = photo.closest("a");
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        const offset = rect.top + rect.height / 2 - view / 2;
        const shift = Math.max(-32, Math.min(32, offset * -0.14));
        photo.style.transform = `translate3d(0, ${shift}px, 0) scale(1.08)`;
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [places]);

  return (
    <div ref={root} className="mt-10 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place, index) => (
        <Link
          key={place.name}
          href={`/trips?destination=${encodeURIComponent(place.name)}`}
          data-card
          data-depth={depths[index % depths.length]}
          className={`group block overflow-hidden rounded-[32px] bg-pine text-cream will-change-transform ${index % 3 === 1 ? "lg:mt-16" : ""}`}
        >
          <span className="relative block h-[22rem] overflow-hidden sm:h-[24rem]">
            <span
              data-photo
              aria-hidden
              className="absolute inset-x-[-10%] top-[-38%] h-[180%] bg-cover bg-center will-change-transform"
              style={{ backgroundImage: `url("${place.image}")` }}
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pine via-pine/45 to-pine/10" />
            <span className="absolute left-4 top-4 rounded-full bg-cream px-2.5 py-1 font-header text-[11px] font-semibold uppercase tracking-[0.14em] text-pine">
              {place.trips.length} {place.trips.length === 1 ? "route" : "routes"}
            </span>
            <span className="absolute inset-x-0 bottom-0 px-5 pb-5">
              <span className="font-header text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/65">{place.region}</span>
              <h2 className="mt-1 font-serif text-4xl leading-none tracking-tight">{place.name}</h2>
              <span className="mt-3 flex flex-col gap-1.5">
                {place.trips.slice(0, 2).map((title) => (
                  <span key={title} className="truncate font-header text-sm text-cream/80">
                    {title}
                  </span>
                ))}
              </span>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
