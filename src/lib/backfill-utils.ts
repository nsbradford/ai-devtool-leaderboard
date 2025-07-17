import { getBotReviewsForDay } from './bigquery';
import {
  getReposNeedingStarCounts,
  upsertBotReviewsForDate,
  upsertRepoStarCountErrors,
  upsertRepoStarCounts,
} from './database';
import { GitHubApi } from './github-api';

/**
 * Process bot reviews for a single date (updated for schema v3)
 * @param targetDate Date in YYYY-MM-DD format
 * @param botIds Optional array of bot IDs to filter by
 * @returns Promise<void>
 */
export async function processBotReviewsForDate(
  targetDate: string,
  botIds?: number[]
): Promise<void> {
  const botFilter = botIds ? ` (filtering for ${botIds.length} bots)` : '';
  console.log(`Processing bot reviews for date: ${targetDate}${botFilter}`);

  try {
    const botReviews = await getBotReviewsForDay(targetDate, botIds);
    await upsertBotReviewsForDate(botReviews);
    console.log(
      `Successfully processed ${botReviews.length} bot reviews for ${targetDate}${botFilter}`
    );
  } catch (error) {
    console.error(`Error processing bot reviews for ${targetDate}:`, error);
    throw error;
  }
}

/**
 * Get the date string for yesterday in YYYY-MM-DD format
 * @returns string
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Process star count updates for repositories
 * Combines getting repos from database, fetching star counts from GitHub API, and upserting them
 * @param daysBack Number of days to look back for repos (default: 30)
 * @param maxAgeDays Maximum age of existing star count entries in days (default: 7)
 * @param limit Maximum number of repos to process (default: 1000)
 * @returns Promise<void>
 */
export async function processStarCountUpdates(
  daysBack: number = 30,
  maxAgeDays: number = 7,
  limit: number = 1000
): Promise<void> {
  console.log(
    `Processing star count updates for repos from last ${daysBack} days, max age ${maxAgeDays} days, limit ${limit}`
  );

  try {
    // Get repos that need star count updates
    const repos = await getReposNeedingStarCounts(daysBack, maxAgeDays, limit);

    if (repos.length === 0) {
      console.log('No repos found needing star count updates');
      return;
    }

    console.log(`Found ${repos.length} repos needing star count updates`);

    // Initialize GitHub API client
    const githubApi = new GitHubApi();

    // Fetch star counts from GitHub API
    console.log('Fetching star counts from GitHub API...');
    const { starCounts, errorRepos } = await githubApi.fetchStarCounts(
      repos as `${string}/${string}`[]
    );

    console.log(
      `Successfully fetched star counts for ${Object.keys(starCounts).length} repos`
    );
    if (errorRepos.length > 0) {
      console.log(`Failed to fetch star counts for ${errorRepos.length} repos`);
    }

    // Upsert successful star counts to database
    if (Object.keys(starCounts).length > 0) {
      await upsertRepoStarCounts(starCounts);
      console.log(
        `Successfully upserted star counts for ${Object.keys(starCounts).length} repos`
      );
    }

    // Upsert error repos to database
    if (errorRepos.length > 0) {
      await upsertRepoStarCountErrors(errorRepos);
      console.log(
        `Successfully marked ${errorRepos.length} repos as having errors`
      );
    }
  } catch (error) {
    console.error('Error processing star count updates:', error);
    throw error;
  }
}
