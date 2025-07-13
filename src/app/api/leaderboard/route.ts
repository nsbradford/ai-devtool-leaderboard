import { NextResponse } from 'next/server';
import type { LeaderboardData, MaterializedViewType, MaterializedViewData } from '@/types/api';
import { getLeaderboardDataForDateRange } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const viewType = (searchParams.get('viewType') as MaterializedViewType) || 'weekly';
    
    // Validate viewType
    if (!['weekly', 'monthly'].includes(viewType)) {
      return NextResponse.json(
        { error: 'Invalid viewType. Must be "weekly" or "monthly"' },
        { status: 400 }
      );
    }
    
    // Set default dates (30 days ago to yesterday)
    const defaultEndDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const queryStartDate = startDate || defaultStartDate;
    const queryEndDate = endDate || defaultEndDate;
    
    // Validate date format and order
    const startDateObj = new Date(queryStartDate);
    const endDateObj = new Date(queryEndDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching ${viewType} leaderboard data from ${queryStartDate} to ${queryEndDate}`);
    
    const materializedData = await getLeaderboardDataForDateRange(queryStartDate, queryEndDate, viewType);

    // Return empty data structure if no data
    if (!materializedData || materializedData.length === 0) {
      return NextResponse.json({
        timestamps: [],
        tools: {}
      });
    }

    // Group data by date and ensure consistent structure
    const dateGroups = new Map<string, MaterializedViewData[]>();
    const allBotIds = new Set<number>();
    
    // First pass: collect all bot IDs and group by date
    materializedData.forEach(item => {
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
    const timestamps = sortedDates.map(date => Math.floor(new Date(date).getTime() / 1000));
    
    // Initialize tools object with all bot IDs
    const tools: Record<string, number[]> = {};
    const botIdStrings = Array.from(allBotIds).map(id => id.toString());
    
    botIdStrings.forEach(botId => {
      tools[botId] = new Array(sortedDates.length).fill(0);
    });

    // Fill in the data for each date
    sortedDates.forEach((date, dateIndex) => {
      const dayData = dateGroups.get(date) || [];
      
      dayData.forEach(item => {
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
      tools
    };
    
    console.log(`Returning leaderboard data with ${timestamps.length} timestamps and ${Object.keys(tools).length} tools`);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const secondsUntilMidnight = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);

    const response = NextResponse.json(leaderboardData);
    response.headers.set('Cache-Control', `public, max-age=${secondsUntilMidnight}, s-maxage=${secondsUntilMidnight}`);
    
    return response;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
