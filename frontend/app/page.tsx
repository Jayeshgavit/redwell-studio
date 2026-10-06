

import Link from "next/link";

const formats = [
  {
    number: "01",
    title: "Square",
    description: "Balanced compositions made for posts, memories, and everyday photo stories.",
    type: "square",
  },
  {
    number: "02",
    title: "Portrait",
    description: "Tall compositions for posters, portraits, travel stories, and social content.",
    type: "portrait",
  },
  {
    number: "03",
    title: "Story",
    description: "Vertical layouts designed for stories, moments, and full-screen sharing.",
    type: "story",
  },
  {
    number: "04",
    title: "Landscape",
    description: "Wide compositions for banners, memories, collections, and visual stories.",
    type: "landscape",
  },
];

const layouts = [
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
  {
    category: "Grid",
    title: "Collected moments",
    style: "grid",
  },
  {
    category: "Gallery",
    title: "The photo set",
    style: "gallery",
  },
];

function LayoutArtwork({ style }: { style: string }) {
  if (style === "editorial") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#e9e6df]">
        <div className="absolute left-[9%] top-[9%] h-[57%] w-[54%] bg-[#202020]" />
        <div className="absolute left-[16%] top-[16%] h-[43%] w-[40%] bg-[#d7d0c4]" />

        <div className="absolute right-[8%] top-[11%] text-[8px] font-bold uppercase tracking-[0.25em] text-black/45">
          Editorial / 01
        </div>

        <div className="absolute bottom-[10%] left-[10%]">
          <div className="text-[clamp(25px,4vw,52px)] font-semibold leading-[0.86] tracking-[-0.06em]">
            A quiet
            <br />
            moment.
          </div>
        </div>
      </div>
    );
  }

  if (style === "travel") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#cbd9d4]">
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[#536b5d]" />
        <div className="absolute bottom-[21%] left-[9%] h-[31%] w-[80%] rounded-[50%] bg-[#71897c]" />
        <div className="absolute bottom-[37%] left-[20%] h-[27%] w-[60%] rounded-[50%] bg-[#879b8e]" />

        <div className="absolute left-[9%] top-[10%] text-[8px] font-bold uppercase tracking-[0.25em] text-[#26352e]">
          Travel diary
        </div>

        <div className="absolute bottom-[9%] left-[9%] text-[clamp(25px,4vw,48px)] font-semibold leading-[0.86] tracking-[-0.06em] text-white">
          Into
          <br />
          the mountains
        </div>
      </div>
    );
  }

  if (style === "story") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#171717]">
        <div className="absolute right-[-10%] top-[-14%] h-[76%] w-[72%] rotate-[12deg] bg-redwell-600" />
        <div className="absolute bottom-[-18%] left-[-12%] h-[61%] w-[60%] rounded-full border-[20px] border-[#f3efe6]" />

        <div className="absolute left-[9%] top-[11%] text-[8px] font-bold uppercase tracking-[0.25em] text-white/70">
          Visual story / 03
        </div>

        <div className="absolute bottom-[12%] left-[9%] text-[clamp(31px,5vw,60px)] font-bold uppercase leading-[0.82] tracking-[-0.06em] text-white">
          Make
          <br />
          it yours.
        </div>
      </div>
    );
  }

  if (style === "minimal") {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#f4f2ed]">
        <div className="absolute left-[10%] top-[12%] text-[8px] font-bold uppercase tracking-[0.25em] text-black/40">
          Minimal / 04
        </div>

        <div className="absolute left-[10%] top-[27%] text-[clamp(38px,6vw,72px)] font-medium leading-[0.84] tracking-[-0.075em]">
          Less,
          <br />
          but better.
        </div>

        <div className="absolute bottom-[13%] right-[10%] h-[16%] w-[16%] rounded-full bg-[#171717]" />
        <div className="absolute bottom-[17%] left-[10%] h-px w-[45%] bg-black/20" />
      </div>
    );
  }

  if (style === "grid") {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-3 gap-2 bg-[#eeeae2] p-3">
        <div className="row-span-2 bg-[#343434]" />
        <div className="bg-[#c8d0ca]" />
        <div className="bg-[#d9d0c0]" />
        <div className="bg-[#88978d]" />
        <div className="bg-[#202020]" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#ddd9d0] p-4">
      <div className="grid h-full grid-cols-2 gap-3">
        <div className="bg-[#343434]" />
        <div className="grid gap-3">
          <div className="bg-[#b9c6bf]" />
          <div className="bg-[#8c9b91]" />
        </div>
      </div>

      <div className="absolute bottom-7 left-7 text-[9px] font-bold uppercase tracking-[0.25em] text-white">
        Gallery / 06
      </div>
    </div>
  );
}

function FormatArtwork({ type }: { type: string }) {
  if (type === "portrait") {
    return (
      <div className="flex h-full items-center justify-center bg-[#e8e4dc] p-8">
        <div className="h-[82%] w-[53%] bg-[#292929] p-3">
          <div className="h-full w-full bg-[#77877c]" />
        </div>
      </div>
    );
  }

  if (type === "story") {
    return (
      <div className="flex h-full items-center justify-center bg-[#202020] p-8">
        <div className="relative h-[88%] w-[52%] overflow-hidden bg-redwell-600">
          <div className="absolute bottom-0 left-0 h-[42%] w-full bg-[#171717]" />
          <div className="absolute bottom-[10%] left-[10%] text-2xl font-bold leading-none text-white">
            Your
            <br />
            story.
          </div>
        </div>
      </div>
    );
  }

  if (type === "landscape") {
    return (
      <div className="flex h-full items-center justify-center bg-[#e4e1d9] p-8">
        <div className="relative aspect-[16/9] w-[88%] overflow-hidden bg-[#65796c]">
          <div className="absolute left-[5%] top-[8%] h-[65%] w-[43%] bg-[#d4cec1]" />
          <div className="absolute bottom-[7%] right-[7%] h-[40%] w-[37%] bg-[#202020]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-[#e8e5dd] p-8">
      <div className="aspect-square w-[78%] bg-[#292929] p-3">
        <div className="grid h-full grid-cols-[1.25fr_0.75fr] gap-2">
          <div className="bg-[#77736b]" />
          <div className="grid gap-2">
            <div className="bg-[#d4cec1]" />
            <div className="bg-[#7f9185]" />
          </div>
        </div>
      </div>
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
                Collage editor
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] font-medium text-black/60 md:flex">
            <a href="#formats" className="transition hover:text-black">
              Formats
            </a>

            <a href="#layouts" className="transition hover:text-black">
              Layouts
            </a>

            <a href="#how-it-works" className="transition hover:text-black">
              How it works
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
              Photo collage studio
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
                Turn your photos into beautiful collages with thoughtful
                layouts, simple design tools, and a workspace that stays out
                of your way.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/create"
                  className="rounded-full bg-redwell-600 px-7 py-3.5 text-[14px] font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Start creating
                </Link>

                <a
                  href="#layouts"
                  className="rounded-full border border-black/15 px-7 py-3.5 text-[14px] font-semibold transition hover:border-black/30"
                >
                  Explore layouts
                </a>
              </div>
            </div>
          </div>

          {/* Hero collage composition */}
          <div className="relative min-h-[520px] md:min-h-[650px]">
            <div className="absolute right-[3%] top-[4%] h-[78%] w-[62%] rotate-[3deg] bg-[#d9d4c9]" />

            <div className="absolute left-[5%] top-[10%] h-[70%] w-[52%] overflow-hidden bg-[#252525] shadow-[0_30px_70px_rgba(0,0,0,0.12)]">
              <div className="absolute inset-[7%] border border-white/30" />

              <div className="absolute left-[8%] top-[8%] h-[43%] w-[84%] bg-[#77736b]" />

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
              Built for collages
            </div>
          </div>
        </div>
      </section>

      {/* Intro strip */}
      <section className="border-y border-black/10 bg-[#111] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-6 py-12 md:flex-row md:items-center md:px-10">
          <p className="max-w-[650px] text-[clamp(24px,3vw,42px)] font-medium leading-[1] tracking-[-0.045em]">
            One studio for beautiful collages.
          </p>

          <p className="max-w-[360px] text-[13px] leading-6 text-white/55">
            Add your photos. Choose your layout. Make the composition yours.
          </p>
        </div>
      </section>

      {/* Formats */}
      <section
        id="formats"
        className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black/40">
              The studio
            </p>

            <h2 className="max-w-[850px] text-[clamp(48px,7vw,92px)] font-semibold leading-[0.86] tracking-[-0.075em]">
              Choose your
              <br />
              <span className="text-black/35">canvas.</span>
            </h2>
          </div>

          <p className="max-w-[360px] text-[14px] leading-6 text-black/55 md:mb-1">
            Start with the format that fits your story. Every canvas is ready
            for your photos and layouts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {formats.map((format) => (
            <Link
              key={format.number}
              href="/create"
              className="group overflow-hidden border border-black/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <FormatArtwork type={format.type} />
              </div>

              <div className="border-t border-black/10 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-[0.2em] text-redwell-600">
                    {format.number}
                  </span>

                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </div>

                <h3 className="text-[28px] font-semibold tracking-[-0.05em]">
                  {format.title}
                </h3>

                <p className="mt-2 text-[13px] leading-5 text-black/50">
                  {format.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Layout library */}
      <section
        id="layouts"
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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {layouts.map((layout) => (
              <Link
                href="/create"
                key={layout.title}
                className="group"
              >
                <div className="aspect-[4/5] overflow-hidden bg-white transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_25px_70px_rgba(0,0,0,0.10)]">
                  <LayoutArtwork style={layout.style} />
                </div>

                <div className="flex items-start justify-between gap-4 pt-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-black/40">
                      {layout.category}
                    </p>

                    <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.03em]">
                      {layout.title}
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

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-32"
      >
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-redwell-600">
              How it works
            </p>

            <h2 className="max-w-[700px] text-[clamp(48px,7vw,96px)] font-semibold leading-[0.85] tracking-[-0.075em]">
              Simple tools.
              <br />
              <span className="text-black/35">Better stories.</span>
            </h2>
          </div>

          <div className="border-t border-black/15">
            <div className="grid gap-0">
              <div className="grid gap-5 border-b border-black/10 py-8 md:grid-cols-[90px_1fr]">
                <span className="text-[10px] font-bold tracking-[0.2em] text-redwell-600">
                  01
                </span>

                <div>
                  <h3 className="text-[28px] font-semibold tracking-[-0.05em]">
                    Add your photos.
                  </h3>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-6 text-black/55">
                    Bring the photos you want to remember, share, or turn into
                    a visual story.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 border-b border-black/10 py-8 md:grid-cols-[90px_1fr]">
                <span className="text-[10px] font-bold tracking-[0.2em] text-redwell-600">
                  02
                </span>

                <div>
                  <h3 className="text-[28px] font-semibold tracking-[-0.05em]">
                    Choose a layout.
                  </h3>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-6 text-black/55">
                    Pick a composition based on how many photos you have and
                    the story you want to tell.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 border-b border-black/10 py-8 md:grid-cols-[90px_1fr]">
                <span className="text-[10px] font-bold tracking-[0.2em] text-redwell-600">
                  03
                </span>

                <div>
                  <h3 className="text-[28px] font-semibold tracking-[-0.05em]">
                    Make it yours.
                  </h3>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-6 text-black/55">
                    Arrange your photos, add text and elements, and refine the
                    visual style of your collage.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 py-8 md:grid-cols-[90px_1fr]">
                <span className="text-[10px] font-bold tracking-[0.2em] text-redwell-600">
                  04
                </span>

                <div>
                  <h3 className="text-[28px] font-semibold tracking-[-0.05em]">
                    Export and share.
                  </h3>

                  <p className="mt-3 max-w-[520px] text-[14px] leading-6 text-black/55">
                    When the composition feels right, export the finished
                    collage and share it anywhere.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Studio capabilities */}
      <section className="border-y border-black/10 bg-[#f0eee8]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28">
          <div className="mb-14">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black/40">
              Inside the studio
            </p>

            <h2 className="max-w-[850px] text-[clamp(46px,6vw,82px)] font-semibold leading-[0.86] tracking-[-0.07em]">
              Everything you need
              <br />
              <span className="text-black/35">to build a collage.</span>
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden border border-black/10 bg-black/10 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: "Photos",
                text: "Add and organize the images that make up your story.",
              },
              {
                number: "02",
                title: "Layouts",
                text: "Choose from compositions designed around different photo counts.",
              },
              {
                number: "03",
                title: "Elements",
                text: "Add visual details that give your collage personality.",
              },
              {
                number: "04",
                title: "Text",
                text: "Add headlines, captions, dates, labels, and small details.",
              },
            ].map((item) => (
              <div key={item.number} className="bg-white p-7 md:p-8">
                <p className="mb-12 text-[9px] font-bold uppercase tracking-[0.25em] text-redwell-600">
                  {item.number}
                </p>

                <h3 className="text-[30px] font-semibold leading-none tracking-[-0.05em]">
                  {item.title}
                </h3>

                <p className="mt-4 text-[13px] leading-5 text-black/50">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statement */}
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
                Redwell Studio keeps the collage workflow focused: choose a
                layout, place your photos, add your details, and make the final
                composition feel intentional.
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

      {/* Final CTA */}
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
              Collage editor
            </div>
          </div>

          <div className="flex gap-7 text-[12px] text-white/50">
            <Link href="/create" className="transition hover:text-white">
              Create
            </Link>

            <a href="#layouts" className="transition hover:text-white">
              Layouts
            </a>

            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
