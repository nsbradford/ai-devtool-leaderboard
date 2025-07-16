import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';

/** A repo string in the form "owner/name" */
export type RepoFullName = `${string}/${string}`;

export interface GitHubRepoData {
  id: number;
  full_name: string;
  star_count: number;
}

/**
 * GitHub API client that fetches stargazer counts using a personal access token.
 */
export class GitHubApi {
  private readonly octokit: Octokit;
  private readonly gql: typeof graphql;

  constructor() {
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      console.error('[GitHubApi] Missing GITHUB_TOKEN environment variable');
      throw new Error('Env var GITHUB_TOKEN is required');
    }

    // Initialize Octokit with personal access token
    this.octokit = new Octokit({
      auth: token,
    });

    // Initialize GraphQL client with the same token
    this.gql = graphql.defaults({
      headers: { authorization: `bearer ${token}` },
    });
  }

  /**
   * Fetch repository data (ID, name, star count) for multiple repositories.
   *
   * @param repos List of "owner/name" repositories to fetch data for.
   * @returns Object with successful repo data and array of repos that had errors
   */
  async fetchRepoData(repos: RepoFullName[]): Promise<{
    repoData: Record<RepoFullName, GitHubRepoData>;
    errorRepos: RepoFullName[];
  }> {
    console.log('[GitHubApi] Fetching repo data for', repos.length, 'repos');

    // Split into ≤100-alias chunks (GraphQL limit).
    const CHUNK = 100;
    const repoData: Record<RepoFullName, GitHubRepoData> = {};
    const errorRepos: RepoFullName[] = [];

    for (let i = 0; i < repos.length; i += CHUNK) {
      const chunkIndex = Math.floor(i / CHUNK) + 1;
      const batch = repos.slice(i, i + CHUNK);

      // Build one big document: alias₀: repository(owner:"x",name:"y"){id, stargazerCount}
      const body = batch
        .map((full, j) => {
          const [owner, name] = full.split('/');
          return `r${j}: repository(owner:"${owner}", name:"${name}") { id, stargazerCount }`;
        })
        .join('\n');

      try {
        const data = await this.gql<{
          [k: string]: { id: number; stargazerCount: number } | null;
        }>(`query { ${body} }`);

        batch.forEach((full, j) => {
          const result = data[`r${j}`];
          if (
            result &&
            result.id !== null &&
            result.id !== undefined &&
            result.stargazerCount !== null &&
            result.stargazerCount !== undefined
          ) {
            repoData[full] = {
              id: result.id,
              full_name: full,
              star_count: result.stargazerCount,
            };
          } else {
            // console.log(`[GitHubApi] Repo ${full} returned null/undefined result:`, result);
            errorRepos.push(full);
          }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown error';
        const errorCode = error.status || error.code || 'No code';
        console.error(
          `[GitHubApi] GraphQL query failed for chunk ${chunkIndex} (${errorCode}): ${errorMessage}`
        );

        // Try to extract any successful results from the error response
        if (error.data) {
          console.log(
            `[GitHubApi] Attempting to extract partial results from error response`
          );
          batch.forEach((full, j) => {
            const result = error.data[`r${j}`];
            if (
              result &&
              result.id !== null &&
              result.id !== undefined &&
              result.stargazerCount !== null &&
              result.stargazerCount !== undefined
            ) {
              repoData[full] = {
                id: result.id,
                full_name: full,
                star_count: result.stargazerCount,
              };
              // console.log(`[GitHubApi] Successfully extracted repo data for ${full}: ${result.stargazerCount}`);
            } else {
              // console.log(`[GitHubApi] Repo ${full} failed or returned null result:`, result);
              errorRepos.push(full);
            }
          });
        } else {
          // When the entire query fails and we can't extract partial results
          console.log(
            `[GitHubApi] No partial results available, marking all repos in chunk as errors`
          );
          errorRepos.push(...batch);
        }
      }
    }

    console.log(
      `[GitHubApi] fetchRepoData completed: ${Object.keys(repoData).length} successful, ${errorRepos.length} errors`
    );

    return { repoData, errorRepos };
  }

  /**
   * Legacy method for backward compatibility - fetches only star counts
   * @deprecated Use fetchRepoData instead
   */
  async fetchStarCounts(repos: RepoFullName[]): Promise<{
    starCounts: Record<RepoFullName, number>;
    errorRepos: RepoFullName[];
  }> {
    const { repoData, errorRepos } = await this.fetchRepoData(repos);
    const starCounts: Record<RepoFullName, number> = {};

    Object.entries(repoData).forEach(([fullName, data]) => {
      starCounts[fullName as RepoFullName] = data.star_count;
    });

    return { starCounts, errorRepos };
  }
}
