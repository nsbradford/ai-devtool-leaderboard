import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBotReviewsForDay } from '@/lib/bigquery'

vi.mock('@google-cloud/bigquery', () => {
  const mockQuery = vi.fn()
  const mockBigQuery = vi.fn(() => ({
    query: mockQuery
  }))
  return { BigQuery: mockBigQuery }
})

vi.mock('../devtools.json', () => ({
  default: [
    { id: 1, name: 'Tool 1' },
    { id: 2, name: 'Tool 2' }
  ]
}))

const { BigQuery } = await import('@google-cloud/bigquery')

describe('bigquery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project'
    process.env.GOOGLE_APPLICATION_CREDENTIALS = 'dGVzdC1jcmVkZW50aWFscw=='
  })

  describe('getBotReviewsForDay', () => {
    const mockBigQueryRows = [
      {
        event_date: { value: '2023-07-14' },
        repo_name: 'test/repo',
        repo_db_id: 123,
        bot_id: 1,
        bot_review_count: 5,
        pr_count: 3
      },
      {
        event_date: '2023-07-14',
        repo_name: 'another/repo',
        repo_db_id: 456,
        bot_id: 2,
        bot_review_count: 2,
        pr_count: 1
      }
    ]

    it('should fetch bot reviews for a specific date', async () => {
      const mockBigQueryInstance = {
        query: vi.fn().mockResolvedValue([mockBigQueryRows])
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)

      const result = await getBotReviewsForDay('2023-07-14')

      expect(result).toEqual([
        {
          event_date: '2023-07-14',
          repo_db_id: 123,
          repo_full_name: 'test/repo',
          bot_id: 1,
          bot_review_count: 5,
          pr_count: 3
        },
        {
          event_date: '2023-07-14',
          repo_db_id: 456,
          repo_full_name: 'another/repo',
          bot_id: 2,
          bot_review_count: 2,
          pr_count: 1
        }
      ])

      expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
        query: expect.stringContaining('target_date DATE DEFAULT DATE(\'2023-07-14\')'),
        useLegacySql: false
      })
    })

    it('should use specific bot IDs when provided', async () => {
      const mockBigQueryInstance = {
        query: vi.fn().mockResolvedValue([mockBigQueryRows])
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)

      await getBotReviewsForDay('2023-07-14', [1, 3, 5])

      expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
        query: expect.stringContaining('bot_id_list ARRAY<INT64> DEFAULT [1, 3, 5]'),
        useLegacySql: false
      })
    })

    it('should use all devtools when no bot IDs provided', async () => {
      const mockBigQueryInstance = {
        query: vi.fn().mockResolvedValue([mockBigQueryRows])
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)

      await getBotReviewsForDay('2023-07-14')

      expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
        query: expect.stringContaining('bot_id_list ARRAY<INT64> DEFAULT [1, 2]'),
        useLegacySql: false
      })
    })

    it('should handle empty results', async () => {
      const mockBigQueryInstance = {
        query: vi.fn().mockResolvedValue([[]])
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)

      const result = await getBotReviewsForDay('2023-07-14')

      expect(result).toEqual([])
    })

    it('should handle BigQuery errors', async () => {
      const mockBigQueryInstance = {
        query: vi.fn().mockRejectedValue(new Error('BigQuery error'))
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(getBotReviewsForDay('2023-07-14')).rejects.toThrow('BigQuery error')

      expect(consoleErrorSpy).toHaveBeenCalledWith('BigQuery bot reviews query failed:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })

    it('should handle different date formats correctly', async () => {
      const mockBigQueryInstance = {
        query: vi.fn().mockResolvedValue([mockBigQueryRows])
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)

      await getBotReviewsForDay('2023-12-31')

      expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
        query: expect.stringContaining('target_date DATE DEFAULT DATE(\'2023-12-31\')'),
        useLegacySql: false
      })
    })

    it('should convert BigQueryDate objects to strings', async () => {
      const mockRowsWithDateObject = [
        {
          event_date: { value: '2023-07-14' },
          repo_name: 'test/repo',
          repo_db_id: 123,
          bot_id: 1,
          bot_review_count: 5,
          pr_count: 3
        }
      ]

      const mockBigQueryInstance = {
        query: vi.fn().mockResolvedValue([mockRowsWithDateObject])
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)

      const result = await getBotReviewsForDay('2023-07-14')

      expect(result[0].event_date).toBe('2023-07-14')
      expect(typeof result[0].event_date).toBe('string')
    })

    it('should handle string date values', async () => {
      const mockRowsWithStringDate = [
        {
          event_date: '2023-07-14',
          repo_name: 'test/repo',
          repo_db_id: 123,
          bot_id: 1,
          bot_review_count: 5,
          pr_count: 3
        }
      ]

      const mockBigQueryInstance = {
        query: vi.fn().mockResolvedValue([mockRowsWithStringDate])
      }
      vi.mocked(BigQuery).mockReturnValue(mockBigQueryInstance as unknown as InstanceType<typeof BigQuery>)

      const result = await getBotReviewsForDay('2023-07-14')

      expect(result[0].event_date).toBe('2023-07-14')
      expect(typeof result[0].event_date).toBe('string')
    })
  })
})
