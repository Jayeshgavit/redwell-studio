# Public website audit and launch notes

## Legal/information-page follow-up — 6 October 2026

This section records the later legal-page review and supersedes the original
pending-owner/contact notes below. The rest of this document records the earlier
public-site work and its validation, not changes made during this follow-up.

Privacy, Terms, Contact, and Help now identify the current workflow, carry a
last-updated date, and retain the existing public layout and responsive styles.
The shared footer already links Contact, Privacy, Terms, and Help; those links
were reviewed and retained. Jayesh Gavit is identified as developer/operator,
with `gavitjayesh08@gmail.com` as the default public contact. The existing
`REDWELL_CONTACT_EMAIL` deployment override remains supported and is documented
in `.env.example`. Check any existing override before publishing.

### Evidence from current code

Paths below are relative to `frontend/`.

| Statement | Evidence |
| --- | --- |
| Collage and Carousel are available in the current source | `components/create/editor-shell.tsx` mode selectors and conditional workspaces; no mode or editor code changed |
| Local image selection and browser processing; no photo-upload endpoint | `photo-toolbar.tsx` file input, `photo-context.tsx` image MIME checks and `URL.createObjectURL`, renderer and export code; application request search |
| Projects/history are session state, not persisted projects | `photo-context.tsx` reducer/history and object URL lifecycle; no project persistence implementation found |
| Removing a visible photo is not immediate erasure from session memory | Provider history and object URLs can outlive the visible composition; preview has separate Blob URLs |
| Only workspace preferences use application local storage | `editor-shell.tsx`: `redwell-studio:workspace:v1` contains `activeTool`, `openPanelIds`, `dockWidth`; storage failures are caught |
| Local preview photo transfer | `editor-shell.tsx` restricts `fetch` to `blob:` URLs and posts state/Blobs via BroadcastChannel; `live-preview-workspace.tsx` recreates browser object URLs |
| Preview still requests a website page | `window.open('/preview?channel=…')`; the request URL contains a generated channel ID, not the photos |
| Local PNG/JPG, slide files/ZIP downloads | `export-dialog.tsx` exposes PNG/JPG; `export-service.ts` uses Canvas, Blobs, and download links. WebP exists in the service type but is not exposed in the dialog and is not advertised |
| No current accounts, payment, contact form, analytics, ads, or application cookie handling | Route, package/configuration, and request/storage/script searches in `app`, `components`, and `lib` |
| Bundled icons and site-served artwork; no configured remote fonts/CDN | Element catalog/artwork, global/public styles, root layout, Next configuration. Software packages are not treated as remote tracking providers |

The supplied name/email are owner-provided facts, not conclusions from source.
A Gmail address establishes the receiving address domain; it does not establish
who accesses messages, how they are used, or their retention. Source inspection
cannot establish production infrastructure behavior or browser extensions.

### Owner decisions still needed

- Confirm production origin, host/CDN and any injected services, request logs,
  cookies, recipients, processing locations, retention, and transfers.
- Confirm operator location and intended markets; obtain legal review of legal
  bases, rights handling, any required business/address disclosures, agreement
  formation, eligibility/children, warranty and liability provisions. No governing
  law, venue, arbitration requirement, monetary cap, or age threshold was invented.
- Confirm correspondence purposes, access, retention/deletion and rights-request
  procedures. No email retention period or response-time promise was invented.
- Verify ownership, third-party asset licenses and attribution before promising
  unrestricted commercial use. Confirm final adoption/effective date after review;
  the displayed date is a last-updated date for product-generated legal drafts.

No incorporation, registered entity, office, support team, certification, zero
collection, zero hosting logs, or regulatory/AdSense approval guarantee is claimed.
Terms include qualified service disclaimers and liability language with mandatory
rights preserved; enforceability remains subject to owner/legal review.

### Before enabling AdSense or analytics

1. Inventory the exact integration and deployment settings: collected data/events,
   cookies/local storage, identifiers, providers/recipients, purposes, retention,
   processing locations/transfers, and personalized versus other advertising.
2. Update Privacy's tracking section and any affected requests, retention, choices,
   children, or third-party sections before processing starts. Include provider
   privacy links and actual opt-out/choice instructions. Update Terms if needed.
3. Determine applicable regional law and current provider requirements; implement
   required consent/rejection/withdrawal and tag gating before activation. Do not
   assume a generic banner, non-personalized ads, or browser cookie blocking alone
   satisfies all requirements. Reassess functional local storage separately.
4. For AdSense, review Google's third-party cookie/advertising disclosures and
   user choices. Google currently requires a certified CMP integrating with IAB
   TCF for personalized ads in the EEA, UK, and Switzerland. Recheck at integration
   time; this is not a determination that any specific law applies to this operator.
5. Verify actual network behavior and consent outcomes, including rejection and
   withdrawal, before launch. Ensure photos, artwork, and text are not inadvertently
   included in analytics events, error reports, or advertising data.

Sources checked for this follow-up:

- [FTC privacy and security guidance](https://www.ftc.gov/business-guidance/privacy-security)
- [AdSense required privacy content](https://support.google.com/adsense/answer/1348695?hl=en)
- [AdSense cookies](https://support.google.com/adsense/answer/7549925?hl=en)
- [Google CMP requirements](https://support.google.com/adsense/answer/16918505?hl=en)

No advertising/analytics script or consent banner was added. These drafts are not
professional legal advice and do not guarantee compliance, advertising approval,
or legal protection.

### Follow-up file inventory and validation

Modified only:

- `frontend/app/privacy/page.tsx`
- `frontend/app/terms/page.tsx`
- `frontend/app/contact/page.tsx`
- `frontend/app/help/page.tsx`
- `frontend/components/public/site.tsx` (shared legal-draft notice only)
- `frontend/lib/public-site.ts` (default contact address only)
- `frontend/.env.example` (public contact configuration comments/default)
- `PUBLIC_WEBSITE_REVIEW.md` (this follow-up record)

No files created or deleted. No editor, Collage, Carousel, dependencies, or CSS
changed. Follow-up validation:

- `frontend/node_modules/.bin/tsc.cmd --noEmit --incremental false`: passed;
  no emitted files or incremental output.
- Transient Node checks using installed TypeScript: passed TSX syntax, dates on
  all four pages, contents anchors, internal route links, footer legal/help links,
  legal notice, and default/blank/valid-override/invalid contact configuration.
  Test environment overrides existed only in the validation process.
- Source review confirmed the existing responsive page structure, semantic
  navigation, contact links, and isolated public styling remain in use. The source
  file inventory above covers this follow-up only.
- No build, dev server, browser automation, screenshots, dependency installation,
  Git operations, commit, or push. Rendered visual review was not performed.

Prepared 6 October 2026 from the current working tree. This work concerns public
pages only; no editor, Carousel, shared editor types, dependencies, or global
theme styles were edited.

## Original findings

- The homepage had a clear editorial identity worth retaining: the headline,
  asymmetric compositions, charcoal, warm paper, and red accents.
- Navigation was hidden below the desktop breakpoint. The footer repeated
  homepage links without About, Contact, Help, or legal information.
- Repeated introductory, capability, statement, and final CTA sections made the
  page long without adding much practical product information.
- Layout examples used invented editorial titles and artwork, not actual preset
  geometry; all format and layout cards opened the same unconfigured editor.
- Only `/`, `/create`, and `/preview` existed. There was no help guide,
  operator information, privacy policy, or terms.
- Root metadata was only “Redwell Studio” / “Collage editor”. No canonical,
  social image, robots, sitemap, or favicon configuration existed.
- Header/footer landmarks were inside the homepage main landmark. Decorative
  text was exposed as content, small copy was low contrast, and public navigation
  had no explicit focus treatment or skip link.

## Verified product and data behavior

Read-only inspection covered the route tree, root layout, global styles,
Tailwind/Next/package configuration, editor mode controls, photo selection and
provider, export dialog/service, element catalog, and live-preview protocol.

- `components/create/editor-shell.tsx` exposes both Collage and Carousel modes.
  Carousel is described as secondary; no route or mode was activated by this work.
- `types/editor.ts` defines the four advertised formats. The homepage reads
  those constants and three real Collage presets without changing them.
- `photo-toolbar.tsx` selects local files; `photo-context.tsx` validates image
  types and creates browser object URLs. There is no photo-upload endpoint.
- `export-service.ts` rasterizes in Canvas 2D and creates local downloads/ZIPs.
  The current **export dialog exposes PNG and JPG**, so WebP is not advertised.
- Editor state is in the provider's browser session, not persistent project
  storage. No project recovery or cloud backup is promised.
- `editor-shell.tsx` stores active tool, open panel IDs, and dock width in
  `redwell-studio:workspace:v1` local storage. These are preferences, not photos.
- Live preview sends artwork and photo Blobs between same-site tabs through
  BroadcastChannel. Its `fetch` call reads `blob:` URLs, not a photo server.
- Included elements are bundled icons/local assets. The public homepage uses
  CSS artwork rather than external photos. No remote font loading exists;
  global CSS declares Inter with system fallbacks without supplying an Inter file.
- No application account, payment, subscription, contact submission, analytics,
  ad integration, tracking pixel, or cookie implementation was found in the
  inspected application. Infrastructure behavior is not established by source.

## Resulting public structure

- `/`: concise Collage-first introduction, real preset diagrams, accurate
  formats/features, workflow, session-saving guidance, and restrained CTAs.
- `/about`: product purpose and design approach without invented business history.
- `/help`: first-collage guide, export choices, and troubleshooting/FAQ.
- `/contact`: issue-report guidance and a configured email link, or an explicit
  pending-address notice when no verified email has been supplied.
- `/privacy`, `/terms`: readable drafts with section navigation, visible legal
  review notices, and clearly identified owner details awaiting completion.
- Features and layout examples remain homepage sections rather than thin routes.
- Shared header/footer and information-page shell are server components. Public
  styles use a `.public-site` wrapper and namespaced classes; editor global
  styles remain unchanged.

## Required owner inputs before public launch

1. Confirm the production origin and monitored public support/privacy email.
   Set `REDWELL_SITE_URL` and `REDWELL_CONTACT_EMAIL` using
   `frontend/.env.example` as a guide, **before the production build**.
2. Identify the operator's legal name, applicable location/jurisdiction, and any
   legally required address or business disclosures. No invented legal entity,
   registration, phone, or address has been added.
3. Confirm production hosting/delivery providers, request logs, cookies added by
   infrastructure, retention, recipients, processing locations, and transfers.
4. Confirm inquiry handling and email provider/retention. Contact is a mail link;
   this work adds no form backend or message database.
5. Confirm licenses and notices for included assets, especially before making
   blanket commercial-use promises.
6. Obtain legal review covering agreement formation, eligibility/children,
   legal bases and rights procedures, security, consumer rights, warranties,
   liability, governing law, and dispute resolution. Complete placeholders and
   set actual effective dates. The drafts are not production legal advice.

No claim of “no data collected anywhere”, zero hosting logs, absolute privacy,
specific retention, free-forever pricing, or unlimited commercial rights was made.

## SEO and deployment behavior

Public pages have distinct titles/descriptions, Open Graph and Twitter metadata.
Canonical URLs, social-image URLs, and truthful WebApplication JSON-LD are emitted
only when `REDWELL_SITE_URL` is configured. `/share-image` supplies a generated
1200 × 630 PNG; no third-party assets or image generation service are used.

`/sitemap.xml` lists only the six public content routes when a domain is configured.
It is intentionally empty otherwise. `/robots.txt` allows public content and
discourages crawling `/create` and `/preview`; it lists the sitemap only with a
confirmed origin. No fake domain or misleading modification dates are emitted.
Robots exclusions are not access controls or guaranteed removal from search.
Route-level noindex for workspace pages can be considered separately if needed;
their implementation was outside this task.

After configuration, rebuild and verify canonical URLs and sharing metadata at
the live origin; check the sitemap and submit it through the owner's search tools.
The configuration requires an origin, not a URL containing a path or query.

## Accessibility and visual review

Public pages have sibling header/main/footer landmarks, a skip link, one primary
heading, descriptive links, visible focus rings, readable prose, and navigation
available at all widths. Decorative artwork is hidden from assistive technology;
captions explain its purpose. Layout cards are informational rather than implying
a preset has been selected on click. FAQ uses native `details`/`summary`.

Responsive source review covers 320, 375, 414, and 768px layouts. The header has a
second navigation row below 960px, grids use zero-minimum tracks, labels remain
single-line while their containers wrap, and display text can break if needed.
No reveal animation, hover movement, or JavaScript menu was added. Reduced-motion
styles are present. Body colors use existing dark/muted tokens on warm paper;
the dark feature/footer bands use brighter dedicated text and focus colors.

No browser automation, screenshots, dev-server startup, or visual regression
testing was performed, per the task and RULES.md. Manual owner review at narrow
and wide widths, keyboard navigation, 200% zoom, and real social-card previews
remains recommended; source checks do not replace rendered visual review.

## Future advertising/analytics

No AdSense script, analytics tag, cookie banner, fake testimonial, review, metric,
award, or approval promise was added. Quality/transparency improvements are useful
to visitors and do not guarantee AdSense approval.

Before adding a service, document its actual data/cookies, providers, purposes,
retention, disclosures, and user choices. Assess regional consent requirements
and implement any required controls **before activating the tags**, including
Google's applicable consent requirements if Google publisher products are chosen.
Recheck current policy requirements at integration time.

Reference sources consulted:
- [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js sitemap convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [AdSense privacy policy content](https://support.google.com/adsense/answer/1348695?hl=en)
- [How AdSense uses cookies](https://support.google.com/adsense/answer/7549925?hl=en)

## Validation

- `frontend/node_modules/.bin/tsc.cmd --noEmit --incremental false`: passed.
  No emitted TypeScript or incremental output was requested.
- Transient Node/React server-render checks: passed for all six public routes.
  Checked one H1/main per page, skip/main/footer navigation, distinct useful
  metadata, every internal link and anchor, all three actual layout diagrams,
  contact/legal fallbacks, and configured domain/email behavior using reserved
  `.test` fixtures confined to the validation process.
- Metadata/robots/sitemap and schema checks: passed with and without a domain.
  Invalid URL/email configuration is rejected. No fixture details were written
  into product files or production output.
- WCAG contrast calculations: body 17.46:1; muted text on paper 5.52:1 and on the
  neutral surface 5.16:1; red-button text 5.98:1; dark-band muted text 10.62:1.
- Normal `npm run build` compiled and passed its type checks, then failed during
  page-data collection with a missing `/_document` in the existing `.next` output.
- An isolated production build using the installed Next.js builder and a separate
  output directory passed compilation and generated all 15 static pages/handlers.
  Type validation was skipped in that isolated run because the standalone check
  had already passed. No source configuration change was required. The sandbox's
  worker-spawn restriction initially produced EPERM; the isolated build succeeded
  with approved execution outside the sandbox.
- Inspected generated public HTML titles, descriptions, Open Graph headings,
  robots exclusions, and empty sitemap behavior; verified the share PNG dimensions
  and visually inspected the generated social image (not a browser screenshot).
- Next.js temporarily added its validation types path to `tsconfig.json` and
  adjusted generated declarations. Those validation-only changes were removed;
  both files match their prior content. Temporary isolated output was removed.
- Source review checked responsive rules and public-style isolation. No browser
  automation, dev server, dependency installation, Git restore/sync, commit, or
  push was performed. Existing editor changes in the working tree were preserved.
- No lint dependency/config was present to support a separate lint check; no new
  lint tooling was installed. Manual rendered page review remains outstanding.

## Exact source-file inventory

Modified:
- `frontend/app/page.tsx`
- `frontend/app/layout.tsx`

Created:
- `frontend/app/about/page.tsx`
- `frontend/app/help/page.tsx`
- `frontend/app/contact/page.tsx`
- `frontend/app/privacy/page.tsx`
- `frontend/app/terms/page.tsx`
- `frontend/app/robots.ts`
- `frontend/app/sitemap.ts`
- `frontend/app/share-image/route.tsx`
- `frontend/app/icon.svg`
- `frontend/components/public/site.tsx`
- `frontend/components/public/site.css`
- `frontend/components/public/layout-preview.tsx`
- `frontend/lib/public-site.ts`
- `frontend/.env.example`
- `PUBLIC_WEBSITE_REVIEW.md`

Deleted: no application/source files. Only the two temporary output directories
created by this task were removed after validating their paths and contents:
`frontend/.next-public-site-check` and `frontend/.next-public-site-verify`.
