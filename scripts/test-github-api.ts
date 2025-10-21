import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { GitHubApi } from '../src/lib/github-api';

/**
 * Test script for GitHub API functionality.
 * Fetches star counts for a sample of popular repositories to verify API integration.
 */
async function testGitHubApi() {
  try {
    const github = new GitHubApi();

    // Test with 5 popular repositories
    const testRepos = [
      'facebook/react',
      'microsoft/vscode',
      'vercel/next.js',
      'openai/openai-python',
      'microsoft/TypeScript',
    ] as const;

    console.log('Fetching star counts for:', testRepos);

    const starCounts = await github.getRepositoryGraphQLData([...testRepos]);

    console.log('\nResults:');
    console.log('========');
    for (const [repo, count] of Object.entries(starCounts)) {
      console.log(`${repo}: ${count?.toLocaleString() ?? 'null'} stars`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testGitHubApi();
