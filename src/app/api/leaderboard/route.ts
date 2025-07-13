import { NextResponse } from 'next/server';
import type { LeaderboardData } from '@/types/api';
import { getLeaderboardDataForDateRange, getLeaderboardDataForDay } from '@/lib/bigquery';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const singleDay = searchParams.get('day'); // New parameter for single day queries
    
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let leaderboardData: LeaderboardData;
    
    if (singleDay) {
      // Single day query - more efficient
      console.log(`Fetching leaderboard data for single day: ${singleDay}`);
      const dayResults = await getLeaderboardDataForDay(singleDay);
      
      // Convert to the expected format
      const timestamp = Math.floor(new Date(singleDay).getTime() / 1000);
      const tools: Record<string, number[]> = {};
      
      // Calculate total active repos from the percentage data
      let totalActiveRepos = 0;
      if (dayResults.length > 0) {
        // Find the tool with the highest percentage to estimate total active repos
        const maxPercentage = Math.max(...dayResults.map(r => r.pct_of_active_repos));
        const maxRepoCount = Math.max(...dayResults.map(r => r.repo_count));
        totalActiveRepos = Math.round((maxRepoCount / maxPercentage) * 100);
      }
      
      dayResults.forEach(result => {
        tools[result.tool] = [result.repo_count];
      });
      
      leaderboardData = {
        timestamps: [timestamp],
        active_repos: [totalActiveRepos],
        tools
      };
    } else {
      // Date range query
      const queryStartDate = startDate || defaultStartDate;
      const queryEndDate = endDate || defaultEndDate;
      
      console.log(`Fetching leaderboard data from ${queryStartDate} to ${queryEndDate}`);
      const rangeResults = await getLeaderboardDataForDateRange(queryStartDate, queryEndDate);
      
      // For date ranges, we need to aggregate the data differently
      // This is a simplified approach - you might want to enhance this
      const tools: Record<string, number[]> = {};
      const allTools = new Set<string>();
      
      rangeResults.forEach(result => {
        allTools.add(result.tool);
        if (!tools[result.tool]) {
          tools[result.tool] = [];
        }
        tools[result.tool].push(result.repo_count);
      });
      
      // For now, we'll create a single data point representing the aggregated range
      const midTimestamp = Math.floor((new Date(queryStartDate).getTime() + new Date(queryEndDate).getTime()) / 2000);
      const totalActiveRepos = rangeResults.reduce((sum, result) => sum + result.repo_count, 0);
      
      leaderboardData = {
        timestamps: [midTimestamp],
        active_repos: [totalActiveRepos],
        tools
      };
    }

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
