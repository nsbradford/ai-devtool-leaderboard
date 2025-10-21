/**
 * Represents bot review activity for a specific repository on a specific date.
 */
export interface BotReviewInRepoDate {
  /** Date of the event in YYYY-MM-DD format */
  event_date: string;
  /** GitHub repository database ID */
  repo_db_id: number;
  /** Full repository name (owner/repo) */
  repo_full_name: string;
  /** Bot user ID */
  bot_id: number;
  /** Total number of bot reviews */
  bot_review_count: number;
  /** Total number of pull requests reviewed */
  pr_count: number;
}

/**
 * Leaderboard data structure for chart rendering.
 */
export interface LeaderboardData {
  /** Array of Unix timestamps for the data points */
  timestamps: number[];
  /** Mapping of tool ID to array of repository counts over time */
  tools: Record<number, number[]>; // tool_id -> repo_count[]
}

/**
 * Represents a date range with start and end dates.
 */
export interface DateRange {
  /** Start date in YYYY-MM-DD format */
  startDate: string;
  /** End date in YYYY-MM-DD format */
  endDate: string;
}

/**
 * Type of materialized view for aggregating data.
 */
export type MaterializedViewType = 'weekly' | 'monthly';

/**
 * Data from materialized views containing aggregated bot activity.
 */
export interface MaterializedViewData {
  /** Date of the event in YYYY-MM-DD format */
  event_date: string;
  /** Bot user ID */
  bot_id: number;
  /** Number of repositories with bot activity */
  repo_count: number;
}

/**
 * Represents a development tool/bot tracked by the system.
 */
export interface DevTool {
  /** Unique tool identifier (matches GitHub user ID) */
  id: number;
  /** GitHub account login name */
  account_login: string;
  /** Display name of the tool */
  name: string;
  /** URL to the tool's avatar image */
  avatar_url: string;
  /** Tool's website URL */
  website_url: string;
  /** Brand color for light theme */
  brand_color: string;
  /** Optional brand color for dark theme */
  brand_color_dark?: string;
}

/**
 * Represents a top repository with star count.
 */
export interface TopRepo {
  /** GitHub repository database ID */
  repo_db_id: number;
  /** Repository name (note: may have occasional inconsistencies) */
  repo_name: string;
  /** Number of stars the repository has */
  star_count: number;
}

/**
 * Maps dev tool IDs to their top repositories.
 */
export interface TopReposByDevtool {
  /** Dev tool ID as string key mapping to array of top repositories */
  [devtoolId: string]: TopRepo[];
}

// export interface LeaderboardQueryParams {
//   startDate?: string;
//   endDate?: string;
//   day?: string;
//   viewType?: MaterializedViewType;
// }

/**
 * GitHub repository data fetched via GraphQL API.
 */
export interface GithubRepoGraphQLData {
  /** Full repository name (owner/repo) */
  full_name: string;
  /** GitHub GraphQL node ID */
  node_id?: string;
  /** GitHub database ID */
  database_id?: number;
  /** Number of stars */
  star_count?: number;
  /** Whether an error occurred fetching this data */
  is_error: boolean;
  /** ISO timestamp of when the data was last updated */
  updated_at: string;
}
