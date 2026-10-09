"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { WeekendBanner as Slide } from "@/lib/types";

const DURATION = 6000;

/**
 * Landscape weekend banners: one wide frame, slides crossfading with a slow drift, segmented progress at the
 * foot. Plays itself (paused on hover, focus, hidden tabs and reduced motion); arrows, keys and swipe move it.
 */
export function WeekendBanner({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [cycle, setCycle] = useState(0);
  const touch = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => {
    setIndex((next + count) % count);
    setCycle((c) => c + 1);
  }, [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(query.matches);
    sync();
    query.addEventListener("change", sync);
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      query.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (count < 2 || paused || still) return;
    const timer = window.setTimeout(() => go(index + 1), DURATION);
    return () => window.clearTimeout(timer);
  }, [index, paused, still, count, go, cycle]);

  if (!count) return null;
  const playing = count > 1 && !paused && !still;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Weekend getaways"
      className="relative isolate overflow-hidden rounded-[28px] bg-pine sm:rounded-[36px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div className="relative aspect-[4/2] md:aspect-[16/7] lg:aspect-[21/9]">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? "z-10 opacity-100" : "z-0 opacity-0"}`}
            >
              <Image
                src={slide.image}
                alt={slide.title || "Weekend getaway"}
                fill
                priority={i === 0}
                sizes="(min-width: 1280px) 80rem, 100vw"
                className={`transition-transform ease-linear ${active && !still ? "scale-[1.07] duration-[7000ms]" : "scale-100 duration-0"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/45 to-pine/5 sm:bg-gradient-to-r sm:from-pine/10 sm:via-pine/25" />
              {slide.title || slide.subtitle ? (
                <div className="absolute inset-x-0 bottom-0 p-5 pb-14 text-cream sm:inset-y-0 sm:right-auto sm:flex sm:max-w-xl sm:flex-col sm:justify-end sm:p-10 sm:pb-16 lg:p-14 lg:pb-20">
                  {slide.title ? (
                    <h3
                      className={`font-serif text-3xl leading-[1.02] tracking-tight transition-[opacity,translate] duration-700 sm:text-5xl lg:text-6xl ${active ? "translate-y-0 opacity-100 delay-200" : "translate-y-4 opacity-0"}`}
                    >
                      {slide.title}
                    </h3>
                  ) : null}
                  {slide.subtitle ? (
                    <p className={`mt-2 max-w-md text-sm leading-6 text-cream/85 transition-[opacity,translate] duration-700 sm:mt-4 sm:text-lg sm:leading-8 ${active ? "translate-y-0 opacity-100 delay-300" : "translate-y-4 opacity-0"}`}>
                      {slide.subtitle}
                    </p>
                  ) : null}
                  {slide.link ? (
                    <Link
                      href={slide.link}
                      tabIndex={active ? 0 : -1}
                      className={`mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-cream px-5 font-header text-sm font-semibold text-ink transition-[opacity,translate,background-color] duration-700 hover:bg-white sm:mt-7 ${active ? "translate-y-0 opacity-100 delay-500" : "translate-y-4 opacity-0"}`}
                    >
                      Explore <ArrowRight className="size-4" />
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {count > 1 ? (
          <div className="absolute inset-x-5 bottom-1 z-20 flex items-center gap-4 sm:inset-x-10 sm:bottom-7 lg:inset-x-14">
            <div className="flex flex-1 gap-1.5">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === index}
                  className="group relative h-10 flex-1"
                >
                  <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-cream/30 transition group-hover:bg-cream/50">
                    <span
                      key={`${i}-${i === index ? cycle : "x"}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-cream"
                      style={
                        i < index
                          ? { width: "100%" }
                          : i === index
                            ? playing
                              ? { width: "100%", transformOrigin: "left", animation: `weekend-progress ${DURATION}ms linear both` }
                              : { width: "100%" }
                            : { width: "0%" }
                      }
                    />
                  </span>
                </button>
              ))}
            </div>
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="grid size-11 place-items-center rounded-full bg-cream/15 text-cream ring-1 ring-cream/30 backdrop-blur transition hover:bg-cream hover:text-ink">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="grid size-11 place-items-center rounded-full bg-cream/15 text-cream ring-1 ring-cream/30 backdrop-blur transition hover:bg-cream hover:text-ink">
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
