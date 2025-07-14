import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';

/** A repo string in the form "owner/name" */
export type RepoFullName = `${string}/${string}`;

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
   * Fetch stargazer counts for multiple repositories.
   *
   * @param repos List of "owner/name" repositories to fetch star counts for.
   */
  async fetchStarCounts(
    repos: RepoFullName[]
  ): Promise<Record<RepoFullName, number | null>> {
    console.log('[GitHubApi] Fetching star counts for', repos.length, 'repos');

    // Split into ≤100-alias chunks (GraphQL limit).
    const CHUNK = 100;
    const out: Record<RepoFullName, number | null> = {};

    for (let i = 0; i < repos.length; i += CHUNK) {
      const chunkIndex = Math.floor(i / CHUNK) + 1;
      const batch = repos.slice(i, i + CHUNK);

      // Build one big document: alias₀: repository(owner:"x",name:"y"){stargazerCount}
      const body = batch
        .map((full, j) => {
          const [owner, name] = full.split('/');
          return `r${j}: repository(owner:"${owner}", name:"${name}") { stargazerCount }`;
        })
        .join('\n');

      try {
        const data = await this.gql<{
          [k: string]: { stargazerCount: number } | null;
        }>(`query { ${body} }`);

        batch.forEach((full, j) => {
          const starCount = data[`r${j}`]?.stargazerCount ?? null;
          out[full] = starCount;
        });
      } catch (error) {
        console.error(
          `[GitHubApi] GraphQL query failed for chunk ${chunkIndex}:`,
          error
        );

        // Set all repos in this chunk to null on error
        batch.forEach((full) => {
          out[full] = null;
        });
      }
    }

    console.log(
      `[GitHubApi] fetchStarCounts completed successfully with ${Object.keys(out).length} star counts`
    );

    return out;
  }
}
