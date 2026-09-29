"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Post } from "@/lib/types";

const stitches = [0, 1, 2, 3, 4, 5, 6];
const coverEdge = Array.from({ length: 11 }, (_, layer) => layer);

export function JournalShelf({ posts }: { posts: Post[] }) {
  const root = useRef<HTMLDivElement>(null);
  const turns = Math.max(posts.length, 1);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const leaves = [...node.querySelectorAll<HTMLElement>("[data-leaf]")];
    const left = node.querySelector<HTMLElement>("[data-left]");
    const right = node.querySelector<HTMLElement>("[data-right]");
    const spine = node.querySelector<HTMLElement>("[data-spine]");
    const folio = node.querySelector<HTMLElement>("[data-folio]");
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const bookHeight = right?.offsetHeight ?? 0;
      const span = Math.max(rect.height - bookHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), span);
      const cursor = leaves.length < 2 ? 0 : (scrolled / span) * (leaves.length - 1);
      const pageWidth = right?.getBoundingClientRect().width ?? 0;
      const cover = Math.min(1, Math.max(0, cursor));
      const shift = 1 - (1 - Math.min(1, cover / 0.36)) ** 3;
      const coverTurn = Math.min(1, Math.max(0, (cover - 0.28) / 0.72));

      const opened = coverTurn >= 0.995;
      if (left) left.style.width = `${shift * pageWidth}px`;
      const sheet = left?.querySelector<HTMLElement>("[data-sheet]");
      if (sheet) sheet.style.opacity = opened ? "1" : "0";
      node.querySelectorAll<HTMLElement>("[data-shadow]").forEach((shadow) => {
        shadow.style.opacity = opened ? "1" : "0";
      });
      if (spine) {
        spine.style.width = opened ? "0px" : "40px";
        spine.style.opacity = opened ? "0" : "1";
      }

      leaves.forEach((leaf, index) => {
        const local = index === 0 ? coverTurn : Math.min(1, Math.max(0, cursor - index));
        const turned = local >= 0.995;
        leaf.style.visibility = turned ? "hidden" : "visible";
        if (index === 0) {
          leaf.style.right = "";
          leaf.style.width = "";
          const fade = local <= 0.01 || local >= 0.99 ? 0 : 1;
          leaf.querySelectorAll<HTMLElement>("[data-edge]").forEach((edge) => {
            edge.style.opacity = String(fade);
          });
        }
        leaf.style.transform = `rotateY(${local * -180}deg)`;
        leaf.style.zIndex = local > 0.5 ? String(index) : String(100 + leaves.length - index);
        leaf.style.pointerEvents = !turned && index === Math.min(leaves.length - 1, Math.round(cursor)) ? "auto" : "none";
      });

      if (folio) {
        const story = Math.max(0, Math.min(posts.length, Math.round(cursor)));
        folio.textContent = story === 0 ? "Cover" : `${story} / ${posts.length}`;
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
  }, [posts]);

  return (
    <div ref={root} className="relative mt-10" style={{ height: `${turns * 200 + 80}vh` }}>
      <div className="sticky top-[calc(var(--site-header-height,7.5rem)+1rem)]">
        <div data-book className="mx-auto flex h-[min(62vh,560px)] items-stretch justify-center">
          <div data-left className="relative h-full" style={{ width: 0 }}>
            <div className="pointer-events-none absolute inset-0" style={{ clipPath: "inset(calc(100% - 42px) 0px -14px -8px)" }}>
              <span
                data-shadow
                aria-hidden
                className="absolute inset-0 rounded-l-[28px] bg-[#f7f1e6]"
                style={{ opacity: 0, filter: "drop-shadow(0 5px 2px rgba(154, 148, 140, 0.9))" }}
              />
            </div>
            <div className="relative h-full overflow-hidden">
              <div data-sheet className="relative h-full rounded-l-[28px] bg-[#f7f1e6]" style={{ opacity: 0 }}>
                <span className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[#6a655f]/80 to-transparent" />
              </div>
            </div>
          </div>
          <div className="flex h-full shrink-0">
            <div data-spine className="relative h-full w-10 shrink-0 overflow-hidden bg-[#163028]">
              <span className="absolute inset-x-0 top-0 h-2 bg-[#d4652f]" />
              <span className="absolute inset-x-0 bottom-0 h-2 bg-[#d4652f]" />
              <span className="absolute top-6 bottom-6 left-1/2 w-px -translate-x-1/2 bg-[#c4a36a]/80" />
              <span className="absolute inset-y-8 left-0 flex w-full flex-col justify-between">
                {stitches.map((stitch) => (
                  <span key={stitch} className="relative mx-auto block h-4 w-6">
                    <span className="absolute top-0 left-0 h-4 w-px bg-[#c4a36a]" />
                    <span className="absolute top-0 right-0 h-4 w-px bg-[#c4a36a]" />
                    <span className="absolute top-0 left-0 h-px w-6 bg-[#c4a36a]" />
                    <span className="absolute bottom-0 left-0 h-px w-6 bg-[#c4a36a]" />
                  </span>
                ))}
              </span>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#163028] px-0.5 font-header text-[9px] font-semibold uppercase tracking-[0.22em] text-[#e7c99a] [writing-mode:vertical-rl] rotate-180">
                Journal
              </span>
            </div>
            <div data-right className="relative h-full w-[min(420px,calc((100vw-6rem)/2))] [perspective:1800px] [transform-style:preserve-3d]">
            <div className="pointer-events-none absolute inset-0 z-0" style={{ clipPath: "inset(calc(100% - 42px) -8px -14px 0px)" }}>
              <span
                data-shadow
                aria-hidden
                className="absolute inset-0 bg-[#fbf8f3]"
                style={{ opacity: 0, borderRadius: "0 28px 28px 0", filter: "drop-shadow(0 5px 2px rgba(154, 148, 140, 0.9))" }}
              />
            </div>
            <article data-leaf className="absolute inset-0 origin-left [transform-style:preserve-3d]">
              <div data-face="front" className="absolute inset-0 overflow-hidden [backface-visibility:hidden]" style={{ borderRadius: "0 28px 28px 0", transform: "translateZ(10px)" }}>
                <CoverFace side="right" />
              </div>
              <span aria-hidden className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: "rotateY(180deg)" }}>
                <span className="relative block h-full rounded-l-[28px] bg-[#efe6d8]">
                  <span className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[#6a655f]/70 to-transparent" />
                </span>
              </span>
              <span data-edge aria-hidden className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]" style={{ opacity: 0 }}>
                {coverEdge.map((layer) => (
                  <span
                    key={layer}
                    className="absolute inset-0 box-border border-r-[10px] border-y-0 border-l-0"
                    style={{ borderColor: "#1b3a33", borderRadius: "0 28px 28px 0", transform: `translateZ(${layer}px)` }}
                  />
                ))}
              </span>
            </article>
            {posts.map((post) => (
              <article key={post.id} data-leaf className="absolute inset-0 origin-left [transform-style:preserve-3d]">
                <Link href={`/blog/${post.slug}`} data-face="front" className="absolute inset-0 overflow-hidden [backface-visibility:hidden]" style={{ borderRadius: "0 28px 28px 0" }}>
                  <StoryFace post={post} side="right" />
                </Link>
                <span aria-hidden className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <span className="relative block h-full rounded-l-[28px] bg-[#efe6d8]">
                  <span className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-[#6a655f]/70 to-transparent" />
                </span>
                </span>
              </article>
            ))}
          </div>
          </div>
        </div>
        <p data-folio className="pointer-events-none mt-4 text-center font-header text-[11px] font-semibold uppercase tracking-[0.18em] text-mist">
          Cover
        </p>
      </div>
    </div>
  );
}

function CoverFace({ side }: { side: "left" | "right" }) {
  return (
    <div className={`relative h-full overflow-hidden bg-pine text-cream ${side === "left" ? "rounded-none" : ""}`}>
      <div className={`absolute border border-[#e7c99a]/35 ${side === "right" ? "inset-y-4 right-4 left-0 rounded-r-[18px] border-l-0" : "inset-y-4 inset-x-4 border-x"}`} />
      <span className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/25 to-transparent" />
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-header text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0c7b0]">Pack my bags</p>
        <h2 className="mt-4 font-serif text-4xl leading-none tracking-tight sm:text-5xl">Stories from the desk</h2>
        <p className="mt-4 max-w-xs text-sm leading-7 text-cream/75">Notes on packing, pacing, and choosing a first group trip.</p>
      </div>
    </div>
  );
}

function StoryFace({ post, side }: { post: Post; side: "left" | "right" }) {
  return (
    <div className={`relative flex h-full flex-col overflow-hidden bg-[#fbf8f3] ${side === "left" ? "rounded-none" : ""}`}>
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#6a655f]/80 to-transparent" />
      <span className="relative block h-[46%] overflow-hidden">
        <span aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${post.image}")` }} />
      </span>
      <span className="flex flex-1 flex-col px-6 py-4">
        <span className="font-header text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">
          {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {post.readMinutes} min
        </span>
        <h2 className="mt-2 font-serif text-2xl leading-tight tracking-tight sm:text-3xl">{post.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">{post.excerpt}</p>
      </span>
    </div>
  );
}
