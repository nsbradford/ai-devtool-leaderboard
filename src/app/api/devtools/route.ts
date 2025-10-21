import devtoolsData from '@/devtools.json';
import { getSecondsUntilCacheReset } from '@/lib/utils';

/**
 * GET /api/devtools
 * Returns metadata for all tracked developer tools/bots.
 * Includes information like names, IDs, colors, and website URLs.
 * @returns JSON response with array of devtool metadata
 */
export async function GET() {
  const ttlSeconds = getSecondsUntilCacheReset(); // e.g. 86 400-now()
  const swrSeconds = 60; // how long to serve stale while revalidating

  return new Response(JSON.stringify(devtoolsData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Browser never caches (max-age=0), Vercel’s edge caches for `ttlSeconds`,
      // and during the last `swrSeconds` it will serve the stale copy while
      // fetching a fresh one in the background.
      'Cache-Control': `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`,
    },
  });
}
