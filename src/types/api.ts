export interface BotReviewInRepoDate {
  event_date: string;
  repo_name: string;
  bot_id: number;
}

export interface LeaderboardStats {
  data: LeaderboardData;
}

export interface LeaderboardData {
  timestamps: number[];
  tools: Record<string, number[]>; // toolname -> repo_count[]
}

export interface ToolRanking {
  name: string;
  current_count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
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
}

export interface DevTool {
  id: string;
  account_login: string;
  name: string;
  avatar_url: string;
  website_url: string;
  brand_color: string;
  created_at: string;
}

export interface TopRepo {
  repo_name: string;
  star_count: number;
}

export interface TopReposByDevtool {
  [devtoolId: string]: TopRepo[];
}

// export interface LeaderboardQueryParams {
//   startDate?: string;
//   endDate?: string;
//   day?: string;
//   viewType?: MaterializedViewType;
// }
