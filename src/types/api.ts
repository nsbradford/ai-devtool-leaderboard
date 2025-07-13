
export interface BotReviewInRepoDate {
  event_date: string;
  repo_name: string;
  bot_id: number;
}

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

export type MaterializedViewType = 'weekly' | 'monthly';

export interface MaterializedViewData {
  event_date: string;
  bot_id: number;
  repo_count: number;
  tool_name?: string;
}

export interface LeaderboardQueryParams {
  startDate?: string;
  endDate?: string;
  day?: string;
  viewType?: MaterializedViewType;
}
