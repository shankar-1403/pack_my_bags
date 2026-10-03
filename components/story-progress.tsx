"use client";

import { useEffect, useRef, useState } from "react";

export function StoryProgress({ targetId, minutes }: { targetId: string; minutes: number }) {
  const bar = useRef<HTMLSpanElement>(null);
  const [left, setLeft] = useState(minutes);

  useEffect(() => {
    const body = document.getElementById(targetId);
    if (!body) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = body.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - rect.top) / rect.height));
      if (bar.current) bar.current.style.transform = `scaleY(${progress})`;
      setLeft(Math.ceil(minutes * (1 - progress)));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [targetId, minutes]);

  return (
    <div className="flex gap-5">
      <span className="relative w-px self-stretch overflow-hidden bg-ink/10">
        <span ref={bar} className="absolute inset-0 origin-top bg-[#f94f18]" style={{ transform: "scaleY(0)" }} />
      </span>
      <div className="py-1">
        <p className="font-header text-[11px] font-semibold uppercase tracking-[0.24em] text-mist">Reading</p>
        <p className="mt-2 font-serif text-2xl tracking-tight tabular-nums" aria-live="off">
          {left > 0 ? `${left} min left` : <span className="italic">Finished</span>}
        </p>
      </div>
    </div>
  );
}
