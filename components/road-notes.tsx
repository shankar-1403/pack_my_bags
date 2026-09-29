"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Review } from "@/lib/types";

const spots = [
  { className: "sm:left-[4%] sm:top-[7%] sm:w-[300px] lg:left-[5%] lg:w-[320px]", speed: 0.14, limit: 36 },
  { className: "sm:right-[4%] sm:top-[34%] sm:w-[300px] lg:right-[5%] lg:w-[320px]", speed: 0.28, limit: 64 },
  { className: "sm:bottom-[6%] sm:left-[5%] sm:w-[320px] lg:left-[6%] lg:w-[340px]", speed: 0.42, limit: 48 },
];

function Note({
  review,
  className = "",
  speed,
  limit,
}: {
  review: Review;
  className?: string;
  speed?: number;
  limit?: number;
}) {
  return (
    <blockquote
      data-note={speed === undefined ? undefined : ""}
      data-speed={speed}
      data-limit={limit}
      className={`rounded-[28px] border border-white/50 bg-cream/95 p-4 shadow-[0_18px_40px_-22px_rgba(23,20,15,0.75)] sm:p-5 ${className}`}
    >
      <p className="text-sm leading-6 text-ink/80 sm:leading-7">“{review.quote}”</p>
      <footer className="mt-3 text-sm">
        <span className="font-medium">{review.name}</span>
        <span className="text-mist"> · {review.trip}</span>
      </footer>
    </blockquote>
  );
}

export function RoadNotes({ reviews }: { reviews: Review[] }) {
  const road = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = road.current;
    if (!node) return;

    const cards = [...node.querySelectorAll<HTMLElement>("[data-note]")];
    let frame = 0;

    const update = () => {
      frame = 0;
      const view = window.innerHeight || 1;
      const rect = node.getBoundingClientRect();
      const offset = rect.top + rect.height / 2 - view / 2;
      for (const card of cards) {
        const speed = Number(card.dataset.speed) || 0.2;
        const limit = Number(card.dataset.limit) || 48;
        const shift = Math.max(-limit, Math.min(limit, -offset * speed));
        card.style.transform = `translate3d(0, ${shift}px, 0)`;
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
  }, [reviews]);

  return (
    <div className="mt-10">
      <div ref={road} className="relative h-[420px] overflow-hidden rounded-[32px] sm:h-[700px] lg:h-[760px]">
        <Image
          src="https://images.unsplash.com/photo-1471958680802-1345a694ba6d?auto=format&fit=crop&w=2000&q=80"
          alt=""
          fill
          sizes="(min-width: 1280px) 80rem, 100vw"
          className="object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-ink/35" />
        {reviews.map((review, index) => {
          const spot = spots[index] ?? spots[spots.length - 1];
          return (
            <Note
              key={review.id}
              review={review}
              speed={spot.speed}
              limit={spot.limit}
              className={`absolute hidden will-change-transform sm:block ${spot.className}`}
            />
          );
        })}
      </div>
      <div className="mt-4 grid gap-3 sm:hidden">
        {reviews.map((review) => (
          <Note key={review.id} review={review} className="border-line bg-cream shadow-none" />
        ))}
      </div>
    </div>
  );
}
