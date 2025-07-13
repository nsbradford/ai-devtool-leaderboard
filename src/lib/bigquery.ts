import { BigQuery } from '@google-cloud/bigquery';
import devtools from '../devtools.json';

export interface LeaderboardResult {
  tool: string;
  repo_count: number;
  pct_of_active_repos: number;
}

/**
 * Parse base64-encoded Google Cloud service account credentials
 * @returns Parsed credentials object or undefined if not available
 */
function parseGoogleCredentials(): any {
  const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsBase64) {
    return undefined;
  }
  
  try {
    return JSON.parse(Buffer.from(credentialsBase64, 'base64').toString());
  } catch (error) {
    console.error('Failed to parse Google Cloud credentials:', error);
    return undefined;
  }
}

/**
 * Get BigQuery client with default configuration
 * @returns BigQuery client instance
 */
function getBigQueryClient(): BigQuery {
  return new BigQuery({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: parseGoogleCredentials(),
  });
}

/**
 * Runs a BigQuery query to get leaderboard data for AI dev tools
 * @param startDate Start date for the query (YYYY-MM-DD format)
 * @param endDate End date for the query (YYYY-MM-DD format), defaults to current date
 * @returns Promise<LeaderboardResult[]> Array of tool metrics
 */
export async function getLeaderboardData(
  startDate: string,
  endDate?: string
): Promise<LeaderboardResult[]> {
  try {
    // Initialize BigQuery client
    const bigquery = getBigQueryClient();

    // Extract bot IDs from devtools.json
    const botIds = devtools.map(tool => tool.id.toString());
    
    // Use provided end date or default to current date
    const endDateStr = endDate || new Date().toISOString().split('T')[0];

    // Build the query
    const query = `
      DECLARE start_date DATE DEFAULT DATE('${startDate}');
      DECLARE end_date DATE DEFAULT DATE('${endDateStr}');
      DECLARE bot_ids ARRAY<INT64> DEFAULT [${botIds.join(', ')}];

      -- 1️⃣ Pull only the months we need
      WITH raw_events AS (
        SELECT
          repo.name AS repo_name,
          actor.id AS actor_id,
          type,
          DATE(created_at) AS created_date
        FROM \`githubarchive.month.*\`
        WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m', start_date)
                                AND FORMAT_DATE('%Y%m', end_date)
      ),

      -- 2️⃣ Active repos = any PR opened in window
      active_repos AS (
        SELECT DISTINCT repo_name
        FROM raw_events
        WHERE type = 'PullRequestEvent'
          AND created_date >= start_date
          AND created_date <= end_date
      ),

      -- 3️⃣ Bot reviews in window
      bot_reviews AS (
        SELECT DISTINCT
               repo_name,
               actor_id AS bot_id
        FROM raw_events
        WHERE type = 'PullRequestReviewEvent'
          AND created_date >= start_date
          AND created_date <= end_date
          AND actor_id IN UNNEST(bot_ids)
      )

      -- 4️⃣ Leaderboard
      SELECT
        (SELECT name FROM \`${bigquery.projectId}.your_dataset.devtools\` WHERE id = bot_id) AS tool,
        COUNT(*) AS repo_count,
        ROUND(
          100 * COUNT(*) / (SELECT COUNT(*) FROM active_repos),
          2
        ) AS pct_of_active_repos
      FROM bot_reviews
      GROUP BY bot_id
      ORDER BY repo_count DESC
    `;

    console.log(`Running BigQuery leaderboard query from ${startDate} to ${endDateStr}...`);
    console.log(`Bot IDs: ${botIds.join(', ')}`);

    // Execute the query
    const [rows] = await bigquery.query({
      query,
      useLegacySql: false,
    });

    console.log(`Query completed. Found ${rows.length} results.`);

    return rows as LeaderboardResult[];
  } catch (error) {
    console.error('BigQuery leaderboard query failed:', error);
    throw error;
  }
}

/**
 * Get leaderboard data for the last N days (for daily updates)
 * @param lookbackDays Number of days to look back from current date
 * @returns Promise<LeaderboardResult[]> Array of tool metrics
 */
export async function getLeaderboardDataForLastDays(
  lookbackDays: number = 7
): Promise<LeaderboardResult[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  return getLeaderboardData(startDateStr);
}

/**
 * Get leaderboard data for a specific date range (for backfills)
 * @param startDate Start date (YYYY-MM-DD format)
 * @param endDate End date (YYYY-MM-DD format)
 * @returns Promise<LeaderboardResult[]> Array of tool metrics
 */
export async function getLeaderboardDataForDateRange(
  startDate: string,
  endDate: string
): Promise<LeaderboardResult[]> {
  return getLeaderboardData(startDate, endDate);
}

/**
 * Get the list of bot IDs from devtools.json
 */
export function getBotIds(): string[] {
  return devtools.map(tool => tool.id.toString());
}
