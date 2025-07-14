import { graphql } from '@octokit/graphql';

/** A repo string in the form "owner/name" */
type RepoFullName = `${string}/${string}`;

/**
 * Fetch stargazer counts for many repos with one or more batched GraphQL calls.
 *
 * @param repos  List of "owner/name" repo identifiers.
 * @param token  A GitHub personal-access token (PAT) or installation access token.
 * @returns      `{ [repo]: number | null }`
 */
export async function fetchStarCounts(
  repos: RepoFullName[],
  token: string
): Promise<Record<RepoFullName, number | null>> {
  const CHUNK_SIZE = 100; // GraphQL limit for separate top-level aliases
  const chunks: RepoFullName[][] = [];
  for (let i = 0; i < repos.length; i += CHUNK_SIZE) {
    chunks.push(repos.slice(i, i + CHUNK_SIZE));
  }

  const client = graphql.defaults({
    headers: { authorization: `bearer ${token}` },
  });

  const results: Record<RepoFullName, number | null> = {};

  await Promise.all(
    chunks.map(async (chunk, batchIdx) => {
      // Build a single GraphQL document with one alias per repo
      const selections = chunk
        .map((full, i) => {
          const [owner, name] = full.split('/');
          const alias = `r${batchIdx}_${i}`; // must start with a letter
          return `
            ${alias}: repository(owner: "${owner}", name: "${name}") {
              stargazerCount
            }`;
        })
        .join('\n');

      const query = `query { ${selections} }`;

      const data = await client<{
        [alias: string]: { stargazerCount: number } | null;
      }>(query);

      chunk.forEach((full, i) => {
        const alias = `r${batchIdx}_${i}` as const;
        results[full] = data[alias]?.stargazerCount ?? null;
      });
    })
  );

  return results;
}
