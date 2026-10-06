import type { Metadata } from "next";

// Set at deployment time. Never infer a production domain from a request host.
export function getSiteOrigin(): string | undefined {
  const value = process.env.REDWELL_SITE_URL?.trim();
  if (!value) return undefined;
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('REDWELL_SITE_URL must be an HTTP(S) origin without a path, credentials, query, or fragment.');
  }
  return url.origin;
}

export function getContactEmail(): string {
  const value = process.env.REDWELL_CONTACT_EMAIL?.trim() || 'gavitjayesh08@gmail.com';
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
    throw new Error('REDWELL_CONTACT_EMAIL must be a valid public email address.');
  }
  return value;
}

export const publicRoutes = ['/', '/about', '/help', '/contact', '/privacy', '/terms'] as const;

export function publicMetadata(title: string, description: string, path: string): Metadata {
  const origin = getSiteOrigin();
  const fullTitle = `${title} | Redwell Studio`;
  const images = origin ? [{ url: `${origin}/share-image`, width: 1200, height: 630, alt: 'Redwell Studio — Make your photos matter.' }] : undefined;
  return {
    title: { absolute: fullTitle },
    description,
    ...(origin ? { alternates: { canonical: `${origin}${path}` } } : {}),
    openGraph: { type: 'website', siteName: 'Redwell Studio', title: fullTitle, description, locale: 'en_US', ...(origin ? { url: `${origin}${path}`, images } : {}) },
    twitter: { card: origin ? 'summary_large_image' : 'summary', title: fullTitle, description, ...(images ? { images } : {}) },
  };
}
