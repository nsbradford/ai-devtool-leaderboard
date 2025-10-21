/**
 * Represents bot review activity for a specific repository on a specific date.
 */
export interface BotReviewInRepoDate {
  /** Date of the review event in YYYY-MM-DD format */
  event_date: string;
  /** GitHub repository database ID */
  repo_db_id: number;
  /** Repository full name in "owner/name" format */
  repo_full_name: string;
  /** Bot's numeric ID */
  bot_id: number;
  /** Number of reviews by this bot */
  bot_review_count: number;
  /** Number of pull requests reviewed */
  pr_count: number;
}

/**
 * Leaderboard data structure for displaying time series data across multiple tools.
 */
export interface LeaderboardData {
  /** Array of Unix timestamps (in seconds) for the time series */
  timestamps: number[];
  /** Map of tool IDs to their metric values over time */
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
 * Type of materialized view for aggregating data over rolling time windows.
 */
export type MaterializedViewType = 'weekly' | 'monthly';

/**
 * Data from a materialized view representing aggregated bot activity.
 */
export interface MaterializedViewData {
  /** Date of the aggregated data in YYYY-MM-DD format */
  event_date: string;
  /** Bot's numeric ID */
  bot_id: number;
  /** Count of unique repositories */
  repo_count: number;
}

/**
 * Represents a developer tool/bot tracked in the leaderboard.
 */
export interface DevTool {
  /** Unique numeric identifier for the tool */
  id: number;
  /** GitHub account login/username */
  account_login: string;
  /** Display name of the tool */
  name: string;
  /** URL to the tool's avatar image */
  avatar_url: string;
  /** URL to the tool's website */
  website_url: string;
  /** Primary brand color (hex code) for light theme */
  brand_color: string;
  /** Optional brand color (hex code) for dark theme */
  brand_color_dark?: string;
}

/**
 * Represents a top repository by star count.
 */
export interface TopRepo {
  /** GitHub repository database ID */
  repo_db_id: number;
  /** Repository name (note: may have occasional inconsistencies) */
  repo_name: string;
  /** Number of GitHub stars */
  star_count: number;
}

/**
 * Map of devtool IDs to their top repositories.
 */
export interface TopReposByDevtool {
  /** Devtool ID mapped to array of top repositories */
  [devtoolId: string]: TopRepo[];
}

// export interface LeaderboardQueryParams {
//   startDate?: string;
//   endDate?: string;
//   day?: string;
//   viewType?: MaterializedViewType;
// }

/**
 * GitHub repository data fetched from the GraphQL API.
 */
export interface GithubRepoGraphQLData {
  /** Repository full name in "owner/name" format */
  full_name: string;
  /** GitHub's global node ID */
  node_id?: string;
  /** GitHub's database ID */
  database_id?: number;
  /** Number of stars */
  star_count?: number;
  /** Whether there was an error fetching this data */
  is_error: boolean;
  /** ISO 8601 timestamp of when data was last updated */
  updated_at: string;
}
