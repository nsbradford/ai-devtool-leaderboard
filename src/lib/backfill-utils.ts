import { getBotReviewsForDay } from './bigquery';
import {
  getReposNeedingUpdates,
  upsertBotReviewsForDate,
  upsertGitHubRepositories,
  upsertGitHubRepositoryErrors,
} from './database';
import { GitHubApi } from './github-api';

/**
 * Process bot reviews for a single date
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

    if (botReviews.length === 0) {
      console.log(`No bot reviews found for ${targetDate}${botFilter}`);
      return;
    }

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
 * Process repository data updates (ID, name, star count)
 * Combines getting repos from database, fetching data from GitHub API, and upserting them
 * @param daysBack Number of days to look back for repos (default: 30)
 * @param maxAgeDays Maximum age of existing repo entries in days (default: 7)
 * @param limit Maximum number of repos to process (default: 1000)
 * @returns Promise<void>
 */
export async function processRepoDataUpdates(
  daysBack: number = 30,
  maxAgeDays: number = 7,
  limit: number = 1000
): Promise<void> {
  console.log(
    `Processing repo data updates for repos from last ${daysBack} days, max age ${maxAgeDays} days, limit ${limit}`
  );

  try {
    // Get repos that need data updates
    const repos = await getReposNeedingUpdates(daysBack, maxAgeDays, limit);

    if (repos.length === 0) {
      console.log('No repos found needing data updates');
      return;
    }

    console.log(`Found ${repos.length} repos needing data updates`);

    // Initialize GitHub API client
    const githubApi = new GitHubApi();

    // Fetch repo data from GitHub API
    console.log('Fetching repo data from GitHub API...');
    const { repoData, errorRepos } = await githubApi.fetchRepoData(
      repos as `${string}/${string}`[]
    );

    console.log(
      `Successfully fetched repo data for ${Object.keys(repoData).length} repos`
    );
    if (errorRepos.length > 0) {
      console.log(`Failed to fetch repo data for ${errorRepos.length} repos`);
    }

    // Upsert successful repo data to database
    if (Object.keys(repoData).length > 0) {
      const repoDataArray = Object.values(repoData);
      await upsertGitHubRepositories(repoDataArray);
      console.log(
        `Successfully upserted repo data for ${repoDataArray.length} repos`
      );
    }

    // Upsert error repos to database
    if (errorRepos.length > 0) {
      await upsertGitHubRepositoryErrors(errorRepos);
      console.log(
        `Successfully marked ${errorRepos.length} repos as having errors`
      );
    }
  } catch (error) {
    console.error('Error processing repo data updates:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use processRepoDataUpdates instead
 */
export async function processStarCountUpdates(
  daysBack: number = 30,
  maxAgeDays: number = 7,
  limit: number = 1000
): Promise<void> {
  return processRepoDataUpdates(daysBack, maxAgeDays, limit);
}
