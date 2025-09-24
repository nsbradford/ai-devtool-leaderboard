import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubApi } from '@/lib/github-api'
import type { RepoFullName } from '@/lib/github-api'

vi.mock('@octokit/core', () => ({
  Octokit: vi.fn()
}))

vi.mock('@octokit/graphql', () => ({
  graphql: {
    defaults: vi.fn()
  }
}))

const { Octokit } = await import('@octokit/core')
const { graphql } = await import('@octokit/graphql')

describe('github-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GITHUB_TOKEN = 'test-token'
  })

  describe('GitHubApi constructor', () => {
    it('should initialize with valid token', () => {
      const mockOctokit = {}
      const mockGql = vi.fn()
      
      vi.mocked(Octokit).mockReturnValue(mockOctokit as InstanceType<typeof Octokit>)
      vi.mocked(graphql.defaults).mockReturnValue(mockGql as typeof graphql)

      new GitHubApi()

      expect(Octokit).toHaveBeenCalledWith({
        auth: 'test-token'
      })
      expect(graphql.defaults).toHaveBeenCalledWith({
        headers: { authorization: 'bearer test-token' }
      })
    })

    it('should throw error when GITHUB_TOKEN is missing', () => {
      delete process.env.GITHUB_TOKEN
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => new GitHubApi()).toThrow('Env var GITHUB_TOKEN is required')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[GitHubApi] Missing GITHUB_TOKEN environment variable')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('fetchRepoMetadata', () => {
    let api: GitHubApi
    let mockGql: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockGql = vi.fn()
      vi.mocked(Octokit).mockReturnValue({} as InstanceType<typeof Octokit>)
      vi.mocked(graphql.defaults).mockReturnValue(mockGql as typeof graphql)
      api = new GitHubApi()
    })

    it('should fetch metadata for repositories successfully', async () => {
      const repos: RepoFullName[] = ['owner1/repo1', 'owner2/repo2']
      const mockResponse = {
        r0: { databaseId: 123, id: 'node_id_1' },
        r1: { databaseId: 456, id: 'node_id_2' }
      }

      mockGql.mockResolvedValue(mockResponse)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await api.fetchRepoMetadata(repos)

      expect(result.repoMetadata).toEqual({
        'owner1/repo1': { database_id: 123, node_id: 'node_id_1' },
        'owner2/repo2': { database_id: 456, node_id: 'node_id_2' }
      })
      expect(result.errorRepos).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('[GitHubApi] Fetching repo metadata for', 2, 'repos')

      consoleSpy.mockRestore()
    })

    it('should handle repositories with null/undefined data', async () => {
      const repos: RepoFullName[] = ['owner1/repo1', 'owner2/repo2']
      const mockResponse = {
        r0: { databaseId: 123, id: 'node_id_1' },
        r1: null
      }

      mockGql.mockResolvedValue(mockResponse)

      const result = await api.fetchRepoMetadata(repos)

      expect(result.repoMetadata).toEqual({
        'owner1/repo1': { database_id: 123, node_id: 'node_id_1' }
      })
      expect(result.errorRepos).toEqual(['owner2/repo2'])
    })

    it('should handle GraphQL errors with partial data', async () => {
      const repos: RepoFullName[] = ['owner1/repo1', 'owner2/repo2']
      const error = new Error('GraphQL error')
      ;(error as Error & { data?: Record<string, unknown> }).data = {
        r0: { databaseId: 123, id: 'node_id_1' },
        r1: null
      }

      mockGql.mockRejectedValue(error)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await api.fetchRepoMetadata(repos)

      expect(result.repoMetadata).toEqual({
        'owner1/repo1': { database_id: 123, node_id: 'node_id_1' }
      })
      expect(result.errorRepos).toEqual(['owner2/repo2'])
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      consoleSpy.mockRestore()
    })

    it('should handle complete GraphQL failures', async () => {
      const repos: RepoFullName[] = ['owner1/repo1', 'owner2/repo2']
      const error = new Error('Complete failure')

      mockGql.mockRejectedValue(error)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await api.fetchRepoMetadata(repos)

      expect(result.repoMetadata).toEqual({})
      expect(result.errorRepos).toEqual(['owner1/repo1', 'owner2/repo2'])

      consoleErrorSpy.mockRestore()
      consoleSpy.mockRestore()
    })

    it('should handle empty repository list', async () => {
      const result = await api.fetchRepoMetadata([])

      expect(result.repoMetadata).toEqual({})
      expect(result.errorRepos).toEqual([])
      expect(mockGql).not.toHaveBeenCalled()
    })

    it('should batch repositories correctly', async () => {
      const repos: RepoFullName[] = Array.from({ length: 150 }, (_, i) => `owner${i}/repo${i}` as RepoFullName)
      
      mockGql.mockResolvedValue({})

      await api.fetchRepoMetadata(repos)

      expect(mockGql).toHaveBeenCalledTimes(2)
    })
  })

  describe('getRepositoryGraphQLData', () => {
    let api: GitHubApi
    let mockGql: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockGql = vi.fn()
      vi.mocked(Octokit).mockReturnValue({} as InstanceType<typeof Octokit>)
      vi.mocked(graphql.defaults).mockReturnValue(mockGql as typeof graphql)
      api = new GitHubApi()
    })

    it('should fetch repository data successfully', async () => {
      const repos: RepoFullName[] = ['owner1/repo1']
      const mockResponse = {
        r0: { stargazerCount: 100, id: 'node_id_1', databaseId: 123 }
      }

      mockGql.mockResolvedValue(mockResponse)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await api.getRepositoryGraphQLData(repos)

      expect(result.repoData).toEqual({
        'owner1/repo1': {
          full_name: 'owner1/repo1',
          node_id: 'node_id_1',
          database_id: 123,
          star_count: 100,
          is_error: false,
          updated_at: expect.any(String)
        }
      })
      expect(result.errorRepos).toEqual([])

      consoleSpy.mockRestore()
    })

    it('should handle repositories with missing data', async () => {
      const repos: RepoFullName[] = ['owner1/repo1', 'owner2/repo2']
      const mockResponse = {
        r0: { stargazerCount: 100, id: 'node_id_1', databaseId: 123 },
        r1: null
      }

      mockGql.mockResolvedValue(mockResponse)

      const result = await api.getRepositoryGraphQLData(repos)

      expect(Object.keys(result.repoData)).toHaveLength(1)
      expect(result.errorRepos).toEqual(['owner2/repo2'])
    })

    it('should validate required fields', async () => {
      const repos: RepoFullName[] = ['owner1/repo1', 'owner2/repo2']
      const mockResponse = {
        r0: { stargazerCount: 100, id: 'node_id_1', databaseId: 123 },
        r1: { stargazerCount: null, id: 'node_id_2', databaseId: 456 }
      }

      mockGql.mockResolvedValue(mockResponse)

      const result = await api.getRepositoryGraphQLData(repos)

      expect(Object.keys(result.repoData)).toHaveLength(1)
      expect(result.errorRepos).toEqual(['owner2/repo2'])
    })

    it('should handle GraphQL errors with partial recovery', async () => {
      const repos: RepoFullName[] = ['owner1/repo1']
      const error = new Error('GraphQL error')
      ;(error as Error & { data?: Record<string, unknown> }).data = {
        r0: { stargazerCount: 100, id: 'node_id_1', databaseId: 123 }
      }

      mockGql.mockRejectedValue(error)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await api.getRepositoryGraphQLData(repos)

      expect(Object.keys(result.repoData)).toHaveLength(1)
      expect(result.errorRepos).toEqual([])

      consoleErrorSpy.mockRestore()
      consoleSpy.mockRestore()
    })

    it('should generate valid ISO timestamp', async () => {
      const repos: RepoFullName[] = ['owner1/repo1']
      const mockResponse = {
        r0: { stargazerCount: 100, id: 'node_id_1', databaseId: 123 }
      }

      mockGql.mockResolvedValue(mockResponse)

      const result = await api.getRepositoryGraphQLData(repos)

      const timestamp = result.repoData['owner1/repo1'].updated_at
      expect(() => new Date(timestamp)).not.toThrow()
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })
  })
})
