import { NextResponse } from 'next/server';
import type { LeaderboardData } from '@/types/api';
import { getSnapshotsInDateRange } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const defaultEndDate = new Date().toISOString().split('T')[0];
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const queryStartDate = startDate || defaultStartDate;
    const queryEndDate = endDate || defaultEndDate;
    
    let snapshots = [];
    try {
      snapshots = await getSnapshotsInDateRange(queryStartDate, queryEndDate);
    } catch (dbError) {
      console.warn('Database connection failed, returning empty data:', dbError);
      return NextResponse.json({
        timestamps: [],
        active_repos: [],
        tools: {}
      });
    }
    
    if (snapshots.length === 0) {
      return NextResponse.json({
        timestamps: [],
        active_repos: [],
        tools: {}
      });
    }

    const dateMap = new Map<string, Map<string, any>>();
    const allTools = new Set<string>();
    
    for (const snapshot of snapshots) {
      const dateKey = snapshot.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, new Map());
      }
      
      const dayData = dateMap.get(dateKey)!;
      dayData.set('total_active_repos', snapshot.total_active_repos);
      dayData.set(snapshot.tool, snapshot.repo_count);
      allTools.add(snapshot.tool);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const timestamps = sortedDates.map(date => Math.floor(new Date(date).getTime() / 1000));
    
    const active_repos: number[] = [];
    const tools: Record<string, number[]> = {};
    
    for (const tool of allTools) {
      tools[tool] = [];
    }
    
    for (const date of sortedDates) {
      const dayData = dateMap.get(date)!;
      const totalActiveRepos = dayData.get('total_active_repos') || 0;
      active_repos.push(totalActiveRepos);
      
      for (const tool of allTools) {
        const toolCount = dayData.get(tool) || 0;
        tools[tool].push(toolCount);
      }
    }

    const data: LeaderboardData = {
      timestamps,
      active_repos,
      tools
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
