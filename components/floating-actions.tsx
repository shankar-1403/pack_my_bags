"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp, FaArrowUp } from "react-icons/fa6";

/** Bottom-right: a scroll-to-top arrow (once you have scrolled) above a WhatsApp chat button. */
export function FloatingActions({ whatsapp }: { whatsapp: string }) {
  const [showTop, setShowTop] = useState(false);
  const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi PackMyBags, I’d like to know more about your trips.")}`;

  useEffect(() => {
    // On the home page the scroll drives the suitcase film; the arrow waits until the film has finished.
    const introDone = () => {
      if (document.documentElement.dataset.intro !== "on") return true;
      const runway = document.querySelector<HTMLElement>("[data-intro-runway]");
      const stage = runway?.firstElementChild as HTMLElement | null;
      if (!runway || !stage) return true;
      const rect = runway.getBoundingClientRect();
      return -rect.top >= rect.height - stage.offsetHeight - 1;
    };
    const onScroll = () => setShowTop(window.scrollY > 320 && introDone());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3 md:bottom-8 md:right-8">
      {/* The arrow sits above WhatsApp only while visible — out of the layout when hidden. */}
      {showTop ? (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-[#f94f18] text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 hover:bg-[#b85324] md:size-14"
        >
          <FaArrowUp className="size-5" strokeWidth={2} />
        </button>
      ) : null}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="pointer-events-auto flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe57] md:size-14"
      >
        <FaWhatsapp className="size-7"/>
      </a>
    </div>
  );
}
