import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Frame } from "@/components/frame";
import { StoryProgress } from "@/components/story-progress";
import { publishedPosts } from "@/lib/content";

type Context = { params: Promise<{ slug: string }> };

const GILT = "#d9bb86";
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const post = (await publishedPosts()).find((item) => item.slug === slug);
  return { title: post?.title ?? "Journal", description: post?.excerpt };
}

const pad = (n: number) => String(n).padStart(2, "0");
const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function PostPage({ params }: Context) {
  const { slug } = await params;
  const posts = await publishedPosts();
  const index = posts.findIndex((item) => item.slug === slug);
  if (index < 0) notFound();

  const post = posts[index];
  const next = posts.length > 1 ? posts[(index + 1) % posts.length] : null;
  const [lede, ...paragraphs] = post.body.split(/\n\n+/);

  return (
    <article className="pb-28">
      <Frame className="pt-8 sm:pt-10">
        <div className="flex animate-rise items-center justify-between gap-4 font-header text-[11px] font-semibold uppercase tracking-[0.22em] motion-reduce:animate-none">
          <Link href="/blog" className={`group inline-flex min-h-11 items-center gap-3 text-ink/60 transition-colors duration-500 ${EASE} hover:text-ink`}>
            <span className={`flex size-8 items-center justify-center rounded-full ring-1 ring-ink/10 transition-transform duration-500 ${EASE} group-hover:-translate-x-0.5`}>
              <Arrow className="size-3.5 rotate-180" />
            </span>
            The Journal
          </Link>
          <span className="text-mist tabular-nums">
            Story {pad(index + 1)} of {pad(posts.length)}
          </span>
        </div>

        <header className="relative mt-6 lg:mb-12">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-sand sm:aspect-[16/10] lg:aspect-[2/1] lg:rounded-[36px] xl:aspect-[21/9]">
            <Image
              src={post.image}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="animate-settle object-cover motion-reduce:animate-none"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/45 via-ink/5 to-transparent" />
            <span aria-hidden className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/15" />
          </div>

          <div className="relative z-10 -mt-24 animate-rise px-3 [animation-delay:160ms] motion-reduce:animate-none sm:-mt-28 sm:px-8 lg:absolute lg:-bottom-12 lg:left-10 lg:mt-0 lg:w-[min(38rem,52%)] lg:px-0">
            <div className="rounded-[30px] bg-cream/70 p-1.5 shadow-[0_50px_90px_-45px_rgba(15,35,29,0.6)] ring-1 ring-white/70">
              <div
                className="relative overflow-hidden rounded-[24px] px-7 pt-9 pb-8 text-cream sm:px-11 sm:pt-11 sm:pb-10"
                style={{ background: "radial-gradient(130% 90% at 85% 0%, #24493f 0%, #163028 55%, #0f231d 100%)" }}
              >
                <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[16px] border" style={{ borderColor: `${GILT}4d` }} />
                <span aria-hidden className="pointer-events-none absolute inset-[18px] rounded-[12px] border" style={{ borderColor: `${GILT}1f` }} />
                <p className="relative font-header text-[11px] font-semibold uppercase tracking-[0.32em]" style={{ color: GILT }}>
                  Pack my bags · Journal
                </p>
                <h1 className="relative mt-5 font-serif text-[2.4rem] leading-[1.02] tracking-tight text-balance sm:text-5xl lg:text-[3.35rem]">
                  {post.title}
                </h1>
                <div className="relative mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-[13px] text-cream/70">
                  <span className="flex items-center gap-2.5 text-cream">
                    <Monogram name={post.author} tone="gilt" />
                    {post.author}
                  </span>
                  <span aria-hidden className="h-3 w-px bg-cream/20" />
                  <time dateTime={post.publishedAt}>{longDate(post.publishedAt)}</time>
                  <span aria-hidden className="h-3 w-px bg-cream/20" />
                  <span>{post.readMinutes} min read</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      </Frame>

      <Frame className="mt-16 sm:mt-20 lg:mt-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky space-y-10" style={{ top: "calc(var(--site-header-height, 6rem) + 2.5rem)" }}>
              <StoryProgress targetId="story-body" minutes={post.readMinutes} />
              <div className="flex items-center gap-3 border-t border-line pt-8">
                <Monogram name={post.author} tone="ink" />
                <div>
                  <p className="font-header text-[11px] font-semibold uppercase tracking-[0.24em] text-mist">Words by</p>
                  <p className="mt-1 text-sm text-ink">{post.author}</p>
                </div>
              </div>
            </div>
          </aside>

          <div id="story-body" className="max-w-[42rem] lg:col-span-7 lg:col-start-5">
            <p className="font-serif text-[1.7rem] leading-[1.3] tracking-tight text-pretty text-ink sm:text-[2.05rem]">{lede}</p>

            <div aria-hidden className="my-12 flex items-center gap-3">
              <span className="h-px w-10 bg-[#f94f18]" />
              <span className="size-1.5 rotate-45 bg-[#f94f18]" />
              <span className="h-px flex-1 bg-line" />
            </div>

            <div className="space-y-7 text-[1.125rem] leading-[1.9] text-pretty text-ink/80">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>

            <footer className="mt-16 flex items-center justify-between gap-6 border-t border-line pt-10">
              <div className="flex items-center gap-4">
                <Monogram name={post.author} tone="ink" size="lg" />
                <div>
                  <p className="font-serif text-2xl italic tracking-tight">{post.author}</p>
                  <p className="mt-1 font-header text-[11px] font-semibold uppercase tracking-[0.24em] text-mist">Written for the journal</p>
                </div>
              </div>
              <Postmark iso={post.publishedAt} />
            </footer>
          </div>
        </div>
      </Frame>

      <Frame className="mt-28">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line pt-12">
          <div>
            <p className="font-header text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f94f18]">Turn the page</p>
            <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
              Next in the <span className="italic">journal</span>
            </h2>
          </div>
          <Link
            href="/blog"
            className={`group inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-5 font-header text-[13px] font-medium ring-1 ring-ink/10 transition-colors duration-500 ${EASE} hover:bg-cream active:scale-[0.98]`}
          >
            All stories
            <span className={`flex size-8 items-center justify-center rounded-full bg-ink/5 transition-transform duration-500 ${EASE} group-hover:translate-x-0.5`}>
              <Arrow className="size-3.5" />
            </span>
          </Link>
        </div>

        {next ? (
          <Link
            href={`/blog/${next.slug}`}
            className={`group mt-10 block rounded-[34px] bg-white/50 p-2 shadow-[0_40px_90px_-60px_rgba(23,20,15,0.5)] ring-1 ring-ink/5 transition-transform duration-700 ${EASE} active:scale-[0.99]`}
          >
            <div className="grid overflow-hidden rounded-[26px] bg-cream md:grid-cols-[1.1fr_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[24rem]">
                <Image
                  src={next.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 680px, 100vw"
                  className={`object-cover transition-transform duration-[1400ms] ${EASE} group-hover:scale-[1.04]`}
                />
              </div>
              <div className="relative flex flex-col p-8 sm:p-11">
                <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-[#5c4a36]/15 to-transparent md:block" />
                <span className="font-header text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f94f18]">
                  Story {pad(((index + 1) % posts.length) + 1)} · {next.readMinutes} min read
                </span>
                <h3 className="mt-4 font-serif text-3xl leading-[1.08] tracking-tight text-balance sm:text-4xl">{next.title}</h3>
                <p className="mt-4 line-clamp-3 leading-7 text-ink/65">{next.excerpt}</p>
                <span className="mt-auto inline-flex items-center gap-3 self-start rounded-full bg-pine py-2 pr-2 pl-5 font-header text-[13px] font-medium text-cream max-md:mt-8">
                  Read story
                  <span className={`flex size-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-500 ${EASE} group-hover:translate-x-0.5 group-hover:-translate-y-px`}>
                    <Arrow className="size-3.5" />
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ) : null}
      </Frame>
    </article>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}

function Monogram({ name, tone, size = "md" }: { name: string; tone: "gilt" | "ink"; size?: "md" | "lg" }) {
  const dimension = size === "lg" ? "size-12 text-xl" : "size-8 text-[15px]";
  const colors = tone === "gilt" ? "text-[#f0dcb8] ring-[#d9bb86]/50" : "bg-pine text-[#f0dcb8] ring-pine/10";
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full font-serif italic ring-1 ${dimension} ${colors}`}>
      {name.trim().charAt(0)}
    </span>
  );
}

function Postmark({ iso }: { iso: string }) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase();
  return (
    <svg viewBox="0 0 120 120" className="size-24 shrink-0 -rotate-12 text-[#f94f18]/75 sm:size-28" role="img" aria-label={`Filed ${longDate(iso)}`}>
      <defs>
        <path id="postmark-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <text fill="currentColor" fontSize="8.5" fontWeight="600" className="font-header">
        <textPath href="#postmark-ring" textLength="276" lengthAdjust="spacing">
          PACK MY BAGS • THE JOURNAL • FILED •
        </textPath>
      </text>
      <text x="60" y="61" textAnchor="middle" fill="currentColor" fontSize="15" className="font-serif italic">
        {day}
      </text>
      <text x="60" y="76" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="2.5" className="font-header">
        {date.getFullYear()}
      </text>
    </svg>
  );
}
