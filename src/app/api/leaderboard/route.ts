import { NextResponse } from 'next/server';
import type { LeaderboardData, MaterializedViewType, MaterializedViewData } from '@/types/api';
import { getLeaderboardDataForDateRange, getLeaderboardDataForDay } from '@/lib/bigquery';
import { getToolNamesForBotIds } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const singleDay = searchParams.get('day');
    const viewType = (searchParams.get('viewType') as MaterializedViewType) || 'weekly';
    
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let materializedData: MaterializedViewData[];
    
    if (singleDay) {
      // Single day query
      console.log(`Fetching ${viewType} leaderboard data for single day: ${singleDay}`);
      materializedData = await getLeaderboardDataForDay(singleDay, viewType);
    } else {
      // Date range query
      const queryStartDate = startDate || defaultStartDate;
      const queryEndDate = endDate || defaultEndDate;
      
      console.log(`Fetching ${viewType} leaderboard data from ${queryStartDate} to ${queryEndDate}`);
      materializedData = await getLeaderboardDataForDateRange(queryStartDate, queryEndDate, viewType);
    }

    if (materializedData.length === 0) {
      return NextResponse.json({
        timestamps: [],
        active_repos: [],
        tools: {}
      });
    }

    // Get unique bot IDs and fetch tool names
    const botIds = [...new Set(materializedData.map(item => item.bot_id))];
    const toolNames = await getToolNamesForBotIds(botIds);

    // Group data by date
    const dateGroups = new Map<string, MaterializedViewData[]>();
    materializedData.forEach(item => {
      const date = item.event_date;
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(item);
    });

    // Convert to LeaderboardData format
    const sortedDates = Array.from(dateGroups.keys()).sort();
    const timestamps = sortedDates.map(date => Math.floor(new Date(date).getTime() / 1000));
    
    const tools: Record<string, number[]> = {};
    
    // Initialize tools with empty arrays
    Object.values(toolNames).forEach(toolName => {
      tools[toolName] = new Array(sortedDates.length).fill(0);
    });

    // Fill in the data
    sortedDates.forEach((date, dateIndex) => {
      const dayData = dateGroups.get(date)!;
      
      dayData.forEach(item => {
        const toolName = toolNames[item.bot_id] || `bot-${item.bot_id}`;
        if (!tools[toolName]) {
          tools[toolName] = new Array(sortedDates.length).fill(0);
        }
        tools[toolName][dateIndex] = item.repo_count;
      });
    });

    // Calculate total active repos (sum of all tools for each day)
    const active_repos = sortedDates.map((date) => {
      const dayData = dateGroups.get(date)!;
      return dayData.reduce((sum, item) => sum + item.repo_count, 0);
    });

    const leaderboardData: LeaderboardData = {
      timestamps,
      active_repos,
      tools
    };

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
