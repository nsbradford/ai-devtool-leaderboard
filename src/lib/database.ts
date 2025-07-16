import { neon } from '@neondatabase/serverless';
import {
  BotReviewInRepoDate,
  MaterializedViewData,
  MaterializedViewType,
} from '@/types/api';

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

/**
 * Upsert active repos count for a specific date
 * @param targetDate Date in YYYY-MM-DD format
 * @param activeRepoCount Number of active repositories
 * @returns Promise<void>
 */
export async function upsertActiveReposForDate(
  targetDate: string,
  activeRepoCount: number
): Promise<void> {
  const sql = getSql();

  try {
    // First, ensure the active_repos_daily table exists
    await sql(`
      CREATE TABLE IF NOT EXISTS active_repos_daily (
        event_date DATE PRIMARY KEY,
        active_repos_count INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Upsert the active repos count
    const query = `
      INSERT INTO active_repos_daily (event_date, active_repos_count)
      VALUES ($1, $2)
      ON CONFLICT (event_date) 
      DO UPDATE SET 
        active_repos_count = EXCLUDED.active_repos_count,
        updated_at = NOW();
    `;

    await sql(query, [targetDate, activeRepoCount]);

    console.log(
      `Upserted active repos data for ${targetDate}: ${activeRepoCount} repos`
    );
  } catch (error) {
    console.error(`Failed to upsert active repos for ${targetDate}:`, error);
    throw error;
  }
}

/**
 * Upsert bot review data for a specific date in batches
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
    // Process in batches
    for (let i = 0; i < botReviews.length; i += batchSize) {
      const batch = botReviews.slice(i, i + batchSize);

      // Build batch upsert query
      const values = batch
        .map(
          (review) =>
            `('${review.event_date}', ${review.bot_id}, ${review.repo_id}, ${review.bot_review_count})`
        )
        .join(', ');

      const query = `
        INSERT INTO bot_reviews_daily_by_repo (event_date, bot_id, repo_id, bot_review_count)
        VALUES ${values}
        ON CONFLICT (event_date, bot_id, repo_id) 
        DO UPDATE SET bot_review_count = EXCLUDED.bot_review_count;
      `;

      await sql(query);

      // console.log(`Upserted batch: ${batch.length}/${totalRecords} records for ${botReviews[0].event_date}`);
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
 * Bulk upsert GitHub repository data in batches
 * @param repoData Array of GitHub repository data objects
 * @param batchSize Size of each batch (default: 1000)
 * @returns Promise<void>
 */
export async function upsertGitHubRepositories(
  repoData: Array<{ id: number; full_name: string; star_count: number }>,
  batchSize: number = 1000
): Promise<void> {
  if (repoData.length === 0) {
    console.log('No GitHub repository data to upsert');
    return;
  }

  const sql = getSql();
  const totalRecords = repoData.length;

  try {
    // Process in batches
    for (let i = 0; i < repoData.length; i += batchSize) {
      const batch = repoData.slice(i, i + batchSize);

      // Build batch upsert query
      const values = batch
        .map(
          (repo) =>
            `(${repo.id}, '${repo.full_name.replace(/'/g, "''")}', ${repo.star_count})`
        )
        .join(', ');

      const query = `
        INSERT INTO github_repositories (id, full_name, star_count)
        VALUES ${values}
        ON CONFLICT (id) 
        DO UPDATE SET 
          full_name = EXCLUDED.full_name,
          star_count = EXCLUDED.star_count,
          updated_at = NOW();
      `;

      await sql(query);

      console.log(
        `Upserted batch: ${batch.length}/${totalRecords} GitHub repository records`
      );
    }

    console.log(
      `Completed upsert of ${totalRecords} GitHub repository records`
    );
  } catch (error) {
    console.error('Failed to upsert GitHub repositories:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility - upserts to old repo_star_counts table
 * @deprecated Use upsertGitHubRepositories instead
 */
export async function upsertRepoStarCounts(
  repoStarCounts: Record<string, number>,
  batchSize: number = 1000
): Promise<void> {
  if (Object.keys(repoStarCounts).length === 0) {
    console.log('No repo star counts to upsert');
    return;
  }

  const sql = getSql();
  const totalRecords = Object.keys(repoStarCounts).length;

  try {
    // Convert map to array of entries for easier batching
    const entries = Object.entries(repoStarCounts);

    // Process in batches
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);

      // Build batch upsert query
      const values = batch
        .map(
          ([fullName, starCount]) =>
            `('${fullName.replace(/'/g, "''")}', ${starCount})`
        )
        .join(', ');

      const query = `
        INSERT INTO repo_star_counts (full_name, star_count)
        VALUES ${values}
        ON CONFLICT (full_name) 
        DO UPDATE SET 
          star_count = EXCLUDED.star_count,
          updated_at = NOW();
      `;

      await sql(query);

      console.log(
        `Upserted batch: ${batch.length}/${totalRecords} repo star count records`
      );
    }

    console.log(`Completed upsert of ${totalRecords} repo star count records`);
  } catch (error) {
    console.error('Failed to upsert repo star counts:', error);
    throw error;
  }
}

/**
 * Upsert error status for repositories that failed to fetch data
 * @param errorRepos Array of repository full names that had errors
 * @param batchSize Size of each batch (default: 1000)
 * @returns Promise<void>
 */
export async function upsertGitHubRepositoryErrors(
  errorRepos: string[],
  batchSize: number = 1000
): Promise<void> {
  if (errorRepos.length === 0) {
    console.log('No error repos to upsert');
    return;
  }

  const sql = getSql();
  const totalRecords = errorRepos.length;

  try {
    // Process in batches
    for (let i = 0; i < errorRepos.length; i += batchSize) {
      const batch = errorRepos.slice(i, i + batchSize);

      // Build batch upsert query for error repos
      const values = batch
        .map((fullName) => `(0, '${fullName.replace(/'/g, "''")}', 0, true)`)
        .join(', ');

      const query = `
        INSERT INTO github_repositories (id, full_name, star_count, is_error)
        VALUES ${values}
        ON CONFLICT (id) 
        DO UPDATE SET 
          is_error = true,
          updated_at = NOW();
      `;

      await sql(query);

      console.log(
        `Upserted error batch: ${batch.length}/${totalRecords} GitHub repository error records`
      );
    }

    console.log(
      `Completed upsert of ${totalRecords} GitHub repository error records`
    );
  } catch (error) {
    console.error('Failed to upsert GitHub repository errors:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use upsertGitHubRepositoryErrors instead
 */
export async function upsertRepoStarCountErrors(
  errorRepos: string[],
  batchSize: number = 1000
): Promise<void> {
  if (errorRepos.length === 0) {
    console.log('No error repos to upsert');
    return;
  }

  const sql = getSql();
  const totalRecords = errorRepos.length;

  try {
    // Process in batches
    for (let i = 0; i < errorRepos.length; i += batchSize) {
      const batch = errorRepos.slice(i, i + batchSize);

      // Build batch upsert query for error repos
      const values = batch
        .map((fullName) => `('${fullName.replace(/'/g, "''")}', 0, true)`)
        .join(', ');

      const query = `
        INSERT INTO repo_star_counts (full_name, star_count, is_error)
        VALUES ${values}
        ON CONFLICT (full_name) 
        DO UPDATE SET 
          is_error = true,
          updated_at = NOW();
      `;

      await sql(query);

      console.log(
        `Upserted error batch: ${batch.length}/${totalRecords} repo error records`
      );
    }

    console.log(`Completed upsert of ${totalRecords} repo error records`);
  } catch (error) {
    console.error('Failed to upsert repo star count errors:', error);
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

/**
 * Get repositories that need data updates from the database
 * @param daysBack Number of days to look back for repos (default: 30)
 * @param maxAgeDays Maximum age of existing repo entries in days (default: 7)
 * @param limit Maximum number of repos to return (default: 1000)
 * @returns Promise<string[]> Array of repo full names
 */
export async function getReposNeedingUpdates(
  daysBack: number = 30,
  maxAgeDays: number = 7,
  limit: number = 1000
): Promise<string[]> {
  const sql = getSql();

  const query = `
    WITH recent_repo_ids AS (
      SELECT DISTINCT br.repo_id
      FROM bot_reviews_daily_by_repo br
      WHERE br.event_date >= CURRENT_DATE - INTERVAL '${daysBack} days'
    )
    SELECT DISTINCT 
      CASE 
        WHEN gr.full_name IS NOT NULL THEN gr.full_name
        ELSE CONCAT('unknown/', rri.repo_id)
      END as repo_name
    FROM recent_repo_ids rri
    LEFT JOIN github_repositories gr ON rri.repo_id = gr.id
    WHERE (
      -- Repo doesn't exist in github_repositories table
      gr.id IS NULL
      OR
      -- Repo exists but data is older than maxAgeDays
      gr.updated_at < CURRENT_DATE - INTERVAL '${maxAgeDays} days'
    )
    ORDER BY repo_name
    LIMIT ${limit};
  `;

  try {
    const results = await sql(query);
    return results.map((row: Record<string, unknown>) => String(row.repo_name));
  } catch (error) {
    console.error('Failed to get repos needing updates:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getReposNeedingUpdates instead
 */
export async function getReposNeedingStarCounts(
  daysBack: number = 30,
  maxAgeDays: number = 7,
  limit: number = 1000
): Promise<string[]> {
  return getReposNeedingUpdates(daysBack, maxAgeDays, limit);
}

/**
 * Get top N starred repositories for each devtool based on 30-day activity window
 * @param limit Number of top repos to return per devtool (default: 5)
 * @param daysBack Number of days to look back for activity (default: 30)
 * @returns Promise<Record<string, Array<{repo_name: string, star_count: number}>>>
 */
export async function getTopStarredReposByDevtool(
  limit: number = 5,
  daysBack: number = 30
): Promise<Record<string, Array<{ repo_name: string; star_count: number }>>> {
  const sql = getSql();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const query = `
      WITH recent_bot_activity AS (
        SELECT DISTINCT 
          br.bot_id,
          br.repo_id
        FROM bot_reviews_daily_by_repo br
        WHERE br.event_date >= $1
      ),
      ranked_repos AS (
        SELECT 
          rba.bot_id,
          gr.full_name as repo_name,
          gr.star_count,
          ROW_NUMBER() OVER (
            PARTITION BY rba.bot_id 
            ORDER BY gr.star_count DESC NULLS LAST
          ) as rank
        FROM recent_bot_activity rba
        JOIN github_repositories gr ON rba.repo_id = gr.id
        WHERE gr.star_count IS NOT NULL 
          AND gr.is_error = false
      )
      SELECT 
        bot_id,
        repo_name,
        star_count
      FROM ranked_repos
      WHERE rank <= $2
      ORDER BY bot_id, rank;
    `;

    const results = await sql(query, [cutoffDateStr, limit]);

    const groupedResults: Record<
      string,
      Array<{ repo_name: string; star_count: number }>
    > = {};

    results.forEach((row: Record<string, unknown>) => {
      const botId = String(row.bot_id);
      const repoName = String(row.repo_name);
      const starCount = Number(row.star_count);

      if (!groupedResults[botId]) {
        groupedResults[botId] = [];
      }

      groupedResults[botId].push({
        repo_name: repoName,
        star_count: starCount,
      });
    });

    return groupedResults;
  } catch (error) {
    console.error('Failed to get top starred repos by devtool:', error);
    throw error;
  }
}
