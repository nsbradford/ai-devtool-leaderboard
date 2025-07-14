import { NextResponse } from 'next/server';
import type { TopReposByDevtool } from '@/types/api';
import { getTopStarredReposByDevtool } from '@/lib/database';
import { getSecondsUntilCacheReset } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const daysBack = parseInt(searchParams.get('daysBack') || '30', 10);

    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Invalid limit. Must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (daysBack < 1 || daysBack > 365) {
      return NextResponse.json(
        { error: 'Invalid daysBack. Must be between 1 and 365' },
        { status: 400 }
      );
    }

    console.log(`Fetching top ${limit} starred repos for each devtool (${daysBack} days back)`);

    const topRepos = await getTopStarredReposByDevtool(limit, daysBack);

    const response: TopReposByDevtool = topRepos;

    console.log(`Returning top repos data for ${Object.keys(topRepos).length} devtools`);

    const ttlSeconds = getSecondsUntilCacheReset();
    const swrSeconds = 60;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`,
      },
    });
  } catch (error) {
    console.error('Error fetching top repos data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top repos data' },
      { status: 500 }
    );
  }
}
