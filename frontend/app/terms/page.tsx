import Link from "next/link";
import { InformationPage, LegalReviewNotice } from "@/components/public/site";
import { getContactEmail, publicMetadata } from "@/lib/public-site";

export const metadata = publicMetadata('Terms of Use', 'Draft terms for Redwell Studio’s free creative tools, user content, acceptable use, downloads, and service limits.', '/terms');
const contents = [
  { id: 'service', title: 'Service and acceptance' },
  { id: 'content', title: 'Your content and permissions' },
  { id: 'use', title: 'Permitted use and misuse' },
  { id: 'assets', title: 'Software, design, and assets' },
  { id: 'limits', title: 'Exports and availability' },
  { id: 'third-parties', title: 'Third-party services' },
  { id: 'legal', title: 'Disclaimers and liability' },
  { id: 'questions', title: 'Changes and contact' },
];

export default function TermsPage() {
  const email = getContactEmail();
  return <InformationPage title="Terms of Use" intro="Practical terms for creating with Redwell Studio and understanding the limits of a free browser-based tool." path="/terms" contents={contents}>
    <LegalReviewNotice />
    <p>Last updated: <time dateTime="2026-10-06">6 October 2026</time>.</p>

    <section id="service"><h2>Service and acceptance.</h2>
      <p>Redwell Studio is developed and operated by Jayesh Gavit. It provides free browser-based Collage and Carousel tools with layouts, photo adjustments, text, elements, preview, and downloads. There are currently no accounts, subscriptions, checkout, or cloud project storage.</p>
      <p>These draft terms set out the conditions for using the website and tools. By using Redwell Studio, you agree to these terms to the extent permitted by applicable law. If you do not agree, stop using the service. There is no account registration or acceptance checkbox.</p>
      <p className="site-owner-detail"><strong>Owner review needed:</strong> confirm agreement formation and eligibility, including any minimum age and parental permission requirements, under applicable law before treating this draft as a final agreement.</p>
    </section>

    <section id="content"><h2>Your content and permissions.</h2>
      <p>You retain any rights you hold in the photos, text, and other content you bring to the studio. Using the tool does not transfer ownership of that content to Jayesh Gavit. The current local workflow does not require a license for the operator to host or publish your projects.</p>
      <p>You are responsible for having permission to use your source material and distribute your finished work. This includes copyright, trademarks, privacy, and permissions involving identifiable people. Exporting a composition does not clear those rights or guarantee that it may be published or sold.</p>
    </section>

    <section id="use"><h2>Permitted use and misuse.</h2>
      <p>You may use the free tools to make personal or business artwork, subject to these terms and the rights and licenses applying to your content and included assets.</p>
      <ul>
        <li>Do not create or distribute unlawful material or infringe another person’s rights.</li>
        <li>Do not introduce malware, exploit vulnerabilities, attempt unauthorized access, or disrupt or overload the website.</li>
        <li>Do not impersonate the operator or imply an endorsement by Redwell Studio that has not been given.</li>
      </ul>
      <p>The operator may restrict access where reasonably necessary to address misuse, security risks, or legal requirements, subject to applicable law. There is no account-termination system or hosted gallery moderation process in the current product. You may stop using the site at any time.</p>
    </section>

    <section id="assets"><h2>Software, design, and included assets.</h2>
      <p>Rights in Redwell Studio’s software, website design, branding, and included artwork remain with Jayesh Gavit or the respective rights holders. Access to the studio does not transfer ownership or give permission to redistribute the software or branding, except where an applicable license permits it.</p>
      <p>Third-party software and assets retain their own license terms. Permission to create artwork is not a blanket commercial license for every included element.</p>
      <p className="site-owner-detail"><strong>Owner confirmation needed:</strong> verify ownership and licenses of included artwork and any required attribution before promising unrestricted commercial use of all exported compositions.</p>
    </section>

    <section id="limits"><h2>Exports and availability.</h2>
      <p>Projects and history are kept in the active browser session. Workspace preferences do not save artwork. There is no persistent project archive or cloud backup, so export before refreshing, closing the editor, or navigating away. The operator cannot recover a project that the service never stored.</p>
      <p>Exports are finished image files, or a ZIP of Carousel images, rather than editable project files. Check the result, resolution, cropping, text, and rights before printing, publishing, or relying on it. Sharing or publishing downloaded work is your responsibility.</p>
      <p>Performance and format support depend on your browser, device, and memory. The operator may change, suspend, or discontinue features or the service, subject to applicable law. Uninterrupted availability, recovery, and a particular creative result are not guaranteed.</p>
    </section>

    <section id="third-parties"><h2>Third-party services.</h2>
      <p>The site uses third-party software packages and infrastructure to deliver its pages. Email correspondence uses external email services. If you choose to share an export through another service, its terms and privacy practices apply. The current editor does not integrate social-network publishing, advertising, or analytics.</p>
      <p>See the <Link href="/privacy">Privacy Policy</Link> for browser processing, website requests, and infrastructure details still requiring confirmation.</p>
    </section>

    <section id="legal"><h2>Disclaimers and liability.</h2>
      <p>To the extent permitted by applicable law, the free service is provided “as is” and “as available,” without warranties of uninterrupted operation, freedom from errors, fitness for a particular purpose, or non-infringement. You remain responsible for checking your work and keeping downloaded copies.</p>
      <p>To the extent permitted by applicable law, Jayesh Gavit is not liable for indirect or consequential loss, lost profits, or loss of session artwork arising from use of or inability to use the service. This limitation does not exclude liability that cannot lawfully be excluded, including any applicable liability for fraud or intentional misconduct. Mandatory consumer rights and remedies remain unaffected.</p>
      <p className="site-owner-detail"><strong>Owner and legal review needed:</strong> confirm the operator’s location, intended markets, and enforceability of acceptance, warranty, and liability provisions. No governing law, court venue, arbitration requirement, or monetary liability cap has been selected in this draft.</p>
    </section>

    <section id="questions"><h2>Changes and contact.</h2>
      <p>Revised terms will be posted here with an updated date. Material service changes, including future accounts, hosted projects, payments, or new third-party integrations, require review of these terms and any notice or acceptance process required by applicable law.</p>
      <p>For questions or content-rights concerns, contact Jayesh Gavit at <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>. See <Link href="/contact">Contact</Link> for useful details to include, or <Link href="/help">Help & FAQ</Link> for guidance on the current tools.</p>
    </section>
  </InformationPage>;
}
