"use client";

import { useEffect, useRef, useState } from "react";
import type { IntroScene } from "./scene";
import { progress, progressAtTravel, RUNWAY_VH } from "./timeline";

const INTRO_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const HEADER = "var(--site-header-height,7.5rem)";
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
      const box = stage.getBoundingClientRect();
      const header = document.querySelector("header");
      const targets: { element: Element; origin: { x: number; y: number } }[] = [{ element: hero, origin: { x: box.left, y: box.top } }];
      if (header) targets.push({ element: header, origin: { x: box.left, y: 0 } });
      const shot = await captureTargets(targets, box.width, box.height, 2560 / box.width);
      if (disposed || !scene) return;
      scene.setScreen(shot);
      paint(current);
    };

    const onResize = () => {
      if (!scene) return;
      scene.resize(stage.clientWidth, stage.clientHeight);
      onScroll();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(capture, 300);
    };

    (async () => {
      try {
        const { createIntroScene } = await import("./scene");
        await document.fonts.ready;
        if (disposed) return;
        scene = createIntroScene(canvas, stage.clientWidth, stage.clientHeight, () => paint(current));
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
    <section ref={sectionRef} className={`relative ${on("md:motion-safe:-mt-[var(--site-header-height,7.5rem)]")}`}>
      <div
        ref={stageRef}
        className={`relative ${on("md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:min-h-[100dvh] md:motion-safe:overflow-hidden")}`}
      >
        <div ref={heroRef} className={on("md:motion-safe:pt-[var(--site-header-height,7.5rem)]")}>
          {children}
        </div>

        {fallback ? null : (
          <div ref={coverRef} className="absolute inset-0 hidden md:motion-safe:block">
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

            <div
              aria-hidden
              data-beat
              data-from="0"
              data-to={progressAtTravel(0.2)}
              className="pointer-events-none absolute inset-y-0 left-0 w-[62%]"
              style={{ background: "linear-gradient(90deg, rgba(243,238,230,0.78), rgba(243,238,230,0.5) 45%, rgba(243,238,230,0))" }}
            />
            <div
              aria-hidden
              data-beat
              data-from="0"
              data-to={progressAtTravel(0.2)}
              className="pointer-events-none absolute left-0 right-0 mx-auto w-full max-w-7xl px-5"
              style={{ top: `calc(${HEADER} + 7vh)` }}
            >
              <div className="[text-shadow:0_0_14px_rgba(243,238,230,0.95),0_0_32px_rgba(243,238,230,0.75)]">
                <p className="font-header text-[11px] font-semibold uppercase tracking-[0.28em] text-clay">Group trips across India and beyond</p>
                <h2 className="mt-5 font-serif text-6xl leading-[0.95] tracking-tight text-ink xl:text-7xl">Pack light.</h2>
                <p className="mt-4 font-serif text-3xl italic tracking-tight text-pine xl:text-4xl">We’ve planned the rest.</p>
              </div>
            </div>

            <div
              aria-hidden
              data-beat
              data-from={progress(0.585)}
              data-to={progress(0.7)}
              className="pointer-events-none absolute left-0 right-0 top-1/2 mx-auto w-full max-w-7xl -translate-y-1/2 px-5"
            >
              <div className="max-w-[15rem]">
                <p className="font-header text-[11px] font-semibold uppercase tracking-[0.28em] text-clay">Inside every departure</p>
                <ul className="mt-5 space-y-3 font-serif text-2xl leading-tight tracking-tight text-ink">
                  <li>Fixed dates</li>
                  <li>Stays we have slept in</li>
                  <li className="italic text-pine">A captain on the trip</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      {fallback ? null : <div aria-hidden className="hidden md:motion-safe:block" style={{ height: `${RUNWAY_VH}vh` }} />}
    </section>
  );
}
