import type { Metadata } from "next";
import { Fraunces, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "PackMyBags",
    template: "%s · PackMyBags",
  },
  icons:"/favicon.svg",
  description:
    "Upcoming group trips across India and beyond. Fixed dates, handpicked stays, and captains who travel with you.",
};

// Runs before the page paints. The home intro plays when a visit starts on the home page (from a search, a
// link, or the address bar). A refresh, or reaching Home from another page of the site, opens on the hero.
// "?intro" in the address always plays it.
const INTRO_GATE = `try{var d=document.documentElement,n=performance.getEntriesByType("navigation")[0],r=n&&n.type==="reload",v=false;try{v=!!sessionStorage.getItem("pmb-visit");sessionStorage.setItem("pmb-visit","1")}catch(e){}if(!/[?&]intro\\b/.test(location.search)&&(r||v||location.pathname!=="/"))d.setAttribute("data-intro-skip","")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${outfit.variable} ${fraunces.variable} ${jakarta.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      </head>
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
