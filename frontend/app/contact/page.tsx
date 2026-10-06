import Link from "next/link";
import { InformationPage } from "@/components/public/site";
import { getContactEmail, publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata('Contact', 'Contact information for Redwell Studio, with guidance for product feedback, bug reports, and privacy questions.', '/contact');

export default function ContactPage() {
  const email = getContactEmail();
  return <InformationPage title="Contact" intro="Reach Jayesh Gavit, the developer and operator of Redwell Studio, with product feedback, bug reports, privacy questions, or content concerns." path="/contact">
    <p>Last updated: <time dateTime="2026-10-06">6 October 2026</time>.</p>
    <section><h2>Contact Redwell Studio.</h2>
      <p>Email Jayesh Gavit at <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>.</p><p>The link opens your email application. This website has no contact form. Sending email shares your address, message, and any attachments through your email provider and the receiving email service.</p><p>There is no guaranteed response time. Please describe your question clearly so it can be considered.</p>
    </section>
    <section><h2>Reporting a problem.</h2><p>A useful report includes your browser and device, whether you were making a collage or carousel, what you expected, and the steps that led to the problem. For export issues, include the image format and scale.</p><p>Keep personal photos, passwords, and sensitive details out of your message. If an example helps, use a non-sensitive image you have permission to share.</p></section>
    <section><h2>Privacy or content questions.</h2><p>Describe the question and the page or action it relates to. The current studio has no user account directory or cloud artwork library. Please do not send identity documents with an initial inquiry.</p><p>Read the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Use</Link> for the current service scope.</p></section>
    <section><h2>Looking for a quick answer?</h2><p>The <Link href="/help">Help & FAQ guide</Link> covers photo formats, layout slots, exports, and why projects do not return after closing the editor.</p></section>
  </InformationPage>;
}
