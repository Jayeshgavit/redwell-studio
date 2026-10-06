import Link from "next/link";
import { SiteFrame } from "@/components/public/site";
import { LayoutPreview } from "@/components/public/layout-preview";
import { CANVAS_FORMATS, COLLAGE_LAYOUTS } from "@/types/editor";
import { getSiteOrigin, publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata(
  'Photo collage maker',
  'Create photo collages in your browser with flexible layouts, text, elements, and PNG or JPG downloads. No account required.',
  '/',
);

const layoutNotes: Record<string, string> = {
  '2-vertical': 'Give two photos equal space. Useful for pairs, details, and before-and-after compositions.',
  '3-large-left': 'Let one photo lead, with two smaller frames to add context.',
  '4-grid': 'Keep a set of four balanced. A simple starting point for a collection of moments.',
};
const featuredLayouts = COLLAGE_LAYOUTS.filter((layout) => layout.id in layoutNotes);
const formatNotes: Record<string, string> = {
  square: 'An equal frame for collections and everyday posts.',
  portrait: 'More room for portraits and vertical compositions.',
  story: 'A tall canvas for full-screen stories.',
  landscape: 'A wide frame for scenes and photo sets.',
};

export default function HomePage() {
  const origin = getSiteOrigin();
  return (
    <SiteFrame className="site-home">
      {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Redwell Studio', url: `${origin}/create`, applicationCategory: 'MultimediaApplication', operatingSystem: 'Web browser', description: 'A browser workspace for photo collages and carousel images.' }).replace(/</g, '\\u003c') }} />}
      <main id="main-content" tabIndex={-1}>
        <section className="site-container site-hero" aria-labelledby="hero-title">
          <div className="site-hero-copy">
            <p>Photo collage studio</p>
            <h1 id="hero-title">Make your<br /><span>photos</span><br /><em>matter.</em></h1>
            <p className="site-lead">Bring your photos together with thoughtful layouts, text, and simple design tools. Make a collage that feels like you.</p>
            <div className="site-actions">
              <Link href="/create" className="site-button site-button-red">Make a collage <span aria-hidden="true">↗</span></Link>
              <a href="#layouts" className="site-button site-button-outline">Explore layouts</a>
            </div>
            <p className="site-hero-note">No account required. Photos are processed in your browser.</p>
          </div>
          <figure className="site-composition">
            <div className="site-composition-art" aria-hidden="true">
              <div className="site-composition-back" />
              <div className="site-composition-front"><div className="site-composition-photo" /><span className="site-composition-title">Your<br />story.</span></div>
              <div className="site-composition-travel" />
            </div>
            <figcaption>Illustrative compositions. Your photos make them yours.</figcaption>
          </figure>
        </section>

        <section id="features" className="site-features site-section" aria-labelledby="features-title">
          <div className="site-container">
            <div className="site-section-head">
              <h2 id="features-title">A little structure.<br />Room to create.</h2>
              <p>Start with your photos. Refine the composition with controls that keep the details in your hands.</p>
            </div>
            <div className="site-feature-list">
              <div><h3>Frame the moment.</h3><p>Choose a photo layout, adjust the crop and focus, and set the space between images. Change the background, borders, and corners to suit the composition.</p></div>
              <div><h3>Give it your voice.</h3><p>Add a headline, caption, or date. Use shapes, icons, and doodles for visual details, then arrange photos, text, and elements with layer controls.</p></div>
              <div><h3>Download the finished piece.</h3><p>Export your collage as PNG or JPG at 1×, 2×, or 3× resolution. Preview before downloading and keep a copy on your device.</p></div>
              <div><h3>Take a story across slides.</h3><p>Carousel mode is also available inside the studio. Start from a story template, work across slides, and export the sequence as separate images or a ZIP.</p></div>
            </div>
          </div>
        </section>

        <section id="formats" className="site-container site-section" aria-labelledby="formats-title">
          <div className="site-section-head">
            <h2 id="formats-title">Choose your<br />canvas.</h2>
            <p>Four formats, with room for different stories. Choose your canvas inside the studio before arranging the photos.</p>
          </div>
          <div className="site-formats">
            {CANVAS_FORMATS.map((format) => (
              <div key={format.id}>
                <div className="site-format-art" aria-hidden="true"><div className="site-format-shape" style={{ width: 100 * Math.min(1, format.ratio), height: 100 / Math.max(1, format.ratio) }}><span /><span /></div></div>
                <h3>{format.name}</h3>
                <p>{format.width} × {format.height} px at 1×</p>
                <p>{formatNotes[format.id]}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="layouts" className="site-layout-section site-section" aria-labelledby="layouts-title">
          <div className="site-container">
            <div className="site-section-head">
              <h2 id="layouts-title">Start with<br />something good.</h2>
              <div><p>Pick a layout for the number of photos you want to use. These are three of the actual presets available in the collage studio.</p><Link href="/create" className="site-text-link">Browse in the studio <span aria-hidden="true">↗</span></Link></div>
            </div>
            <div className="site-layouts">
              {featuredLayouts.map((layout) => <article key={layout.id}><LayoutPreview layout={layout} /><h3>{layout.name}</h3><p>{layout.photoCount} photos. {layoutNotes[layout.id]}</p></article>)}
            </div>
            <p className="site-layout-caption">Diagrams show photo placement. Choose a preset in the studio, then add your own photos and styling.</p>
          </div>
        </section>

        <section id="how-it-works" className="site-container site-workflow" aria-labelledby="workflow-title">
          <div><h2 id="workflow-title">From photo set<br />to finished piece.</h2><Link href="/help" className="site-text-link">Read the getting-started guide <span aria-hidden="true">→</span></Link></div>
          <ol className="site-steps">
            <li><div><h3>Choose a format. Add photos.</h3><p>Open the studio, set your canvas, and select images from your device. Use a layout with enough slots for the photos you want to show.</p></div></li>
            <li><div><h3>Make the composition yours.</h3><p>Adjust each photo, add text or elements, and refine spacing and color. Use layers to select and arrange the details.</p></div></li>
            <li><div><h3>Preview. Export. Keep a copy.</h3><p>Check your artwork, then use Export to download it. Projects are held in the current browser session; download before refreshing or closing the editor.</p></div></li>
          </ol>
        </section>

        <section className="site-container site-practical" aria-labelledby="practical-title">
          <h2 id="practical-title">Your photos.<br />Your browser.</h2>
          <div><p>The current studio processes selected photos and creates downloads on your device. It has no photo-upload service or cloud project storage. Workspace panel preferences are saved locally in your browser.</p><p>For file tips, exporting, and answers about saving your work, start with the help guide.</p><div className="site-actions"><Link href="/help" className="site-text-link">Help & FAQ <span aria-hidden="true">→</span></Link><Link href="/privacy" className="site-text-link">How privacy works <span aria-hidden="true">→</span></Link></div></div>
        </section>
        <section className="site-close" aria-labelledby="close-title"><div className="site-container"><h2 id="close-title">Make room for your photos.</h2><Link href="/create" className="site-button">Open the studio <span aria-hidden="true">↗</span></Link></div></section>
      </main>
    </SiteFrame>
  );
}
