import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  DEPRECATED_getTopStarredReposByDevtool,
  upsertGithubRepoGraphQLData,
  upsertRepoStarCountErrors,
} from '../../src/lib/postgres/github_repositories_by_name';
import { GitHubApi } from '../../src/lib/github-api';
import type { GithubRepoGraphQLData } from '../../src/types/api';

async function backfillTopReposToNewTable(limit: number, daysBack: number) {
  console.log(
    `Fetching top ${limit} repos per devtool from last ${daysBack} days...`
  );
  const topReposByDevtool = await DEPRECATED_getTopStarredReposByDevtool(
    limit,
    daysBack
  );

  // Flatten and deduplicate repo names
  const allRepoNames = Array.from(
    new Set(
      Object.values(topReposByDevtool)
        .flat()
        .map((repo) => repo.repo_name)
    )
  );
  console.log(`Found ${allRepoNames.length} unique repos to upsert.`);

  if (allRepoNames.length === 0) {
    console.log('No repos found. Exiting.');
    return;
  }

  const githubApi = new GitHubApi();

  // Fetch star counts and metadata
  console.log('Fetching star counts from GitHub API...');
  const { repoData, errorRepos } = await githubApi.getRepositoryGraphQLData(
    allRepoNames as `${string}/${string}`[]
  );

  // Upsert repo metadata
  const repoDataArr: GithubRepoGraphQLData[] = Object.values(repoData);
  if (repoDataArr.length > 0) {
    await upsertGithubRepoGraphQLData(repoDataArr);
    console.log(`Upserted metadata for ${repoDataArr.length} repos.`);
  }

  // Upsert errors
  if (errorRepos.length > 0) {
    await upsertRepoStarCountErrors(errorRepos);
    console.log(`Marked ${errorRepos.length} repos as error.`);
  }

  console.log('Backfill complete.');
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('limit', {
      alias: 'l',
      type: 'number',
      default: 5,
      description: 'Number of top repos per devtool (default: 5)',
    })
    .option('days-back', {
      alias: 'd',
      type: 'number',
      default: 30,
      description: 'Number of days to look back for activity (default: 30)',
    })
    .help()
    .alias('help', 'h').argv;

  const { limit, 'days-back': daysBack } = argv;

  if (limit <= 0) {
    console.error('Limit must be greater than 0');
    process.exit(1);
  }
  if (daysBack <= 0) {
    console.error('Days back must be greater than 0');
    process.exit(1);
  }

  try {
    await backfillTopReposToNewTable(limit, daysBack);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
