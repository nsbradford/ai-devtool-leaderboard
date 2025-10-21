// Copyright 2025 Anysphere Inc.

export interface BotReviewInRepoDate {
  event_date: string;
  repo_db_id: number;
  repo_full_name: string;
  bot_id: number;
  bot_review_count: number;
  pr_count: number;
}

export interface LeaderboardData {
  timestamps: number[];
  tools: Record<number, number[]>; // tool_id -> repo_count[]
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
  id: number;
  account_login: string;
  name: string;
  avatar_url: string;
  website_url: string;
  brand_color: string;
  brand_color_dark?: string;
}

export interface TopRepo {
  repo_db_id: number;
  repo_name: string; // note that there may be occasional inconsistencies
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

export interface GithubRepoGraphQLData {
  full_name: string;
  node_id?: string;
  database_id?: number;
  star_count?: number;
  is_error: boolean;
  updated_at: string; // ISO string
}
