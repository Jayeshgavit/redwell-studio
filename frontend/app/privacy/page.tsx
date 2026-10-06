import Link from "next/link";
import { InformationPage, LegalReviewNotice } from "@/components/public/site";
import { getContactEmail, publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata('Privacy Policy', 'How Redwell Studio processes photos, browser preferences, live preview, website requests, and contact messages.', '/privacy');
const contents = [
  { id: 'scope', title: 'Scope and operator' },
  { id: 'artwork', title: 'Photos, projects, and downloads' },
  { id: 'storage', title: 'Browser storage and retention' },
  { id: 'website', title: 'Website requests and resources' },
  { id: 'tracking', title: 'Cookies, analytics, and ads' },
  { id: 'contact-data', title: 'Email and your choices' },
  { id: 'children', title: 'Children’s privacy' },
  { id: 'changes', title: 'Changes and contact' },
];

export default function PrivacyPage() {
  const email = getContactEmail();
  return <InformationPage title="Privacy Policy" intro="How the current studio handles your content and preferences, and what happens when you visit the website or send an email." path="/privacy" contents={contents}>
    <LegalReviewNotice />
    <p>Last updated: <time dateTime="2026-10-06">6 October 2026</time>.</p>

    <section id="scope"><h2>Scope and operator.</h2>
      <p>Redwell Studio is developed and operated by Jayesh Gavit. This policy covers its public website and free browser-based Collage and Carousel tools. The current application has no signup, login, subscriptions, or payment flow.</p>
      <p>This policy distinguishes processing implemented by the application from hosting and email practices that still need owner confirmation.</p>
    </section>

    <section id="artwork"><h2>Photos, projects, and downloads.</h2>
      <p>When you select photos from your device, the studio reads the selected image files through browser object URLs. It processes the images, framing, filters, text, elements, layouts, and slide state in your browser to display and export your artwork.</p>
      <p>The current application does not upload your selected photos, text, or projects to a server. It has no cloud project storage, hosted user gallery, or public project-sharing service.</p>
      <p>Live preview sends composition state and photo Blobs to a preview tab on the same site through the browser’s BroadcastChannel feature. Reading these local Blob URLs does not upload them. The preview page itself still makes website requests. A preview URL is not a public sharing link.</p>
      <p>Export uses browser Canvas processing to create PNG or JPG images and, for Carousel, separate slide images or a ZIP. The browser downloads the result to your device. Redwell Studio does not publish it to a social network. If you share or upload a downloaded file elsewhere, that service’s practices apply.</p>
    </section>

    <section id="storage"><h2>Browser storage and retention.</h2>
      <p>Photos, artwork, slide state, and undo/redo history are held in memory during the editor session. They are not saved as a persistent project. Refreshing, closing the editor, or navigating away can lose your work; export a finished copy first. Removing a photo from the composition may leave it in session history or an open preview until those sessions end.</p>
      <p>The editor uses local storage to remember the active tool, open panels, and dock width. These preferences contain no selected photos or artwork and do not restore a project. They remain in that browser profile until cleared or replaced.</p>
      <p>You can clear these preferences through your browser’s site-data settings. The editor remains usable if local storage is blocked. Your original files and downloaded exports are separate files on your device and remain until you remove them. Your browser may also cache website resources under its own settings.</p>
    </section>

    <section id="website"><h2>Website requests and resources.</h2>
      <p>Visiting the site, navigating pages, opening preview, and loading scripts or artwork assets makes requests to the infrastructure serving Redwell Studio. Those requests expose technical information such as your IP address, requested URL, and request headers, which may include browser details and a referrer. A live-preview request includes a generated channel identifier in its URL, rather than the photo data.</p>
      <p>The inspected application uses packaged software and icons, including Next.js, React, Fabric, and Tabler, plus artwork assets served from the site. These dependencies are not themselves external analytics services. No external font service, image-upload service, or third-party resource CDN is configured in the inspected application.</p>
      <p className="site-owner-detail"><strong>Owner confirmation needed:</strong> the repository does not establish the production host or delivery providers, their logs or cookies, retention periods, recipients, processing locations, or international transfers. These deployment details must be checked and this section completed; browser-side editing is not a promise that hosting collects nothing.</p>
    </section>

    <section id="tracking"><h2>Cookies, analytics, and advertising.</h2>
      <p>The current application code has no application cookie handling, analytics integration, advertising scripts, or tracking pixels. Google AdSense is not integrated. Workspace local storage is described above; cookies or measurement added by deployment infrastructure have not been verified.</p>
      <p>If advertising or analytics is introduced, this section will need to identify the actual providers, data and storage technologies, purposes, sharing, retention, and available choices. Any required consent, rejection, and withdrawal controls must be assessed and implemented before the new processing starts. Future services are not described here as current practices.</p>
    </section>

    <section id="contact-data"><h2>Email and your choices.</h2>
      <p>The website has no contact form. If you email Jayesh Gavit at <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>, your email address, message, and any attachments are sent through your email provider and the receiving email service. The supplied contact address is a Gmail address; email handling is separate from the local editor workflow.</p>
      <p>Send only what is needed to explain your inquiry. Avoid private photos, identity documents, and sensitive information in an initial message.</p>
      <p className="site-owner-detail"><strong>Owner confirmation needed:</strong> confirm how correspondence is used and stored, who has access, how long it is kept, and how requests for access or deletion are handled. The application does not define these email practices or a retention schedule.</p>
      <p>You choose which images to open, whether to use preview, which files to download, and when to clear site data. Close the editor and any preview tabs to end their sessions. You can request information about, or deletion of, correspondence by email. Rights and any required response depend on applicable law; there is no server-stored project or account for the operator to retrieve or delete.</p>
    </section>

    <section id="children"><h2>Children’s privacy.</h2>
      <p>The current application has no age verification, child account system, or parental-consent flow. Local photo processing does not remove privacy considerations relating to website requests or email. Parents or guardians with concerns about information sent by a child can contact Jayesh Gavit without attaching more sensitive information.</p>
      <p className="site-owner-detail"><strong>Owner confirmation needed:</strong> confirm the intended audience, any minimum age, and children’s privacy obligations for the locations served before setting an age rule or adding advertising or analytics.</p>
    </section>

    <section id="changes"><h2>Changes and contact.</h2>
      <p>Updates will be posted on this page with a revised last-updated date. Changes to accounts, cloud storage, contact forms, payments, hosting, analytics, or advertising require another review of actual data handling and any notice or consent required by applicable law.</p>
      <p>For privacy questions, contact Jayesh Gavit at <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>. See also <Link href="/contact">Contact</Link> and the <Link href="/terms">Terms of Use</Link>.</p>
    </section>
  </InformationPage>;
}
