/**
 * GitHub API client
 * 
 * This module provides a client for interacting with the GitHub GraphQL API to fetch
 * repository metadata including star counts, database IDs, and node IDs. It handles
 * authentication, rate limiting, and error recovery for batch operations.
 */

import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';
import type { GithubRepoGraphQLData } from '@/types/api';

/** A repo string in the form "owner/name" */
export type RepoFullName = `${string}/${string}`;

interface GraphQLError extends Error {
  status?: number;
  code?: string;
  data?: Record<string, unknown>;
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
   * Fetch repository metadata (database_id and node_id) for multiple repositories.
   *
   * @param repos List of "owner/name" repositories to fetch metadata for.
   * @returns Object with successful metadata and array of repos that had errors
   */
  async fetchRepoMetadata(repos: RepoFullName[]): Promise<{
    repoMetadata: Record<
      RepoFullName,
      { database_id: number; node_id: string }
    >;
    errorRepos: RepoFullName[];
  }> {
    console.log(
      '[GitHubApi] Fetching repo metadata for',
      repos.length,
      'repos'
    );

    const CHUNK = 100;
    const repoMetadata: Record<
      RepoFullName,
      { database_id: number; node_id: string }
    > = {};
    const errorRepos: RepoFullName[] = [];

    for (let i = 0; i < repos.length; i += CHUNK) {
      const chunkIndex = Math.floor(i / CHUNK) + 1;
      const batch = repos.slice(i, i + CHUNK);

      const body = batch
        .map((full, j) => {
          const [owner, name] = full.split('/');
          return `r${j}: repository(owner:"${owner}", name:"${name}") { databaseId, id }`;
        })
        .join('\n');

      try {
        const data = await this.gql<{
          [k: string]: { databaseId: number; id: string } | null;
        }>(`query { ${body} }`);

        batch.forEach((full, j) => {
          const result = data[`r${j}`];
          if (
            result &&
            result.databaseId !== null &&
            result.databaseId !== undefined &&
            result.id !== null &&
            result.id !== undefined
          ) {
            repoMetadata[full] = {
              database_id: result.databaseId,
              node_id: result.id,
            };
          } else {
            errorRepos.push(full);
          }
        });
      } catch (error: unknown) {
        const graphqlError = error as GraphQLError;
        const errorMessage = graphqlError.message || 'Unknown error';
        const errorCode = graphqlError.status || graphqlError.code || 'No code';
        console.error(
          `[GitHubApi] GraphQL query failed for chunk ${chunkIndex} (${errorCode}): ${errorMessage}`
        );

        if (graphqlError.data) {
          console.log(
            `[GitHubApi] Attempting to extract partial results from error response`
          );
          batch.forEach((full, j) => {
            const result = graphqlError.data?.[`r${j}`] as {
              databaseId: number;
              id: string;
            } | null;
            if (
              result &&
              result.databaseId !== null &&
              result.databaseId !== undefined &&
              result.id !== null &&
              result.id !== undefined
            ) {
              repoMetadata[full] = {
                database_id: result.databaseId,
                node_id: result.id,
              };
            } else {
              errorRepos.push(full);
            }
          });
        } else {
          console.log(
            `[GitHubApi] No partial results available, marking all repos in chunk as errors`
          );
          errorRepos.push(...batch);
        }
      }
    }

    console.log(
      `[GitHubApi] fetchRepoMetadata completed: ${Object.keys(repoMetadata).length} successful, ${errorRepos.length} errors`
    );

    return { repoMetadata, errorRepos };
  }

  /**
   * Fetch stargazer counts and metadata for multiple repositories.
   *
   * @param repos List of "owner/name" repositories to fetch data for.
   * @returns Object with successful repo data and array of repos that had errors
   */
  async getRepositoryGraphQLData(repos: RepoFullName[]): Promise<{
    repoData: Record<RepoFullName, GithubRepoGraphQLData>;
    errorRepos: RepoFullName[];
  }> {
    console.log(
      '[GitHubApi] Fetching star counts and metadata for',
      repos.length,
      'repos'
    );

    // Split into ≤100-alias chunks (GraphQL limit).
    const CHUNK = 100;
    const repoData: Record<RepoFullName, GithubRepoGraphQLData> = {};
    const errorRepos: RepoFullName[] = [];

    for (let i = 0; i < repos.length; i += CHUNK) {
      const chunkIndex = Math.floor(i / CHUNK) + 1;
      const batch = repos.slice(i, i + CHUNK);

      // Build one big document: alias₀: repository(owner:"x",name:"y"){stargazerCount, id, databaseId}
      const body = batch
        .map((full, j) => {
          const [owner, name] = full.split('/');
          return `r${j}: repository(owner:"${owner}", name:"${name}") { stargazerCount id databaseId }`;
        })
        .join('\n');

      try {
        const data = await this.gql<{
          [k: string]: {
            stargazerCount: number;
            id: string;
            databaseId: number;
          } | null;
        }>(`query { ${body} }`);

        batch.forEach((full, j) => {
          const result = data[`r${j}`];
          if (
            result &&
            result.stargazerCount !== null &&
            result.stargazerCount !== undefined &&
            result.id &&
            result.databaseId !== null &&
            result.databaseId !== undefined
          ) {
            repoData[full] = {
              full_name: full,
              node_id: result.id,
              database_id: result.databaseId,
              star_count: result.stargazerCount,
              is_error: false,
              updated_at: new Date().toISOString(),
            };
          } else {
            errorRepos.push(full);
          }
        });
      } catch (error: unknown) {
        const graphqlError = error as GraphQLError;
        const errorMessage = graphqlError.message || 'Unknown error';
        const errorCode = graphqlError.status || graphqlError.code || 'No code';
        console.error(
          `[GitHubApi] GraphQL query failed for chunk ${chunkIndex} (${errorCode}): ${errorMessage}`
        );

        // Try to extract any successful results from the error response
        if (graphqlError.data) {
          console.log(
            `[GitHubApi] Attempting to extract partial results from error response`
          );
          batch.forEach((full, j) => {
            const result = graphqlError.data?.[`r${j}`] as {
              stargazerCount: number;
              id: string;
              databaseId: number;
            } | null;
            if (
              result &&
              result.stargazerCount !== null &&
              result.stargazerCount !== undefined &&
              result.id &&
              result.databaseId !== null &&
              result.databaseId !== undefined
            ) {
              repoData[full] = {
                full_name: full,
                node_id: result.id,
                database_id: result.databaseId,
                star_count: result.stargazerCount,
                is_error: false,
                updated_at: new Date().toISOString(),
              };
            } else {
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
      `[GitHubApi] fetchStarCounts completed: ${Object.keys(repoData).length} successful, ${errorRepos.length} errors`
    );

    return { repoData, errorRepos };
  }
}
