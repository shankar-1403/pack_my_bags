"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type Matter from "matter-js";
import { layoutTable, type TableLayout } from "./gallery/layout";
import { walnut } from "./gallery/wood";

export type Print = { place: string; region: string; photo?: string };

const STEP = 1000 / 60;
// The camera intro runs on desktop; phones (for now) and reduced motion go straight to the table.
const INTRO_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The interactive table: matter-js bodies for the prints, drawn as DOM elements. Pick a print up where
 * you touch it, flick it to throw it; everything else gets knocked.
 */
function createTable(
  M: typeof Matter,
  table: HTMLElement,
  cards: (HTMLElement | null)[],
  options: { calm: boolean },
) {
  const { Bodies, Body, Composite, Constraint, Engine } = M;
  const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
  engine.positionIterations = 10;
  engine.velocityIterations = 8;

  let layout: TableLayout | null = null;
  let bodies: Matter.Body[] = [];
  let running = false;
  let startedAt = 0;
  let top = cards.length + 10;
  const phases = cards.map((_, i) => [i * 1.7 + 0.3, i * 2.3 + 1.1, i * 0.9 + 2.2]);

  /** Lays the table out. `keep` carries positions over (a resize); `kick` gives the prints a nudge. */
  function build(next: TableLayout, keep: boolean, kick: boolean) {
    const was = layout;
    const previous = keep && was ? bodies.map((b) => ({ x: b.position.x / was.width, y: b.position.y / was.height, angle: b.angle })) : [];
    layout = next;
    const { width, height, cardW, count, homes } = next;
    const cardH = (cardW * 107) / 88;

    Composite.clear(engine.world, false);
    const thick = 400;
    const walls = [
      Bodies.rectangle(width / 2, -thick / 2, width + thick * 2, thick, { isStatic: true }),
      Bodies.rectangle(width / 2, height + thick / 2, width + thick * 2, thick, { isStatic: true }),
      Bodies.rectangle(-thick / 2, height / 2, thick, height + thick * 2, { isStatic: true }),
      Bodies.rectangle(width + thick / 2, height / 2, thick, height + thick * 2, { isStatic: true }),
    ];
    bodies = homes.map((home, i) => {
      const at = previous[i];
      const body = Bodies.rectangle(at ? at.x * width : home.x, at ? at.y * height : home.y, cardW, cardH, {
        angle: at ? at.angle : home.angle,
        chamfer: { radius: cardW * 0.025 },
        frictionAir: 0.045,
        friction: 0.3,
        restitution: 0.45,
        density: 0.0016,
      });
      if (kick && !at) Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 });
      return body;
    });
    Composite.add(engine.world, [...walls, ...bodies]);

    cards.forEach((card, i) => {
      if (!card) return;
      card.style.width = `${cardW}px`;
      card.style.height = `${cardH}px`;
      card.style.setProperty("--print", `${cardW}px`);
      card.hidden = i >= count;
    });
    paint();
  }

  function paint() {
    if (!layout) return;
    const { cardW } = layout;
    const cardH = (cardW * 107) / 88;
    bodies.forEach((body, i) => {
      const card = cards[i];
      if (card) card.style.transform = `translate3d(${body.position.x - cardW / 2}px, ${body.position.y - cardH / 2}px, 0) rotate(${body.angle}rad)`;
    });
  }

  // Picking something up: a stiff, slightly springy tie from the pointer to the exact spot you grabbed.
  let grab: { constraint: Matter.Constraint; card: HTMLElement; body: Matter.Body; id: number } | null = null;
  const local = (event: PointerEvent) => {
    const box = table.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  const onDown = (event: PointerEvent) => {
    if (!running || grab || event.button > 0) return;
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-print]");
    if (!card) return;
    const body = bodies[Number(card.dataset.print)];
    if (!body) return;
    event.preventDefault();
    const at = local(event);
    const constraint = Constraint.create({
      pointA: at,
      bodyB: body,
      pointB: { x: at.x - body.position.x, y: at.y - body.position.y },
      stiffness: 0.22,
      damping: 0.08,
      length: 0,
    });
    Composite.add(engine.world, constraint);
    grab = { constraint, card, body, id: event.pointerId };
    card.style.zIndex = String(++top);
    card.dataset.lifted = "";
    card.setPointerCapture(event.pointerId);
    wake();
  };
  // The pointer may wander off the table, but what it holds stays on it: the tie never pulls past the edge.
  const onMove = (event: PointerEvent) => {
    if (!grab || event.pointerId !== grab.id || !layout) return;
    const at = local(event);
    grab.constraint.pointA = { x: Math.min(layout.width, Math.max(0, at.x)), y: Math.min(layout.height, Math.max(0, at.y)) };
  };
  const onUp = (event: PointerEvent) => {
    if (!grab || (event.pointerId !== grab.id && event.type !== "blur")) return;
    Composite.remove(engine.world, grab.constraint);
    delete grab.card.dataset.lifted;
    grab = null;
  };
  table.addEventListener("pointerdown", onDown);
  table.addEventListener("pointermove", onMove);
  table.addEventListener("pointerup", onUp);
  table.addEventListener("pointercancel", onUp);
  table.addEventListener("lostpointercapture", onUp);
  window.addEventListener("blur", onUp as unknown as EventListener);

  // Prints drift on slow, separate currents (about 15 px a second) and creep, very gently, back toward
  // their own patch of table; a throw still lands where it lands. Speeds are capped below the point where
  // one print could slip through another.
  function float(now: number) {
    if (!layout) return;
    const cardW = layout.cardW;
    // The drift eases in over a few seconds, so the table takes over from the film without a twitch.
    const ease = smooth(clamp01((now - startedAt) / 4000));
    bodies.forEach((body, i) => {
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (speed > 38) Body.setVelocity(body, { x: (body.velocity.x / speed) * 38, y: (body.velocity.y / speed) * 38 });
      if (grab?.body === body || options.calm || !layout) return;
      const [a, b, c] = phases[i];
      const home = layout.homes[i];
      const m = body.mass;
      const drift = 2.2e-7 * m * cardW * ease;
      const pull = 1.5e-7 * m * ease;
      Body.applyForce(body, body.position, {
        x: drift * Math.sin(now * 0.00031 + a) + (home.x - body.position.x) * pull,
        y: drift * Math.cos(now * 0.00027 + b) + (home.y - body.position.y) * pull,
      });
      const turn = Math.atan2(Math.sin(home.angle - body.angle), Math.cos(home.angle - body.angle));
      Body.setAngularVelocity(body, body.angularVelocity + (0.00003 * Math.sin(now * 0.0004 + c) + turn * 0.00004) * ease);
    });
  }

  // A last guard: a print squeezed through a wall (or knocked into nonsense) comes back onto the table, still.
  function rescue() {
    if (!layout) return;
    const { width, height, cardW } = layout;
    const m = cardW * 0.5;
    bodies.forEach((body, i) => {
      const { x, y } = body.position;
      const lost = !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > width || y > height;
      if (!lost) return;
      if (grab?.body === body) onUp({ pointerId: grab.id } as PointerEvent);
      const home = layout!.homes[i];
      const fx = Number.isFinite(x) ? Math.min(width - m, Math.max(m, x)) : home.x;
      const fy = Number.isFinite(y) ? Math.min(height - m, Math.max(m, y)) : home.y;
      Body.setPosition(body, { x: fx, y: fy });
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      if (!Number.isFinite(body.angle)) Body.setAngle(body, home.angle);
    });
  }

  let frame = 0;
  let last = 0;
  let carry = 0;
  let visible = false;
  const tick = (now: number) => {
    frame = 0;
    if (!running || !visible || document.hidden) return;
    carry = Math.min(carry + (last ? now - last : STEP), STEP * 5);
    last = now;
    while (carry >= STEP) {
      float(now);
      Engine.update(engine, STEP);
      carry -= STEP;
    }
    rescue();
    paint();
    frame = requestAnimationFrame(tick);
  };
  function wake() {
    if (!frame && running && visible) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  });
  seen.observe(table);
  document.addEventListener("visibilitychange", wake);

  return {
    build,
    get layout() {
      return layout;
    },
    start() {
      running = true;
      startedAt = performance.now();
      wake();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      seen.disconnect();
      document.removeEventListener("visibilitychange", wake);
      table.removeEventListener("pointerdown", onDown);
      table.removeEventListener("pointermove", onMove);
      table.removeEventListener("pointerup", onUp);
      table.removeEventListener("pointercancel", onUp);
      table.removeEventListener("lostpointercapture", onUp);
      window.removeEventListener("blur", onUp as unknown as EventListener);
      Engine.clear(engine);
    },
  };
}

export function PolaroidTable({ prints }: { prints: Print[] }) {
  const runwayRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const woodRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const runway = runwayRef.current!;
    const table = tableRef.current!;
    const canvas = canvasRef.current!;
    const intro = window.matchMedia(INTRO_QUERY).matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wood = walnut();
    woodRef.current!.style.backgroundImage = `url(${wood.toDataURL("image/jpeg", 0.9)})`;
    let disposed = false;
    let cleanup = () => {};

    const measure = () => {
      const box = table.getBoundingClientRect();
      return layoutTable(box.width, box.height, prints.length);
    };

    (async () => {
      const matter = await import("matter-js");
      const M = (matter as unknown as { default?: typeof Matter }).default ?? (matter as unknown as typeof Matter);
      if (disposed) return;
      let handed = !intro;
      const physics = createTable(M, table, cardRefs.current, { calm });

      if (!intro) {
        physics.build(measure(), false, true);
        table.dataset.phase = "table";
        physics.start();
        const resized = new ResizeObserver(() => {
          const next = measure();
          const now = physics.layout;
          if (now && (Math.abs(next.width - now.width) > 2 || Math.abs(next.height - now.height) > 2)) physics.build(next, true, false);
        });
        resized.observe(table);
        cleanup = () => {
          resized.disconnect();
          physics.dispose();
        };
        return;
      }

      const font = getComputedStyle(table).getPropertyValue("--font-hand").trim() || "cursive";
      await document.fonts.load(`500 48px ${font}`).catch(() => undefined);
      const { createGalleryScene, flashAt, HANDOFF } = await import("./gallery/scene");
      if (disposed) return;
      const scene = createGalleryScene(canvas, { prints, font, wood });

      // The film always starts from the top when you land here (a reload included).
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
      let layout = measure();
      const place = (next: TableLayout) => {
        layout = next;
        scene.setLayout(next);
        physics.build(next, handed, false);
      };
      place(layout);
      table.dataset.phase = "intro";

      // Scroll drives the film forward only: it never rewinds, and once it is done the extra scroll it
      // used folds away without moving anything on screen.
      let target = 0;
      let current = 0;
      let frame = 0;
      const progress = () => {
        const box = runway.getBoundingClientRect();
        const span = runway.offsetHeight - table.offsetHeight;
        const stuck = parseFloat(getComputedStyle(table.parentElement!).top) || 0;
        return span > 0 ? clamp01((stuck - box.top) / span) : 1;
      };
      const paint = (p: number) => {
        scene.render(p);
        // The canvas fades in on load; after that its opacity must follow the scroll exactly.
        if (p > 0.05) canvas.style.transition = "none";
        const fade = smooth(clamp01((p - HANDOFF[0]) / (HANDOFF[1] - HANDOFF[0])));
        canvas.style.opacity = String(1 - fade);
        if (titleRef.current) {
          const o = 1 - smooth(clamp01((p - 0.04) / 0.1));
          titleRef.current.style.opacity = String(o);
          titleRef.current.style.transform = `translate3d(0, ${(1 - o) * -24}px, 0)`;
        }
        if (flashRef.current) flashRef.current.style.opacity = String(0.85 * flashAt(p));
        table.dataset.phase = p >= HANDOFF[0] - 0.02 ? "settle" : "intro";
      };
      const handoff = () => {
        handed = true;
        canvas.style.visibility = "hidden";
        table.dataset.phase = "table";
        if (hintRef.current) hintRef.current.style.opacity = "1";
        physics.start();
        // Fold the film's scroll away without moving the table on screen. The browser's scroll anchoring
        // may already compensate when the runway shrinks; correct only whatever difference is left.
        const before = table.getBoundingClientRect().top;
        runway.style.height = `${table.parentElement!.offsetHeight}px`;
        const shift = table.getBoundingClientRect().top - before;
        if (Math.abs(shift) > 0.5) window.scrollBy({ top: shift, behavior: "instant" });
      };
      const tick = () => {
        frame = 0;
        if (handed) return;
        const diff = target - current;
        current = Math.abs(diff) < 0.0004 ? target : current + diff * 0.09;
        paint(current);
        if (current >= HANDOFF[1]) return handoff();
        if (current !== target) frame = requestAnimationFrame(tick);
      };
      const onScroll = () => {
        if (handed) return;
        target = Math.max(target, progress());
        if (!frame) frame = requestAnimationFrame(tick);
      };
      scene.ready.then(() => !disposed && !handed && paint(current));
      const resized = new ResizeObserver(() => {
        const next = measure();
        if (Math.abs(next.width - layout.width) > 2 || Math.abs(next.height - layout.height) > 2) {
          place(next);
          if (!handed) paint(current);
        }
      });
      resized.observe(table);
      window.addEventListener("scroll", onScroll, { passive: true });
      paint(0);
      canvas.dataset.ready = "";
      onScroll();

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScroll);
        resized.disconnect();
        physics.dispose();
        scene.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [prints]);

  return (
    <>
      {/* Phones and reduced motion: a plain heading above the table. */}
      <div className="lg:motion-safe:hidden">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">Gallery</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight sm:text-6xl">Postcards from the road</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
          Prints from our departures, spread across the table. Pick one up, toss it, and watch the rest make room.
        </p>
      </div>

      <section
        ref={runwayRef}
        className="relative mt-10 lg:motion-safe:mt-0 lg:motion-safe:h-[calc(100svh-var(--site-header-height,6rem)-1.5rem+230vh)]"
      >
        <div className="lg:motion-safe:sticky lg:motion-safe:top-[calc(var(--site-header-height,6rem)+0.75rem)]">
          <div
            ref={tableRef}
            data-phase="intro"
            className="group/table relative h-[min(88svh,760px)] min-h-[520px] w-full lg:motion-safe:min-h-[360px] overflow-hidden rounded-[32px] bg-[#3b2618] shadow-[inset_0_2px_40px_rgba(0,0,0,0.45)] sm:h-[min(80svh,760px)] lg:motion-safe:h-[calc(100svh-var(--site-header-height,6rem)-1.5rem)]"
          >
            <div ref={woodRef} aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-center" />

            {prints.map((print, i) => (
              <figure
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-print={i}
                className="group/print absolute left-0 top-0 m-0 cursor-grab touch-none select-none transition-[scale,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform active:cursor-grabbing group-data-[phase=intro]/table:invisible data-[lifted]:scale-[1.06]"
                style={{ zIndex: i + 1 }}
              >
                <div className="flex h-full w-full flex-col rounded-[3px] bg-[#fbfaf6] px-[5.2%] pt-[5.2%] shadow-[0_1px_1px_rgba(40,30,20,0.12),0_10px_24px_-10px_rgba(40,30,20,0.35)] ring-1 ring-black/5 transition-shadow duration-300 group-data-[lifted]/print:shadow-[0_2px_3px_rgba(40,30,20,0.12),0_30px_50px_-16px_rgba(40,30,20,0.45)]">
                  <div className="relative aspect-square w-full overflow-hidden bg-[radial-gradient(130%_100%_at_30%_20%,#3a403c,#1d221f_55%,#121513)]">
                    {print.photo ? (
                      <Image src={print.photo} alt={`${print.place}, ${print.region}`} fill sizes="230px" className="pointer-events-none object-cover" draggable={false} />
                    ) : (
                      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(125deg,transparent_35%,rgba(255,255,255,0.06)_50%,transparent_65%)]" />
                    )}
                  </div>
                  <figcaption className="flex flex-1 items-center justify-center px-1 text-center font-[family-name:var(--font-hand)] leading-none text-[#26302c] [font-size:calc(var(--print,180px)*0.13)]">
                    {print.place}
                  </figcaption>
                </div>
              </figure>
            ))}

            {/* Desktop: the film plays here first. */}
            <canvas
              ref={canvasRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-0 transition-opacity duration-700 data-[ready]:opacity-100 lg:motion-safe:block"
              style={{ zIndex: 1000 }}
            />
            <div ref={flashRef} aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[#fffaf2] opacity-0 lg:motion-safe:block" style={{ zIndex: 1002 }} />
            <div
              ref={titleRef}
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-[46%] flex-col justify-center bg-[linear-gradient(90deg,rgba(18,11,7,0.72),rgba(18,11,7,0.35)_70%,transparent)] pl-12 pr-6 lg:motion-safe:flex"
              style={{ zIndex: 1001 }}
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#f94f18]">Gallery</p>
              <h1 className="mt-4 font-serif text-6xl leading-[0.95] tracking-tight text-[#f6efe4] xl:text-7xl">Postcards from the road</h1>
              <p className="mt-6 max-w-sm text-lg leading-8 text-[#efe3d2]/75">
                Every trip leaves a print. Scroll on, and the camera will hand them over.
              </p>
              <p className="mt-10 flex items-center gap-3 font-header text-[11px] font-medium uppercase tracking-[0.22em] text-[#efe3d2]/55">
                <span className="relative h-8 w-px overflow-hidden bg-[#efe3d2]/20">
                  <span className="absolute inset-x-0 top-0 h-3 animate-[scroll-cue_1.8s_ease-in-out_infinite] bg-[#efe3d2]/80" />
                </span>
                Scroll to develop
              </p>
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" style={{ zIndex: 1003 }} />
          </div>
        </div>
      </section>
      <p
        ref={hintRef}
        className="mt-4 text-center font-header text-[11px] font-medium uppercase tracking-[0.22em] text-ink/50 transition-opacity duration-700 lg:motion-safe:opacity-0"
      >
        Drag to pick up · flick to throw
      </p>
    </>
  );
}
