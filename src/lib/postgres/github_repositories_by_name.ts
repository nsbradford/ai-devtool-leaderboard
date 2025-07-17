import { getSql } from '@/lib/postgres/bot_reviews_daily_by_repo';

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
          br.repo_name
        FROM bot_reviews_daily br
        WHERE br.event_date >= $1
      ),
      ranked_repos AS (
        SELECT 
          rba.bot_id,
          rba.repo_name,
          rsc.star_count,
          ROW_NUMBER() OVER (
            PARTITION BY rba.bot_id 
            ORDER BY rsc.star_count DESC NULLS LAST
          ) as rank
        FROM recent_bot_activity rba
        LEFT JOIN repo_star_counts rsc ON rba.repo_name = rsc.full_name
        WHERE rsc.star_count IS NOT NULL 
          AND rsc.is_error = false
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
} /**
 * Get top N starred repositories for each devtool based on 30-day activity window
 * @param limit Number of top repos to return per devtool (default: 5)
 * @param daysBack Number of days to look back for activity (default: 30)
 * @returns Promise<Record<string, Array<{repo_name: string, star_count: number}>>>
 */

export async function getTopStarredReposByDevtool_NEW(
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
          br.repo_full_name
        FROM bot_reviews_daily_by_repo br
        WHERE br.event_date >= $1
      ),
      ranked_repos AS (
        SELECT 
          rba.bot_id,
          rba.repo_full_name,
          grbn.star_count,
          ROW_NUMBER() OVER (
            PARTITION BY rba.bot_id 
            ORDER BY grbn.star_count DESC NULLS LAST
          ) as rank
        FROM recent_bot_activity rba
        LEFT JOIN github_repositories_by_name grbn ON rba.repo_full_name = grbn.full_name
        WHERE grbn.star_count IS NOT NULL 
          AND grbn.is_error = false
      )
      SELECT 
        bot_id,
        repo_full_name,
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
      const repoName = String(row.repo_full_name);
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
/**
 * Get repositories that need star count updates from the database
 * @param daysBack Number of days to look back for repos (default: 30)
 * @param maxAgeDays Maximum age of existing star count entries in days (default: 7)
 * @param limit Maximum number of repos to return (default: 1000)
 * @returns Promise<string[]> Array of repo full names
 */

export async function getReposNeedingStarCounts(
  daysBack: number = 30,
  maxAgeDays: number = 7,
  limit: number = 1000
): Promise<string[]> {
  const sql = getSql();

  const query = `
    SELECT DISTINCT br.repo_full_name
    FROM bot_reviews_daily_by_repo br
    WHERE br.event_date >= CURRENT_DATE - INTERVAL '${daysBack} days'
      AND (
        -- Repo doesn't exist in github_repositories_by_name table
        NOT EXISTS (
          SELECT 1 FROM github_repositories_by_name grbn 
          WHERE grbn.full_name = br.repo_full_name
        )
        OR
        -- Repo exists but metadata is older than maxAgeDays
        EXISTS (
          SELECT 1 FROM github_repositories_by_name grbn 
          WHERE grbn.full_name = br.repo_full_name
            AND grbn.updated_at < CURRENT_DATE - INTERVAL '${maxAgeDays} days'
        )
      )
    ORDER BY br.repo_full_name
    LIMIT ${limit};
  `;

  try {
    const results = await sql(query);
    return results.map((row: Record<string, unknown>) =>
      String(row.repo_full_name)
    );
  } catch (error) {
    console.error('Failed to get repos needing star counts:', error);
    throw error;
  }
}
/**
 * Upsert error status for repositories that failed to fetch star counts
 * @param errorRepos Array of repository full names that had errors
 * @param batchSize Size of each batch (default: 1000)
 * @returns Promise<void>
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
        INSERT INTO github_repositories_by_name (full_name, star_count, is_error, node_id, database_id)
        VALUES ${values.replace(/\('([^']+)', 0, true\)/g, "('$1', 0, true, '', 0)")}
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
 * Bulk upsert repository star counts in batches (updated for schema v3)
 * @param repoStarCounts Map of repository full names to star counts
 * @param batchSize Size of each batch (default: 1000)
 * @returns Promise<void>
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
    const entries = Object.entries(repoStarCounts);

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);

      const values = batch
        .map(
          ([fullName, starCount]) =>
            `('${fullName.replace(/'/g, "''")}', ${starCount})`
        )
        .join(', ');

      const query = `
        INSERT INTO github_repositories_by_name (full_name, star_count, node_id, database_id)
        VALUES ${values.replace(/\('([^']+)', (\d+)\)/g, "('$1', $2, '', 0)")}
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
