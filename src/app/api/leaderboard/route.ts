import { NextResponse } from 'next/server';
import type {
  LeaderboardData,
  MaterializedViewType,
  MaterializedViewData,
} from '@/types/api';
import { getLeaderboardDataForDateRange } from '@/lib/database';
import { getSecondsUntilCacheReset } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewType =
      (searchParams.get('viewType') as MaterializedViewType) || 'weekly';

    // Validate viewType
    if (!['weekly', 'monthly'].includes(viewType)) {
      return NextResponse.json(
        { error: 'Invalid viewType. Must be "weekly" or "monthly"' },
        { status: 400 }
      );
    }

    console.log(
      `Fetching ${viewType} leaderboard data for all available dates`
    );

    // Always fetch all available data - use a very wide date range
    const queryStartDate = '2023-01-01'; // Start from beginning of 2023
    const queryEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // Future date to get all data

    const materializedData = await getLeaderboardDataForDateRange(
      queryStartDate,
      queryEndDate,
      viewType
    );

    // Return empty data structure if no data
    if (!materializedData || materializedData.length === 0) {
      return NextResponse.json({
        timestamps: [],
        tools: {},
      });
    }

    // Group data by date and ensure consistent structure
    const dateGroups = new Map<string, MaterializedViewData[]>();
    const allBotIds = new Set<number>();

    // First pass: collect all bot IDs and group by date
    materializedData.forEach((item) => {
      allBotIds.add(item.bot_id);
      const date = item.event_date;
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(item);
    });

    // Get sorted dates (chronological order)
    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Convert dates to timestamps
    const timestamps = sortedDates.map((date) =>
      Math.floor(new Date(date).getTime() / 1000)
    );

    // Initialize tools object with all bot IDs
    const tools: Record<string, number[]> = {};
    const botIdStrings = Array.from(allBotIds).map((id) => id.toString());

    botIdStrings.forEach((botId) => {
      tools[botId] = new Array(sortedDates.length).fill(0);
    });

    // Fill in the data for each date
    sortedDates.forEach((date, dateIndex) => {
      const dayData = dateGroups.get(date) || [];

      dayData.forEach((item) => {
        const toolId = item.bot_id.toString();
        // Ensure the tool exists in our tools object
        if (!tools[toolId]) {
          tools[toolId] = new Array(sortedDates.length).fill(0);
        }
        tools[toolId][dateIndex] = item.repo_count;
      });
    });

    const leaderboardData: LeaderboardData = {
      timestamps,
      tools,
    };

    console.log(
      `Returning leaderboard data with ${timestamps.length} timestamps and ${Object.keys(tools).length} tools`
    );

    const ttlSeconds = getSecondsUntilCacheReset(); // e.g. 86 400-now()
    const swrSeconds = 60; // how long to serve stale while revalidating
    return new Response(JSON.stringify(leaderboardData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Browser never caches (max-age=0), Vercel's edge caches for `ttlSeconds`,
        // and during the last `swrSeconds` it will serve the stale copy while
        // fetching a fresh one in the background.
        'Cache-Control': `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
