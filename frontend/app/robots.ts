import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/public-site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/create', '/preview'] },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
