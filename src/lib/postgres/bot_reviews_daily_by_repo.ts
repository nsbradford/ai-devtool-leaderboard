import { neon } from '@neondatabase/serverless';
import {
  BotReviewInRepoDate,
  MaterializedViewData,
  MaterializedViewType,
} from '@/types/api';

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

/**
 * Upsert bot review data for a specific date in batches (new schema v3)
 * @param botReviews Array of bot review events to upsert
 * @param batchSize Size of each batch (default: 1000)
 * @returns Promise<void>
 */
export async function upsertBotReviewsForDate(
  botReviews: BotReviewInRepoDate[],
  batchSize: number = 1000
): Promise<void> {
  if (botReviews.length === 0) {
    console.log('No bot reviews to upsert');
    return;
  }

  const sql = getSql();
  const totalRecords = botReviews.length;

  try {
    for (let i = 0; i < botReviews.length; i += batchSize) {
      const batch = botReviews.slice(i, i + batchSize);

      const values = batch
        .map(
          (review) =>
            `('${review.event_date}', ${review.bot_id}, ${review.repo_db_id}, '${review.repo_full_name.replace(/'/g, "''")}', ${review.bot_review_count}, ${review.pr_count})`
        )
        .join(', ');

      const query = `
        INSERT INTO bot_reviews_daily_by_repo (event_date, bot_id, repo_db_id, repo_full_name, bot_review_count, pr_count)
        VALUES ${values}
        ON CONFLICT (event_date, bot_id, repo_db_id) 
        DO UPDATE SET 
          bot_review_count = EXCLUDED.bot_review_count,
          pr_count = EXCLUDED.pr_count,
          repo_full_name = EXCLUDED.repo_full_name;
      `;

      await sql(query);
    }

    console.log(
      `Completed upsert of ${totalRecords} bot review records for ${botReviews[0].event_date}`
    );
  } catch (error) {
    console.error(
      `Failed to upsert bot reviews for ${botReviews[0].event_date}:`,
      error
    );
    throw error;
  }
}

/**
 * Get data from materialized views (weekly or monthly)
 * @param viewType Type of view to query ('weekly' or 'monthly')
 * @param startDate Start date for the query (YYYY-MM-DD format)
 * @param endDate End date for the query (YYYY-MM-DD format)
 * @returns Promise<MaterializedViewData[]> Array of materialized view data
 */
export async function getMaterializedViewData(
  viewType: MaterializedViewType,
  startDate: string,
  endDate: string
): Promise<MaterializedViewData[]> {
  const sql = getSql();

  try {
    const viewName =
      viewType === 'weekly'
        ? 'mv_bot_reviews_repo_7d'
        : 'mv_bot_reviews_repo_30d';

    const query = `
      SELECT 
        event_date,
        bot_id,
        repo_count
      FROM ${viewName}
      WHERE event_date BETWEEN $1 AND $2
      ORDER BY event_date ASC;
    `;

    console.log(
      `Running query against ${viewName} for dates ${startDate} to ${endDate}`
    );
    const results = await sql(query, [startDate, endDate]);

    return results.map((row: Record<string, unknown>) => ({
      event_date: String(row.event_date),
      bot_id: Number(row.bot_id),
      repo_count: Number(row.repo_count),
    }));
  } catch (error) {
    console.error(`Failed to get ${viewType} materialized view data:`, error);
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

/**
 * Refresh both materialized views (7d and 30d) concurrently
 * @returns Promise<void>
 */
export async function refreshMaterializedViewsConcurrently(): Promise<void> {
  const sql = getSql();
  try {
    // Refresh 7d view
    console.log('Refreshing materialized view: mv_bot_reviews_repo_7d...');
    await sql('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bot_reviews_repo_7d;');
    console.log('Finished refreshing: mv_bot_reviews_repo_7d');

    // Refresh 30d view
    console.log('Refreshing materialized view: mv_bot_reviews_repo_30d...');
    await sql(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_bot_reviews_repo_30d;'
    );
    console.log('Finished refreshing: mv_bot_reviews_repo_30d');
  } catch (error) {
    console.error('Failed to refresh materialized views:', error);
    throw error;
  }
  console.log('Materialized views refreshed successfully');
}
