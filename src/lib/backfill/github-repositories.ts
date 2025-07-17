import {
  getReposNeedingStarCounts,
  upsertGithubRepoGraphQLData,
  upsertRepoStarCountErrors,
} from '@/lib/postgres/github_repositories_by_name';
import { GitHubApi } from '../github-api';

export async function backfillStarCounts(
  repos: number,
  daysBack: number = 30,
  maxAgeDays: number = 7
): Promise<void> {
  console.log(
    `Starting star counts backfill for ${repos} repos from last ${daysBack} days`
  );
  console.log(`Max age for existing star counts: ${maxAgeDays} days`);

  const startTime = Date.now();

  try {
    const allRepos: string[] = await getReposNeedingStarCounts(
      daysBack,
      maxAgeDays,
      repos
    );
    if (allRepos.length === 0) {
      console.log('No repos found needing star count updates');
      return;
    }
    console.log(`Found ${allRepos.length} repos needing star count updates`);

    // Process in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < allRepos.length; i += chunkSize) {
      const batch = allRepos.slice(i, i + chunkSize);
      console.log(
        `\nProcessing chunk ${Math.floor(i / chunkSize) + 1} (${batch.length} repos)...`
      );
      // Call processStarCountUpdates for this batch
      await processStarCountUpdates(daysBack, maxAgeDays, batch.length);
      // Wait 6 seconds between chunks, except after the last chunk
      if (i + chunkSize < allRepos.length) {
        console.log('Waiting 6 seconds before next chunk...');
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    }
  } catch (error) {
    console.error('Error during star counts backfill:', error);
    throw error;
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(
    `\nStar counts backfill completed in ${duration.toFixed(2)} seconds`
  );
} /**
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

    // Fetch star counts and metadata from GitHub API
    console.log('Fetching star counts and metadata from GitHub API...');
    const { repoData, errorRepos } = await githubApi.getRepositoryGraphQLData(
      repos as `${string}/${string}`[]
    );

    const repoDataArr = Object.values(repoData);
    console.log(
      `Successfully fetched metadata for ${repoDataArr.length} repos`
    );
    if (errorRepos.length > 0) {
      console.log(`Failed to fetch metadata for ${errorRepos.length} repos`);
    }

    // Upsert successful repo metadata to database
    if (repoDataArr.length > 0) {
      await upsertGithubRepoGraphQLData(repoDataArr);
      console.log(
        `Successfully upserted metadata for ${repoDataArr.length} repos`
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
