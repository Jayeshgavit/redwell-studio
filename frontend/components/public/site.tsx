import Link from "next/link";
import type { ReactNode } from "react";
import "./site.css";

const navigation = [
  { href: '/#features', label: 'Features' },
  { href: '/#layouts', label: 'Layouts' },
  { href: '/help', label: 'Help' },
  { href: '/about', label: 'About' },
];

export function SiteFrame({ children, currentPath = '/', className = '' }: { children: ReactNode; currentPath?: string; className?: string }) {
  return (
    <div className={`public-site ${className}`}>
      <a className="site-skip" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="site-container site-header-row">
          <Link href="/" className="site-brand" aria-label="Redwell Studio home">
            <span className="site-mark" aria-hidden="true"><span /></span>
            <span>Redwell Studio</span>
          </Link>
          <Link href="/create" className="site-button site-button-small">Open studio <span aria-hidden="true">↗</span></Link>
          <nav className="site-nav" aria-label="Main navigation">
            {navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={currentPath === href ? 'page' : undefined}>{label}</Link>)}
          </nav>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="site-container">
          <div className="site-footer-top">
            <div><Link className="site-footer-brand" href="/">Redwell Studio</Link><p>A little structure. A story of your own.</p></div>
            <Link className="site-text-link" href="/create">Make a collage <span aria-hidden="true">↗</span></Link>
          </div>
          <nav className="site-footer-links" aria-label="Footer navigation">
            {[...navigation, { href: '/contact', label: 'Contact' }, { href: '/privacy', label: 'Privacy Policy' }, { href: '/terms', label: 'Terms of Use' }].map(({ href, label }) => <Link key={href} href={href} aria-current={currentPath === href ? 'page' : undefined}>{label}</Link>)}
          </nav>
          <p className="site-footer-note">Collage creation in your browser. No account required.</p>
        </div>
      </footer>
    </div>
  );
}

export function InformationPage({ title, intro, path, children, contents }: {
  title: string; intro: string; path: string; children: ReactNode;
  contents?: { id: string; title: string }[];
}) {
  return (
    <SiteFrame currentPath={path}>
      <main id="main-content" tabIndex={-1} className="site-container site-information">
        <div className="site-information-heading"><h1>{title}</h1><p className="site-lead">{intro}</p></div>
        <div className={contents ? 'site-document-grid' : 'site-document-single'}>
          {contents && <nav className="site-contents" aria-label="On this page"><p>On this page</p><ul>{contents.map(({ id, title: label }) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ul></nav>}
          <div className="site-prose">{children}</div>
        </div>
      </main>
    </SiteFrame>
  );
}

export function LegalReviewNotice() {
  return <aside className="site-notice" aria-label="Legal review notice"><strong>Product-generated legal draft.</strong> This text is based on the current implementation and is not professional legal advice. It does not guarantee regulatory compliance, advertising approval, or legal protection. Items marked for owner confirmation remain open for review.</aside>;
}
