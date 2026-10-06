import type { MetadataRoute } from 'next';
import { getSiteOrigin, publicRoutes } from '@/lib/public-site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();

  // Without a confirmed domain, omit URLs rather than publish localhost or a guessed host.
  if (!origin) return [];

  return publicRoutes.map((path) => ({
    url: `${origin}${path}`,
  }));
}