// Copyright 2025 Anysphere Inc.

import { NextResponse } from 'next/server';
import type { LeaderboardData, MaterializedViewType } from '@/types/api';
import { getMaterializedReviewCountData } from '@/lib/postgres/bot_reviews_daily_by_repo';
import { getSecondsUntilCacheReset } from '@/lib/utils';
import { DEFAULT_START_DATE } from '@/lib/constants';

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

    // Always fetch all available data - use a very wide date range
    const queryStartDate = DEFAULT_START_DATE;
    const queryEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // Future date to get all data

    const materializedData = await getMaterializedReviewCountData(
      viewType,
      queryStartDate,
      queryEndDate
    );

    // Return empty data structure if no data
    if (!materializedData || materializedData.length === 0) {
      return NextResponse.json({
        timestamps: [],
        tools: {},
      });
    }

    // Group data by date and ensure consistent structure
    const dateGroups = new Map<
      string,
      { bot_id: number; review_count: number }[]
    >();
    const allBotIds = new Set<number>();

    // First pass: collect all bot IDs and group by date
    materializedData.forEach((item) => {
      allBotIds.add(item.bot_id);
      const date = item.event_date;
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups
        .get(date)!
        .push({ bot_id: item.bot_id, review_count: item.review_count });
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
        tools[toolId][dateIndex] = item.review_count;
      });
    });

    const leaderboardData: LeaderboardData = {
      timestamps,
      tools,
    };

    const ttlSeconds = getSecondsUntilCacheReset();
    const swrSeconds = 60;
    return new Response(JSON.stringify(leaderboardData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${swrSeconds}`,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard review data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard review data' },
      { status: 500 }
    );
  }
}
