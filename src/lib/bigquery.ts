import { BigQuery } from '@google-cloud/bigquery';
import devtools from '../devtools.json';
import { BotReviewInRepoDate, MaterializedViewData, MaterializedViewType } from '@/types/api';
import { getMaterializedViewData } from './database';

// Type for raw BigQuery row data
interface BigQueryRow {
  event_date: { value: string } | string;
  repo_name: string;
  bot_id: number;
}

/**
 * Parse base64-encoded Google Cloud service account credentials
 * @returns Parsed credentials object or undefined if not available
 */
function parseGoogleCredentials(): object | undefined {
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
 * Get bot reviews for a specific day using the parameterized query
 * @param targetDate Target date for the query (YYYY-MM-DD format)
 * @param botIds Optional array of bot IDs to filter by, defaults to all devtools
 * @returns Promise<BotReviewResult[]> Array of bot review events
 */
export async function getBotReviewsForDay(
  targetDate: string,
  botIds?: number[]
): Promise<BotReviewInRepoDate[]> {
  try {
    const bigquery = getBigQueryClient();
    
    // Use provided bot IDs or default to all devtools
    const botIdList = botIds || devtools.map(tool => parseInt(tool.id));
    
    const query = `
      DECLARE target_date DATE DEFAULT DATE('${targetDate}');
      DECLARE bot_id_list ARRAY<INT64> DEFAULT [${botIdList.join(', ')}];

      SELECT DISTINCT
        target_date                     AS event_date,
        repo.name                       AS repo_name,
        actor.id                        AS bot_id
      FROM \`githubarchive.day.20*\`                      -- ← skips every view
      WHERE _TABLE_SUFFIX = FORMAT_DATE('%y%m%d', target_date)   -- 250712
        AND type          = 'PullRequestReviewEvent'
        AND actor.id      IN UNNEST(bot_id_list)
      ORDER BY repo_name;
    `;

    // console.log(`Running bot reviews query for ${targetDate}...`);
    // console.log(`Bot IDs: ${botIdList.join(', ')}`);

    const [rows] = await bigquery.query({
      query,
      useLegacySql: false,
    });

    // console.log(`Query completed. Found ${rows.length} bot review events.`);

    // print all the rows
    // console.log(rows);

    // Convert BigQueryDate objects to strings in YYYY-MM-DD format
    const convertedRows = rows.map((row: BigQueryRow) => ({
      event_date: typeof row.event_date === 'object' ? row.event_date.value : String(row.event_date),
      repo_name: row.repo_name,
      bot_id: row.bot_id
    }));

    return convertedRows as BotReviewInRepoDate[];
  } catch (error) {
    console.error('BigQuery bot reviews query failed:', error);
    throw error;
  }
}

/**
 * Get leaderboard data for a specific day using materialized views
 * @param targetDate Target date for the query (YYYY-MM-DD format)
 * @param viewType Type of view to use ('weekly' or 'monthly')
 * @returns Promise<MaterializedViewData[]> Array of materialized view data
 */
export async function getLeaderboardDataForDay(
  targetDate: string,
  viewType: MaterializedViewType = 'weekly'
): Promise<MaterializedViewData[]> {
  try {
    const data = await getMaterializedViewData(viewType, targetDate, targetDate);
    return data;
  } catch (error) {
    console.error('Failed to get leaderboard data for day:', error);
    throw error;
  }
}

/**
 * Get leaderboard data for a date range using materialized views
 * @param startDate Start date for the query (YYYY-MM-DD format)
 * @param endDate End date for the query (YYYY-MM-DD format)
 * @param viewType Type of view to use ('weekly' or 'monthly')
 * @returns Promise<MaterializedViewData[]> Array of materialized view data
 */
export async function getLeaderboardDataForDateRange(
  startDate: string,
  endDate: string,
  viewType: MaterializedViewType = 'weekly'
): Promise<MaterializedViewData[]> {
  try {
    const data = await getMaterializedViewData(viewType, startDate, endDate);
    return data;
  } catch (error) {
    console.error('Failed to get leaderboard data for date range:', error);
    throw error;
  }
}
