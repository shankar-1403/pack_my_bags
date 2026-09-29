export function Logo({ tone = "ink", wordmark = "serif" }: { tone?: "ink" | "cream"; wordmark?: "serif" | "header" }) {
  const mark = tone === "cream" ? "text-cream" : "text-ink";
  const dot = tone === "cream" ? "#e7b598" : "#d4652f";
  const stroke = tone === "cream" ? "#fbf8f3" : "#17140f";

  return (
    <span className={`inline-flex items-center gap-2.5 ${mark}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="10" fill="currentColor" />
        <path d="M7 23c7-1 9-10 18-13" fill="none" stroke={tone === "cream" ? "#1b3a33" : "#f3eee6"} strokeWidth="1.7" />
        <circle cx="23.5" cy="10" r="2.1" fill={dot} stroke={stroke} strokeWidth="0" />
      </svg>
      <span className={`${wordmark === "header" ? "font-header font-semibold tracking-[-0.04em]" : "font-serif tracking-tight"} text-xl leading-none sm:text-2xl`}>Pack my bags</span>
    </span>
  );
}
