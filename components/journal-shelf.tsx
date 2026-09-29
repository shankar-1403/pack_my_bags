"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Post } from "@/lib/types";

const PAPER = "#fbf8f2";
const PAPER_BACK = "#f3ecdf";
const BOARD = "#163028";
const GILT = "#d9bb86";
const EDGE_TONES = ["#f4eee3", "#f0e9dc", "#ece4d5", "#e8dfce", "#e4d9c7", "#dfd3bf"];
const BLOCK_MIN = 1.5;
const BLOCK_MAX = 6;
const BOARD_EDGE = 3;
const BOARD_BASE = 2;
const COVER_DEPTH = 10;
const COVER_RADIUS = 20;
const ARC_STEPS = 6;
const EDGE_DARK = "#122a22";
const EDGE_LIGHT = "#244a3f";

const px = (n: number) => `${n.toFixed(2)}px`;
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function JournalShelf({ posts }: { posts: Post[] }) {
  const root = useRef<HTMLDivElement>(null);
  const turns = Math.max(posts.length, 1);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const stage = node.querySelector<HTMLElement>("[data-stage]");
    const pin = node.querySelector<HTMLElement>("[data-pin]");
    const ground = node.querySelector<HTMLElement>("[data-ground]");
    const folio =node.querySelector<HTMLElement>("[data-folio]");
    const bar = node.querySelector<HTMLElement>("[data-bar]");
    const leaves = [...node.querySelectorAll<HTMLElement>("[data-leaf]")].map((leaf) => ({
      leaf,
      shades: [...leaf.querySelectorAll<HTMLElement>("[data-shade]")],
    }));
    const half = node.querySelector<HTMLElement>("[data-half]");
    const blocks = (["left", "right"] as const).map((side) => ({
      board: node.querySelector<HTMLElement>(`[data-board="${side}"]`),
      layers: [...node.querySelectorAll<HTMLElement>(`[data-stack="${side}"]`)].map((el) => ({
        el,
        f: Number(el.dataset.step) / EDGE_TONES.length,
      })),
    }));
    const stories = Math.max(posts.length, 1);
    const last = Math.max(leaves.length - 1, 1);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let target = 0;
    let current = 0;
    let frame = 0;
    let pageWidth = 1;

    // Widen from the spine only, so the stack shows on the fore-edge while the gutter and bottom stay level.
    const widen = (dx: number, base = 0) => `translate3d(0, ${base}px, 0) scaleX(${(pageWidth + dx) / pageWidth})`;

    const measure = () => {
      pageWidth = half?.offsetWidth || 1;
      const rect = node.getBoundingClientRect();
      const span = Math.max(rect.height - (pin?.offsetHeight ?? 0), 1);
      target = (clamp(-rect.top, 0, span) / span) * last;
    };

    const paint = (cursor: number) => {
      const open = easeInOut(clamp(cursor / 0.85));
      if (stage) stage.style.transform = `translate3d(${(open - 1) * 25}%, 0, 0)`;
      if (ground) ground.style.transform = `translateX(${(1 - open) * 25}%) scaleX(${0.46 + 0.46 * open})`;

      // The story showing on the right stays clickable mid-scroll; once a page visibly lifts, the one beneath takes over.
      const base = Math.floor(cursor);
      const active = easeInOut(clamp(cursor - base)) < 0.15 ? base : base + 1;

      let turned = 0;
      leaves.forEach(({ leaf, shades }, index) => {
        const local = easeInOut(clamp(cursor - index));
        if (index > 0) turned += local;
        leaf.style.transform = `rotateY(${local * -180}deg)`;
        leaf.style.zIndex = String(local > 0.5 ? index + 1 : 200 - index);
        leaf.style.pointerEvents = index === active ? "auto" : "none";
        const shade = String(Math.sin(local * Math.PI) * 0.28);
        shades.forEach((s) => (s.style.opacity = shade));
      });

      const depths = [BLOCK_MIN + (BLOCK_MAX * turned) / stories, BLOCK_MIN + (BLOCK_MAX * (stories - turned)) / stories];
      blocks.forEach(({ board, layers }, i) => {
        const depth = depths[i];
        layers.forEach(({ el, f }) => (el.style.transform = widen(depth * f)));
        if (board) board.style.transform = widen(depth + BOARD_EDGE, BOARD_BASE);
      });

      const story = Math.round(cursor);
      if (folio) folio.textContent = story === 0 ? "Cover" : `Story ${story} of ${posts.length}`;
      if (bar) bar.style.transform = `scaleX(${cursor / last})`;
    };

    const tick = () => {
      const diff = target - current;
      current = reduced.matches || Math.abs(diff) < 0.0008 ? target : current + diff * 0.12;
      paint(current);
      frame = current === target ? 0 : window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      measure();
      if (!frame) frame = window.requestAnimationFrame(tick);
    };

    measure();
    current = target;
    paint(current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [posts]);

  return (
    <div ref={root} className="relative mt-10" style={{ height: `${turns * 160 + 100}vh` }}>
      <div
        data-pin
        className="sticky flex flex-col items-center justify-center overflow-hidden"
        style={{
          top: "var(--site-header-height, 5rem)",
          height: "calc(100dvh - var(--site-header-height, 5rem))",
          ["--page-w" as string]: "min(420px, calc(50vw - 1.25rem), calc((100dvh - var(--site-header-height, 5rem) - 11rem) * 0.72))",
        }}
      >
        <div data-stage className="relative flex will-change-transform" style={{ width: "calc(var(--page-w) * 2)", height: "calc(var(--page-w) / 0.72)" }}>
          {/* ground shadow */}
          <span
            data-ground
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -bottom-6 h-10 rounded-[50%] bg-[#3b2f22]/25 blur-2xl"
            style={{ transform: "translateX(25%) scaleX(0.46)" }}
          />

          <div aria-hidden className="h-full w-1/2" />

          {/* right side: page block + leaves */}
          <div data-half className="relative h-full w-1/2 [perspective:3200px]">
            <PageBlock side="right" />

            <article data-leaf className="absolute inset-0 origin-left will-change-transform [transform-style:preserve-3d]">
              <div
                className="absolute inset-0 overflow-hidden rounded-r-[20px] [backface-visibility:hidden]"
                style={{ transform: `translateZ(${COVER_DEPTH / 2}px)` }}
              >
                <CoverFace />
                <span data-shade aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
              </div>
              <CoverEdge />
              <div
                className="absolute inset-0 [backface-visibility:hidden]"
                style={{ transform: `rotateY(180deg) translateZ(${COVER_DEPTH / 2}px)` }}
              >
                <PageBlock side="left" />
                <div className="absolute inset-0 overflow-hidden rounded-l-[18px]" style={{ background: PAPER_BACK }}>
                  <Endpaper />
                  <span data-shade aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
                </div>
              </div>
            </article>

            {posts.map((post, i) => (
              <article key={post.id} data-leaf className="absolute inset-0 origin-left will-change-transform [transform-style:preserve-3d]">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group absolute inset-0 overflow-hidden rounded-r-[18px] outline-none [backface-visibility:hidden] focus-visible:ring-2 focus-visible:ring-clay"
                >
                  <StoryFace post={post} />
                  <span data-shade aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
                </Link>
                <div aria-hidden className="absolute inset-0 overflow-hidden rounded-l-[18px] [backface-visibility:hidden] [transform:rotateY(180deg)]" style={{ background: PAPER_BACK }}>
                  <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#5c4a36]/20 to-transparent" />
                  <span className="absolute bottom-6 left-7 font-header text-[10px] font-semibold uppercase tracking-[0.2em] text-mist/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="absolute inset-x-10 top-1/2 -translate-y-1/2 text-center font-serif text-xl leading-snug text-ink/45 italic">
                    {post.excerpt.split(".")[0]}.
                  </p>
                  <span data-shade className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 flex w-40 flex-col items-center gap-3">
          <p data-folio className="font-header text-[10px] font-semibold uppercase tracking-[0.24em] text-mist tabular-nums">
            Cover
          </p>
          <span className="relative h-px w-full overflow-hidden bg-ink/10">
            <span data-bar className="absolute inset-0 origin-left bg-clay" style={{ transform: "scaleX(0)" }} />
          </span>
        </div>
      </div>
    </div>
  );
}

function PageBlock({ side }: { side: "left" | "right" }) {
  const right = side === "right";
  const shape = right ? "origin-top-left rounded-r-[18px]" : "origin-top-right rounded-l-[18px]";
  const edgeLine = right ? "inset -1px -1px 0 rgba(110, 88, 60, 0.16)" : "inset 1px -1px 0 rgba(110, 88, 60, 0.16)";
  return (
    <>
      <span
        data-board={side}
        aria-hidden
        className={`absolute inset-0 ${right ? "origin-top-left rounded-r-[20px]" : "origin-top-right rounded-l-[20px]"}`}
        style={{ background: BOARD }}
      />
      {[...EDGE_TONES].reverse().map((tone, i) => (
        <span
          key={tone}
          data-stack={side}
          data-step={EDGE_TONES.length - i}
          aria-hidden
          className={`absolute inset-0 ${shape}`}
          style={{ background: tone, boxShadow: edgeLine }}
        />
      ))}
    </>
  );
}

// The board's outer rim as real 3D geometry: straight bands on the top, fore-edge and bottom, and short chords
// tracing each rounded corner, so the cover reads as one solid slab at every angle.
function CoverEdge() {
  const t = COVER_DEPTH + 1;
  const r = COVER_RADIUS;
  const across = (deg: number) => `linear-gradient(${deg}deg, ${EDGE_DARK} 0%, ${EDGE_LIGHT} 50%, ${EDGE_DARK} 100%)`;
  const step = Math.PI / 2 / ARC_STEPS;
  const chord = 2 * r * Math.sin(step / 2) + 0.75;
  const reach = r * Math.cos(step / 2);

  const pieces: React.CSSProperties[] = [
    { left: 0, right: r, top: -t / 2, height: t, transform: "rotateX(90deg)", background: across(180) },
    { left: 0, right: r, bottom: -t / 2, height: t, transform: "rotateX(90deg)", background: across(180) },
    { right: -t / 2, top: r, bottom: r, width: t, transform: "rotateY(90deg)", background: across(90) },
  ];

  for (let i = 0; i < ARC_STEPS * 2; i++) {
    const bottom = i >= ARC_STEPS;
    const angle = (bottom ? 0 : -Math.PI / 2) + step * ((i % ARC_STEPS) + 0.5);
    const dx = reach * Math.cos(angle);
    const dy = reach * Math.sin(angle);
    pieces.push({
      width: px(chord),
      height: t,
      right: px(r - dx - chord / 2),
      ...(bottom ? { bottom: px(r - dy - t / 2) } : { top: px(r + dy - t / 2) }),
      transform: `rotateZ(${((angle * 180) / Math.PI + 90).toFixed(2)}deg) rotateX(90deg)`,
      background: across(180),
    });
  }

  return (
    <>
      <span aria-hidden className="absolute inset-0 rounded-r-[20px]" style={{ background: EDGE_DARK }} />
      {pieces.map((style, i) => (
        <span key={i} aria-hidden className="absolute" style={style} />
      ))}
    </>
  );
}

function CoverFace() {
  return (
    <div className="relative h-full text-cream" style={{ background: `radial-gradient(120% 80% at 70% 20%, #1f4238 0%, ${BOARD} 60%, #0f231d 100%)` }}>
      <span className="absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
      <span className="absolute inset-y-0 left-7 w-px bg-white/10" />
      <div className="absolute inset-5 left-10 rounded-[12px] border" style={{ borderColor: `${GILT}55` }} />
      <div className="absolute inset-[26px] left-[46px] rounded-[9px] border" style={{ borderColor: `${GILT}26` }} />
      <div className="relative flex h-full flex-col items-center justify-center pl-8 pr-6 text-center">
        <p className="font-header text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: GILT }}>
          Pack my bags
        </p>
        <span className="mt-5 block h-px w-10" style={{ background: GILT }} />
        <h2 className="mt-5 font-serif text-4xl leading-[1.02] tracking-tight sm:text-5xl">
          Stories
          <br />
          <span className="italic" style={{ color: "#f0dcb8" }}>from the desk</span>
        </h2>
        <p className="mt-5 max-w-[15rem] text-[13px] leading-6 text-cream/65">Notes on packing, pacing, and choosing a first group trip.</p>
        <p className="absolute bottom-8 font-header text-[9px] uppercase tracking-[0.3em] text-cream/40">Scroll to open</p>
      </div>
    </div>
  );
}

function Endpaper() {
  return (
    <div className="relative h-full">
      <span className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `radial-gradient(${BOARD} 1px, transparent 1px)`, backgroundSize: "14px 14px" }} />
      <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#5c4a36]/20 to-transparent" />
      <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">
        <p className="font-header text-[10px] font-semibold uppercase tracking-[0.28em] text-clay">Ex libris</p>
        <p className="mt-3 font-serif text-2xl italic text-ink/70">The Journal</p>
      </div>
    </div>
  );
}

function StoryFace({ post }: { post: Post }) {
  return (
    <div className="relative flex h-full flex-col" style={{ background: PAPER }}>
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#5c4a36]/20 to-transparent" />
      <div className="min-h-0 flex-1 p-4 pb-0">
        <span className="relative block h-full overflow-hidden rounded-[10px]">
          <span
            aria-hidden
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
            style={{ backgroundImage: `url("${post.image}")` }}
          />
        </span>
      </div>
      <div className="flex shrink-0 flex-col px-6 pt-5 pb-6">
        <span className="font-header text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
          {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {post.readMinutes} min read
        </span>
        <h2 className="mt-3 font-serif text-2xl leading-[1.1] tracking-tight text-ink sm:text-[1.75rem]">{post.title}</h2>
        <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-ink/65">{post.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-4 font-header text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
          Read story
          <span className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">→</span>
        </span>
      </div>
    </div>
  );
}
