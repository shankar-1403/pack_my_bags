"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Place = {
  name: string;
  region: string;
  image: string;
  count: number;
};

const speeds = [0.18, 0.1, 0.22];

export function PlacesGrid({ places }: { places: Place[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const layers = [...node.querySelectorAll<HTMLElement>("[data-speed]")];
    let frame = 0;

    const update = () => {
      frame = 0;
      const view = window.innerHeight || document.documentElement.clientHeight || 1;
      for (const layer of layers) {
        const card = layer.closest("a");
        if (!card) continue;
        const rect = card.getBoundingClientRect();
        const speed = Number(layer.dataset.speed) || 0.4;
        const offset = rect.top + rect.height / 2 - view / 2;
        const shift = Math.max(-48, Math.min(48, offset * speed));
        layer.style.transform = `translate3d(0, ${shift}px, 0)`;
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
    <div ref={root} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place, index) => (
        <Link
          key={place.name}
          href={`/trips?destination=${encodeURIComponent(place.name)}`}
          className="relative block h-80 overflow-hidden rounded-[28px]"
        >
          <div
            data-speed={speeds[index % speeds.length]}
            className="absolute inset-x-[-12%] top-[-80%] h-[260%] bg-cover bg-center will-change-transform"
            style={{ backgroundImage: `url("${place.image}")` }}
            aria-hidden
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pine/80 to-pine/10" />
          <span className="pointer-events-none absolute bottom-0 p-5 text-cream">
            <span className="block font-serif text-3xl leading-none">{place.name}</span>
            <span className="mt-2 block text-sm text-cream/75">
              {place.region} · {place.count} {place.count === 1 ? "trip" : "trips"}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
