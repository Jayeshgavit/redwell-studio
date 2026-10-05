import Link from "next/link";

const modes = [
  {
    number: "01",
    title: "Collage",
    description: "Build expressive photo layouts with grids, hero compositions, frames, filters, and layered imagery.",
    type: "collage",
  },
  {
    number: "02",
    title: "Carousel",
    description: "Turn a collection of photos into a polished visual story with slides, typography, and rhythm.",
    type: "carousel",
  },
  {
    number: "03",
    title: "Edit Image",
    description: "Enhance, adjust, and transform your photos with powerful editing tools and ready-made looks.",
    type: "edit-image",
  },
];

const templates = [
  {
    category: "Editorial",
    title: "A quiet moment",
    style: "editorial",
  },
  {
    category: "Travel",
    title: "Into the mountains",
    style: "travel",
  },
  {
    category: "Story",
    title: "The weekend",
    style: "story",
  },
  {
    category: "Minimal",
    title: "Less, but better",
    style: "minimal",
  },
];

function TemplateArtwork({ style }: { style: string }) {
  if (style === "editorial") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#e9e6df]">
        <div className="absolute left-[9%] top-[10%] h-[62%] w-[54%] bg-[#1b1b1b]" />
        <div className="absolute left-[16%] top-[17%] h-[48%] w-[40%] bg-[#d7d0c4]" />
        <div className="absolute bottom-[12%] left-[10%]">
          <div className="text-[clamp(28px,4vw,54px)] font-semibold leading-[0.9] tracking-[-0.06em] text-[#111]">
            A quiet
            <br />
            moment.
          </div>
        </div>
        <div className="absolute right-[8%] top-[12%] text-[9px] font-semibold uppercase tracking-[0.22em] text-[#555]">
          Editorial / 01
        </div>
      </div>
    );
  }

  if (style === "travel") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#cbd9d4]">
        <div className="absolute inset-x-0 bottom-0 h-[53%] bg-[#52675a]" />
        <div className="absolute bottom-[20%] left-[12%] h-[30%] w-[76%] rounded-[50%] bg-[#718879]" />
        <div className="absolute bottom-[37%] left-[21%] h-[26%] w-[58%] rounded-[50%] bg-[#84988a]" />
        <div className="absolute left-[9%] top-[11%] text-[9px] font-semibold uppercase tracking-[0.25em] text-[#26352e]">
          Travel diary
        </div>
        <div className="absolute bottom-[9%] left-[9%] text-[clamp(27px,4vw,48px)] font-semibold leading-[0.88] tracking-[-0.06em] text-white">
          Into
          <br />
          the mountains
        </div>
      </div>
    );
  }

  if (style === "story") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#151515]">
        <div className="absolute right-[-10%] top-[-15%] h-[75%] w-[72%] rotate-[12deg] bg-[#d7352f]" />
        <div className="absolute bottom-[-18%] left-[-12%] h-[60%] w-[60%] rounded-full border-[22px] border-[#f3efe6]" />
        <div className="absolute left-[9%] top-[12%] text-[9px] font-semibold uppercase tracking-[0.25em] text-[#f3efe6]">
          Visual story / 03
        </div>
        <div className="absolute bottom-[12%] left-[9%] text-[clamp(34px,5vw,62px)] font-bold uppercase leading-[0.82] tracking-[-0.06em] text-white">
          Make
          <br />
          it yours.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f4f2ed]">
      <div className="absolute left-[10%] top-[13%] text-[9px] font-semibold uppercase tracking-[0.25em] text-[#777]">
        Minimal / 04
      </div>
      <div className="absolute left-[10%] top-[29%] text-[clamp(42px,6vw,78px)] font-medium leading-[0.84] tracking-[-0.075em] text-[#111]">
        Less,
        <br />
        but better.
      </div>
      <div className="absolute bottom-[13%] right-[10%] h-[16%] w-[16%] rounded-full bg-[#111]" />
      <div className="absolute bottom-[17%] left-[10%] h-px w-[45%] bg-[#bbb]" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f6f2] text-[#111]">
      {/* Navigation */}
      <header className="border-b border-black/10 bg-[#f7f6f2]">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-redwell-600 text-white">
              <span className="h-3.5 w-3.5 rounded-[3px] border-2 border-white" />
            </span>

            <div>
              <div className="text-[15px] font-bold tracking-[-0.02em]">
                Redwell Studio
              </div>
              <div className="text-[8px] font-semibold uppercase tracking-[0.22em] text-black/45">
                Visual editor
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-black/60 md:flex">
            <a href="#create" className="transition hover:text-black">
              Create
            </a>
            <a href="#templates" className="transition hover:text-black">
              Templates
            </a>
            <a href="#features" className="transition hover:text-black">
              Features
            </a>
          </nav>

          <Link
            href="/create"
            className="rounded-full bg-[#111] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:-translate-y-0.5"
          >
            Start creating
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        id="create"
        className="mx-auto max-w-[1440px] px-6 pb-20 pt-8 md:px-10 md:pb-28 md:pt-10"
      >
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-7 text-[10px] font-bold uppercase tracking-[0.3em] text-redwell-600">
              Photo layout studio
            </p>

            <h1 className="max-w-[720px] text-[clamp(58px,8vw,122px)] font-semibold leading-[0.82] tracking-[-0.075em]">
              Make your
              <br />
              <span className="text-black/35">photos</span>
              <br />
              <span className="italic">matter.</span>
            </h1>

            <div className="mt-10 max-w-[480px]">
              <p className="text-[17px] leading-7 text-black/60 md:text-[19px]">
                Create expressive collages and visual carousels, then give
                your photos a considered final edit.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/create"
                  className="rounded-full bg-redwell-600 px-7 py-3.5 text-[14px] font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Start creating
                </Link>

                <a
                  href="#templates"
                  className="rounded-full border border-black/15 px-7 py-3.5 text-[14px] font-semibold transition hover:border-black/30"
                >
                  Explore layouts
                </a>
              </div>
            </div>
          </div>

          {/* Hero composition */}
          <div className="relative min-h-[520px] md:min-h-[650px]">
            <div className="absolute right-[3%] top-[4%] h-[78%] w-[62%] rotate-[3deg] bg-[#d9d4c9]" />

            <div className="absolute left-[5%] top-[10%] h-[70%] w-[52%] overflow-hidden bg-[#252525] shadow-[0_30px_70px_rgba(0,0,0,0.12)]">
              <div className="absolute inset-[7%] border border-white/30" />
              <div className="absolute bottom-[9%] left-[9%]">
                <div className="text-[clamp(34px,5vw,68px)] font-semibold leading-[0.82] tracking-[-0.07em] text-white">
                  Your
                  <br />
                  story.
                </div>
                <div className="mt-5 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/55">
                  Redwell Studio / 001
                </div>
              </div>
            </div>

            <div className="absolute bottom-[4%] right-[2%] h-[42%] w-[45%] overflow-hidden border-[8px] border-[#f7f6f2] bg-[#c9d2cf] shadow-[0_25px_60px_rgba(0,0,0,0.1)]">
              <div className="absolute inset-0 bg-[linear-gradient(145deg,#b8c9c4_0%,#d9ded4_48%,#667d6b_49%,#45594d_100%)]" />
              <div className="absolute bottom-[10%] left-[10%] text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                Travel / Memory
              </div>
            </div>

            <div className="absolute right-[3%] top-[1%] rotate-[-8deg] bg-redwell-600 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
              Create freely
            </div>
          </div>
        </div>
      </section>

      {/* Intro strip */}
      <section className="border-y border-black/10 bg-[#111] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-6 py-12 md:flex-row md:items-center md:px-10">
          <p className="max-w-[600px] text-[clamp(24px,3vw,42px)] font-medium leading-[1] tracking-[-0.045em]">
            One studio.
            <br />
            Three ways to tell your story.
          </p>

          <p className="max-w-[360px] text-[13px] leading-6 text-white/55">
            Start with your photos and shape them into a layout that feels
            intentional, personal, and ready to share.
          </p>
        </div>
      </section>

      {/* Modes */}
      <section
        id="features"
        className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black/40">
              The studio
            </p>
            <h2 className="text-[clamp(42px,6vw,82px)] font-semibold leading-[0.86] tracking-[-0.07em]">
              Choose your
              <br />
              canvas.
            </h2>
          </div>

          <p className="max-w-[360px] text-[14px] leading-6 text-black/55">
            Different stories need different compositions. Pick a mode and
            start building.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {modes.map((mode) => (
            <Link
              key={mode.number}
              href={mode.type === "edit-image" ? "/edit-image" : "/create"}
              className="group relative min-h-[430px] overflow-hidden border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
            >
              <div className="absolute inset-0 p-5">
                {mode.type === "collage" && (
                  <div className="grid h-full grid-cols-[1.25fr_0.75fr] gap-2">
                    <div className="bg-[#262626]" />
                    <div className="grid gap-2">
                      <div className="bg-[#d8d1c5]" />
                      <div className="bg-[#929e93]" />
                    </div>
                  </div>
                )}

                {mode.type === "carousel" && (
                  <div className="flex h-full items-center justify-center bg-[#ece8df]">
                    <div className="relative h-[78%] w-[70%] bg-[#171717] p-5">
                      <div className="h-full border border-white/20" />
                      <div className="absolute bottom-7 left-7 text-white">
                        <div className="text-[30px] font-semibold leading-[0.85] tracking-[-0.06em]">
                          Tell
                          <br />
                          the story.
                        </div>
                        <div className="mt-3 text-[7px] uppercase tracking-[0.25em] text-white/50">
                          Slide 01
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mode.type === "edit-image" && (
                  <div className="relative h-full overflow-hidden bg-[#2d3937]">
                    <img
                      src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{
                        clipPath: "inset(0 0 0 50%)",
                        filter: "brightness(.91) contrast(1.12) saturate(.82) sepia(.24)",
                      }}
                    />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-white/70" />
                    <div className="absolute left-[6%] top-[6%] border border-white/55 px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-white">
                      Before
                    </div>
                    <div className="absolute right-[6%] top-[6%] bg-white px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#111]">
                      After
                    </div>
                    <div className="absolute bottom-[8%] left-[8%] flex items-end gap-2 text-white">
                      <span className="text-[36px] font-semibold leading-none tracking-[-0.07em]">01</span>
                      <span className="pb-0.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/75">
                        Editorial / Warm
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-white/95 p-6 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-redwell-600">
                    {mode.number}
                  </span>
                  <span className="text-xl transition group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <h3 className="text-[32px] font-semibold tracking-[-0.05em]">
                  {mode.title}
                </h3>

                <p className="mt-2 max-w-[400px] text-[13px] leading-5 text-black/55">
                  {mode.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section
        id="templates"
        className="border-y border-black/10 bg-[#e8e5dd]"
      >
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black/40">
                Layout library
              </p>
              <h2 className="text-[clamp(42px,6vw,82px)] font-semibold leading-[0.86] tracking-[-0.07em]">
                Start with
                <br />
                something good.
              </h2>
            </div>

            <Link
              href="/create"
              className="text-[13px] font-semibold underline decoration-black/25 underline-offset-4"
            >
              Explore all layouts →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((template) => (
              <Link
                href="/create"
                key={template.title}
                className="group"
              >
                <div className="aspect-[4/5] overflow-hidden bg-white">
                  <TemplateArtwork style={template.style} />
                </div>

                <div className="flex items-start justify-between gap-4 pt-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-black/40">
                      {template.category}
                    </p>
                    <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em]">
                      {template.title}
                    </h3>
                  </div>

                  <span className="mt-1 transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature statement */}
      <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.8fr]">
          <h2 className="max-w-[900px] text-[clamp(48px,7vw,100px)] font-semibold leading-[0.85] tracking-[-0.075em]">
            Design tools should
            <br />
            help your ideas,
            <br />
            <span className="text-black/35">not get in their way.</span>
          </h2>

          <div className="self-end">
            <div className="border-t border-black/15 pt-5">
              <p className="text-[14px] leading-6 text-black/60">
                Move photos. Try layouts. Add type. Change the mood. Redwell
                Studio keeps the important creative controls close while
                keeping the workspace simple.
              </p>
            </div>

            <Link
              href="/create"
              className="mt-8 inline-flex rounded-full bg-[#111] px-7 py-3.5 text-[13px] font-semibold text-white transition hover:-translate-y-0.5"
            >
              Open the studio
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-redwell-600 text-white">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                Redwell Studio
              </p>

              <h2 className="max-w-[850px] text-[clamp(52px,8vw,118px)] font-semibold leading-[0.82] tracking-[-0.08em]">
                Your photos.
                <br />
                Your layout.
                <br />
                Your story.
              </h2>
            </div>

            <Link
              href="/create"
              className="inline-flex h-fit rounded-full bg-white px-8 py-4 text-[14px] font-bold text-[#111] transition hover:-translate-y-1"
            >
              Start creating →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-6 py-10 md:flex-row md:items-center md:px-10">
          <div>
            <div className="text-[15px] font-bold">Redwell Studio</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/35">
              Photo & layout editor
            </div>
          </div>

          <div className="flex gap-7 text-[12px] text-white/50">
            <Link href="/create" className="transition hover:text-white">
              Create
            </Link>
            <a href="#templates" className="transition hover:text-white">
              Templates
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}