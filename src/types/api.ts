export interface LeaderboardData {
  timestamps: number[];
  active_repos: number[];
  tools: Record<string, number[]>;
}

export interface ToolRanking {
  name: string;
  current_count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface LeaderboardStats {
  total_active_repos: number;
  rankings: ToolRanking[];
  data: LeaderboardData;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
