// Copyright 2025 Anysphere Inc.

import { getSql } from '@/lib/postgres/bot_reviews_daily_by_repo';
import type { TopReposByDevtool } from '@/types/api';
import type { GithubRepoGraphQLData } from '@/types/api';

/**
 * Get top N starred repositories for each devtool based on 30-day activity window
 * @param limit Number of top repos to return per devtool (default: 5)
 * @param daysBack Number of days to look back for activity (default: 30)
 * @returns Promise<Record<string, Array<{repo_name: string, star_count: number}>>>
 */

export async function DEPRECATED_getTopStarredReposByDevtool(
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
): Promise<TopReposByDevtool> {
  const sql = getSql();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const query = `
      WITH recent_bot_activity AS (
        SELECT DISTINCT 
          br.bot_id,
          br.repo_db_id
        FROM bot_reviews_daily_by_repo br
        WHERE br.event_date >= $1
      ),
      latest_repo_names AS (
        SELECT DISTINCT ON (database_id)
          database_id,
          full_name AS repo_name,
          updated_at
        FROM github_repositories_by_name
        WHERE is_error = false
        ORDER BY database_id, updated_at DESC
      ),
      ranked_repos AS (
        SELECT 
          rba.bot_id,
          grbn.database_id AS repo_db_id,
          lrn.repo_name,
          grbn.star_count,
          ROW_NUMBER() OVER (
            PARTITION BY rba.bot_id 
            ORDER BY grbn.star_count DESC NULLS LAST
          ) as rank
        FROM recent_bot_activity rba
        LEFT JOIN github_repositories_by_name grbn ON rba.repo_db_id = grbn.database_id
        LEFT JOIN latest_repo_names lrn ON grbn.database_id = lrn.database_id
        WHERE grbn.star_count IS NOT NULL 
          AND grbn.is_error = false
      )
      SELECT 
        bot_id,
        repo_db_id,
        repo_name,
        star_count
      FROM ranked_repos
      WHERE rank <= $2
      ORDER BY bot_id, rank;
    `;

    const results = await sql(query, [cutoffDateStr, limit]);

    const groupedResults: TopReposByDevtool = {};

    results.forEach((row: Record<string, unknown>) => {
      const botId = String(row.bot_id);
      const repoDbId = Number(row.repo_db_id);
      const repoName = String(row.repo_name);
      const starCount = Number(row.star_count);

      if (!groupedResults[botId]) {
        groupedResults[botId] = [];
      }

      groupedResults[botId].push({
        repo_db_id: repoDbId,
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
        .map(
          (fullName) =>
            `('${fullName.replace(/'/g, "''")}', NULL, NULL, NULL, true, NOW())`
        )
        .join(', ');

      const query = `
        INSERT INTO github_repositories_by_name (full_name, node_id, database_id, star_count, is_error, updated_at)
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
 * Bulk upsert repository star counts in batches (updated for schema v3)
 * @param repoStarCounts Map of repository full names to star counts
 * @param batchSize Size of each batch (default: 1000)
 * @returns Promise<void>
 */

export async function upsertGithubRepoGraphQLData(
  repoData: GithubRepoGraphQLData[],
  batchSize: number = 1000
): Promise<void> {
  if (repoData.length === 0) {
    console.log('No repo data to upsert');
    return;
  }

  const sql = getSql();
  const totalRecords = repoData.length;

  try {
    for (let i = 0; i < repoData.length; i += batchSize) {
      const batch = repoData.slice(i, i + batchSize);

      const values = batch
        .map(
          (repo) =>
            `('${repo.full_name.replace(/'/g, "''")}', '${repo.node_id}', ${repo.database_id}, ${repo.star_count}, ${repo.is_error}, '${repo.updated_at}')`
        )
        .join(', ');

      const query = `
        INSERT INTO github_repositories_by_name (full_name, node_id, database_id, star_count, is_error, updated_at)
        VALUES ${values}
        ON CONFLICT (full_name)
        DO UPDATE SET
          node_id = EXCLUDED.node_id,
          database_id = EXCLUDED.database_id,
          star_count = EXCLUDED.star_count,
          is_error = EXCLUDED.is_error,
          updated_at = EXCLUDED.updated_at;
      `;

      await sql(query);

      console.log(
        `Upserted batch: ${batch.length}/${totalRecords} repo metadata records`
      );
    }

    console.log(`Completed upsert of ${totalRecords} repo metadata records`);
  } catch (error) {
    console.error('Failed to upsert repo metadata:', error);
    throw error;
  }
}
