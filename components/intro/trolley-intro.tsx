"use client";

import { useEffect, useRef, useState } from "react";
import type { IntroScene } from "./scene";
import { progress, progressAtTravel, RUNWAY_VH } from "./timeline";

const INTRO_QUERY = "(prefers-reduced-motion: no-preference)";
const FADE_FROM = progress(0.965);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const window01 = (p: number, from: number, to: number) =>
  smooth(clamp01((p - (from - 0.03)) / 0.03)) * (1 - smooth(clamp01((p - to) / 0.03)));

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")";

export function TrolleyIntro({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!window.matchMedia(INTRO_QUERY).matches) return;
    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const hero = heroRef.current!;
    const cover = coverRef.current!;
    const beats = [...stage.querySelectorAll<HTMLElement>("[data-beat]")].map((el) => ({
      el,
      from: Number(el.dataset.from),
      to: Number(el.dataset.to),
    }));
    const root = document.documentElement;
    root.dataset.intro = "on";
    window.dispatchEvent(new Event("scroll"));

    let scene: IntroScene | null = null;
    let disposed = false;
    let frame = 0;
    let target = 0;
    let current = 0;
    let resizeTimer = 0;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const span = Math.max(1, rect.height - stage.offsetHeight);
      target = clamp01(-rect.top / span);
    };

    // Portrait framing keeps the traveller's shoulders just clear of the site header.
    const headerHeight = () => document.querySelector<HTMLElement>("header")?.offsetHeight ?? 0;

    const paint = (p: number) => {
      scene?.render(p);
      cover.style.opacity = String(1 - smooth(clamp01((p - FADE_FROM) / (1 - FADE_FROM))));
      cover.style.visibility = p >= 0.999 ? "hidden" : "visible";
      for (const beat of beats) {
        const o = window01(p, beat.from, beat.to);
        beat.el.style.opacity = String(o);
        beat.el.style.transform = `translate3d(0, ${(1 - o) * 18}px, 0)`;
      }
      hero.inert = p < 0.98;
    };

    const tick = () => {
      const diff = target - current;
      current = Math.abs(diff) < 0.0004 ? target : current + diff * 0.1;
      paint(current);
      frame = current === target ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      measure();
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const capture = async () => {
      if (!scene || disposed) return;
      const { captureTargets } = await import("./capture");
      const box = cover.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const header = document.querySelector("header");
      const targets: { element: Element; origin: { x: number; y: number } }[] = [{ element: hero, origin: { x: box.left, y: box.top } }];
      if (header) targets.push({ element: header, origin: { x: box.left, y: 0 } });
      const shot = await captureTargets(targets, box.width, box.height, Math.min(2560 / box.width, 2560 / box.height));
      if (disposed || !scene) return;
      scene.setScreen(shot);
      paint(current);
    };

    const onResize = () => {
      if (!scene) return;
      scene.resize(cover.clientWidth, cover.clientHeight, headerHeight());
      onScroll();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(capture, 300);
    };

    (async () => {
      try {
        const { createIntroScene } = await import("./scene");
        await document.fonts.ready;
        if (disposed) return;
        scene = createIntroScene(canvas, cover.clientWidth, cover.clientHeight, headerHeight(), () => paint(current));
      } catch {
        if (disposed) return;
        delete root.dataset.intro;
        window.dispatchEvent(new Event("scroll"));
        setFallback(true);
        return;
      }
      measure();
      current = target;
      paint(current);
      canvas.dataset.ready = "true";
      requestAnimationFrame(() => requestAnimationFrame(capture));
    })();

    measure();
    current = target;
    paint(current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      if (frame) cancelAnimationFrame(frame);
      scene?.dispose();
      hero.inert = false;
      delete root.dataset.intro;
      window.dispatchEvent(new Event("scroll"));
    };
  }, []);

  const on = (classes: string) => (fallback ? "" : classes);

  return (
    <section ref={sectionRef} className={`relative ${on("motion-safe:-mt-[var(--site-header-height,7.5rem)]")}`}>
      <div
        ref={stageRef}
        className={`relative ${on("motion-safe:sticky motion-safe:top-0 motion-safe:min-h-[100dvh] motion-safe:overflow-hidden")}`}
      >
        <div ref={heroRef} className={on("motion-safe:pt-[var(--site-header-height,7.5rem)]")}>
          {children}
        </div>

        {fallback ? null : (
          // Sized to the screen, not the hero: on phones the hero runs taller than the viewport.
          <div ref={coverRef} className="absolute inset-x-0 top-0 hidden h-[100dvh] motion-safe:block">
            <div aria-hidden className="absolute inset-0 bg-[#eee7db]" />
            <canvas
              ref={canvasRef}
              aria-hidden
              className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[ready]:opacity-100"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(58,42,26,0.22) 100%)" }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
            {/* Portrait: the header sits on paper and the film rises out of it just below, cropped at the
                shoulders. It clears before the dive so the last frame matches the hero. */}
            <div
              aria-hidden
              data-beat
              data-from="0"
              data-to={progress(0.79)}
              className="pointer-events-none absolute inset-x-0 top-0 hidden h-[calc(var(--site-header-height,7.5rem)+1.75rem)] portrait:block"
              style={{ background: "linear-gradient(180deg, #eee7db calc(100% - 2.5rem), rgba(238,231,219,0))" }}
            />

            <div
              aria-hidden
              data-beat
              data-from="0"
              data-to={progressAtTravel(0.2)}
              className="pointer-events-none absolute inset-y-0 left-0 w-[62%] portrait:hidden"
              style={{ background: "linear-gradient(90deg, rgba(243,238,230,0.78), rgba(243,238,230,0.5) 45%, rgba(243,238,230,0))" }}
            />
            {/* Portrait: titles sit low over the floor, on a wash rising from the bottom edge. */}
            <div
              aria-hidden
              data-beat
              data-from="0"
              data-to={progressAtTravel(0.2)}
              className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[42%] portrait:block"
              style={{ background: "linear-gradient(0deg, rgba(243,238,230,0.9), rgba(243,238,230,0.6) 45%, rgba(243,238,230,0))" }}
            />
            <div
              aria-hidden
              data-beat
              data-from={progress(0.585)}
              data-to={progress(0.7)}
              className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[34%] portrait:block"
              style={{ background: "linear-gradient(0deg, rgba(243,238,230,0.9), rgba(243,238,230,0.6) 45%, rgba(243,238,230,0))" }}
            />
            <div
              aria-hidden
              data-beat
              data-from="0"
              data-to={progressAtTravel(0.2)}
              className="pointer-events-none absolute left-0 right-0 top-[calc(var(--site-header-height,7.5rem)+7vh)] mx-auto w-full max-w-7xl px-4 sm:px-5 portrait:top-auto portrait:bottom-[max(2.5rem,6dvh)]"
            >
              <div className="[text-shadow:0_0_14px_rgba(243,238,230,0.95),0_0_32px_rgba(243,238,230,0.75)]">
                <p className="font-header text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f94f18]">Group trips across India and beyond</p>
                <h2 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight text-ink sm:mt-5 sm:text-6xl xl:text-7xl">Pack light.</h2>
                <p className="mt-2 font-serif text-2xl italic tracking-tight text-pine sm:mt-4 sm:text-3xl xl:text-4xl">We’ve planned the rest.</p>
              </div>
            </div>

            <div
              aria-hidden
              data-beat
              data-from={progress(0.585)}
              data-to={progress(0.7)}
              className="pointer-events-none absolute left-0 right-0 top-1/2 mx-auto w-full max-w-7xl -translate-y-1/2 px-4 sm:px-5 portrait:top-auto portrait:bottom-[max(2.5rem,6dvh)] portrait:translate-y-0"
            >
              <div className="max-w-[15rem] portrait:max-w-none">
                <p className="font-header text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f94f18]">Inside every departure</p>
                <ul className="mt-5 space-y-3 font-serif text-2xl leading-tight tracking-tight text-ink portrait:mt-3 portrait:flex portrait:flex-wrap portrait:gap-x-4 portrait:gap-y-1 portrait:space-y-0 portrait:text-xl">
                  <li>Fixed dates</li>
                  <li>Stays we have slept in</li>
                  <li className="italic text-pine">A captain on the trip</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      {fallback ? null : <div aria-hidden className="hidden motion-safe:block" style={{ height: `${RUNWAY_VH}vh` }} />}
    </section>
  );
}
