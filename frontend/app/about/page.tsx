import Link from "next/link";
import { InformationPage } from "@/components/public/site";
import { publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata('About', 'The idea behind Redwell Studio: a focused browser workspace for photo collages and visual stories.', '/about');

export default function AboutPage() {
  return <InformationPage title="A studio for the photos you keep." intro="Redwell Studio brings a little editorial structure to your photo collection. A layout, a few details, and a story of your own." path="/about">
    <section><h2>Collage comes first.</h2><p>A single photo can say a lot. A collection can say something different: the places in a journey, the details of a celebration, or the small moments of an ordinary week.</p><p>Redwell Studio is built around that composition. Choose a canvas, arrange your photos in a layout, and add text or visual elements when they help tell the story. Spacing, backgrounds, and borders give you control over the final piece.</p></section>
    <section><h2>Keep the workflow focused.</h2><p>The studio runs in your browser and does not require an account. Selected photos are processed locally, and finished artwork downloads to your device. There is no cloud project library; export your work before leaving the editor.</p><p>For a longer story, Carousel mode offers templates and multiple slides in the same workspace. Collage remains the starting point.</p></section>
    <section><h2>Simple tools. Intentional choices.</h2><p>The website and studio share the same sensibility: clear typography, quiet surfaces, and room for the content. The aim is to help you make a composition without burying your photos under an interface.</p><p>Start with the <Link href="/#layouts">layout examples</Link>, or follow the <Link href="/help">getting-started guide</Link>. Questions and feedback belong on the <Link href="/contact">contact page</Link>.</p></section>
    <div className="site-actions"><Link href="/create" className="site-button">Make a collage <span aria-hidden="true">↗</span></Link></div>
  </InformationPage>;
}
