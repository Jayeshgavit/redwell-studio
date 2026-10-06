import Link from "next/link";
import { InformationPage } from "@/components/public/site";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata('Help & FAQ', 'Learn how to add photos, choose collage layouts, adjust your design, and export artwork. Answers about local processing and saving.', '/help');
const contents = [{ id: 'start', title: 'Make your first collage' }, { id: 'export', title: 'Choose an export' }, { id: 'questions', title: 'Common questions' }];

export default function HelpPage() {
  return <InformationPage title="A good place to start." intro="A short guide to making your first collage, keeping the right photos in view, and downloading the finished piece." path="/help" contents={contents}>
    <p>Last updated: <time dateTime="2026-10-06">6 October 2026</time>.</p>
    <section id="start"><h2>Make your first collage.</h2><ol>
      <li><strong>Open the studio and set your format.</strong> Choose Square, Portrait, Story, or Landscape. The format controls the proportions and base size of your artwork.</li>
      <li><strong>Add photos from your device.</strong> Open Photos and select your images. JPG and PNG are practical starting points; other image formats depend on your browser’s decoding support.</li>
      <li><strong>Choose a layout.</strong> Match the number of slots to the photos you want to show. Photos beyond the available slots stay in the photo library and are not automatically included in the export.</li>
      <li><strong>Refine the composition.</strong> Select a photo to adjust its framing. Use Design for text, Elements for visual details, Layers for ordering, and Style for spacing, background, corners, and borders.</li>
      <li><strong>Preview and download.</strong> Check for empty slots and cropped details, then choose Export. Keep a downloaded copy before refreshing or closing the editor.</li>
    </ol></section>
    <section id="export"><h2>Choose an export.</h2><p><strong>PNG</strong> uses lossless compression and is useful for compositions with text and graphic details. <strong>JPG</strong> offers an adjustable quality setting when a smaller file is more useful.</p><p>Choose 1×, 2×, or 3× output. A square canvas is 1080 × 1080 pixels at 1× and 2160 × 2160 at 2×. Larger output takes more memory and does not recover details missing from a low-resolution source photo.</p><p>Export creates a finished image. It is not an editable project file, and it does not publish your artwork to a social network. Downloads remain on your device until you remove them.</p></section>
    <section id="questions" className="site-faq"><h2>Common questions.</h2>
      <details><summary>Do I need an account?</summary><p>No. The current studio has no signup or login. You can open the editor and begin selecting photos.</p></details>
      <details><summary>Where do my photos go?</summary><p>Selected photos are read and processed in your browser. The current application does not send them to a photo-upload server. Live preview passes artwork and photo data to another tab on the same site through the browser. See the <Link href="/privacy">Privacy Policy</Link> for the distinction between artwork and website requests.</p></details>
      <details><summary>Will my project be saved if I close the tab?</summary><p>There is no persistent project save or cloud backup in the current studio. Editing state is held in the active browser session. Panel preferences are stored separately and do not restore your artwork. Export before refreshing, closing the editor, or navigating away.</p></details>
      <details><summary>Can I reset workspace preferences?</summary><p>Clear Redwell Studio’s site data in your browser settings to reset the remembered active tool, open panels, and dock width. The editor also works when local storage is blocked. Clearing site data does not remove downloaded files.</p></details>
      <details><summary>Why is a photo missing from my export?</summary><p>A photo must be assigned to a visible layout slot to appear. Check your slot count, photo assignments, layer visibility, and the export dialog’s empty-slot or unplaced-photo notices. Changing layouts can leave extra photos in the library.</p></details>
      <details><summary>What if a photo will not open or an export fails?</summary><p>Try a JPG or PNG that opens in your browser. If a large export fails, reduce the output scale or the size of the source images and try again. Download any work you can before refreshing. For a bug report, note your browser, the format, and the steps that caused the problem.</p></details>
      <details><summary>How do I make a carousel?</summary><p>Select Carousel in the studio’s mode control. Choose a story template, edit the slides, and preview the sequence. Export the current slide or all slides; all-slide downloads can be separate images or a ZIP. This produces images to share yourself.</p></details>
      <details><summary>Is live preview available in every browser?</summary><p>Live preview needs browser support for BroadcastChannel and permission to open a new tab. If it does not open, check blocked popups. Keep the editor tab open while previewing.</p></details>
    </section>
    <section><h2>Still stuck?</h2><p>The <Link href="/contact">contact page</Link> explains how to report an issue and what information is useful. Avoid sharing private photos or sensitive information in a report.</p><Link href="/create" className="site-button">Open the studio <span aria-hidden="true">↗</span></Link></section>
  </InformationPage>;
}
