import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getYesterdayDateString, processBotReviewsForDate } from '@/lib/backfill/bot-reviews'
import type { BotReviewInRepoDate } from '@/types/api'

vi.mock('@/lib/bigquery', () => ({
  getBotReviewsForDay: vi.fn()
}))

vi.mock('@/lib/postgres/bot_reviews_daily_by_repo', () => ({
  upsertBotReviewsForDate: vi.fn()
}))

const { getBotReviewsForDay } = await import('@/lib/bigquery')
const { upsertBotReviewsForDate } = await import('@/lib/postgres/bot_reviews_daily_by_repo')

describe('bot-reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getYesterdayDateString', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return yesterday date in YYYY-MM-DD format', () => {
      const mockDate = new Date('2023-07-15T12:00:00.000Z')
      vi.setSystemTime(mockDate)
      
      expect(getYesterdayDateString()).toBe('2023-07-14')
    })

    it('should handle month boundary correctly', () => {
      const mockDate = new Date('2023-08-01T12:00:00.000Z')
      vi.setSystemTime(mockDate)
      
      expect(getYesterdayDateString()).toBe('2023-07-31')
    })

    it('should handle year boundary correctly', () => {
      const mockDate = new Date('2024-01-01T12:00:00.000Z')
      vi.setSystemTime(mockDate)
      
      expect(getYesterdayDateString()).toBe('2023-12-31')
    })

    it('should handle leap year correctly', () => {
      const mockDate = new Date('2024-03-01T12:00:00.000Z')
      vi.setSystemTime(mockDate)
      
      expect(getYesterdayDateString()).toBe('2024-02-29')
    })

    it('should handle different times of day consistently', () => {
      const mockDate1 = new Date('2023-07-15T00:00:00.000Z')
      vi.setSystemTime(mockDate1)
      const result1 = getYesterdayDateString()

      const mockDate2 = new Date('2023-07-15T23:59:59.999Z')
      vi.setSystemTime(mockDate2)
      const result2 = getYesterdayDateString()
      
      expect(result1).toBe('2023-07-14')
      expect(result2).toBe('2023-07-14')
      expect(result1).toBe(result2)
    })
  })

  describe('processBotReviewsForDate', () => {
    const mockBotReviews: BotReviewInRepoDate[] = [
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
    ]

    beforeEach(() => {
      vi.mocked(getBotReviewsForDay).mockResolvedValue(mockBotReviews)
      vi.mocked(upsertBotReviewsForDate).mockResolvedValue(undefined)
    })

    it('should process bot reviews successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await processBotReviewsForDate('2023-07-14')
      
      expect(getBotReviewsForDay).toHaveBeenCalledWith('2023-07-14', undefined)
      expect(upsertBotReviewsForDate).toHaveBeenCalledWith(mockBotReviews)
      expect(consoleSpy).toHaveBeenCalledWith('Processing bot reviews for date: 2023-07-14')
      expect(consoleSpy).toHaveBeenCalledWith('Successfully processed 2 bot reviews for 2023-07-14')
      
      consoleSpy.mockRestore()
    })

    it('should process bot reviews with specific bot IDs', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const botIds = [1, 2, 3]
      
      await processBotReviewsForDate('2023-07-14', botIds)
      
      expect(getBotReviewsForDay).toHaveBeenCalledWith('2023-07-14', botIds)
      expect(upsertBotReviewsForDate).toHaveBeenCalledWith(mockBotReviews)
      expect(consoleSpy).toHaveBeenCalledWith('Processing bot reviews for date: 2023-07-14 (filtering for 3 bots)')
      expect(consoleSpy).toHaveBeenCalledWith('Successfully processed 2 bot reviews for 2023-07-14 (filtering for 3 bots)')
      
      consoleSpy.mockRestore()
    })

    it('should handle empty bot reviews array', async () => {
      vi.mocked(getBotReviewsForDay).mockResolvedValue([])
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await processBotReviewsForDate('2023-07-14')
      
      expect(getBotReviewsForDay).toHaveBeenCalledWith('2023-07-14', undefined)
      expect(upsertBotReviewsForDate).toHaveBeenCalledWith([])
      expect(consoleSpy).toHaveBeenCalledWith('Successfully processed 0 bot reviews for 2023-07-14')
      
      consoleSpy.mockRestore()
    })

    it('should handle BigQuery errors', async () => {
      const error = new Error('BigQuery connection failed')
      vi.mocked(getBotReviewsForDay).mockRejectedValue(error)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await expect(processBotReviewsForDate('2023-07-14')).rejects.toThrow('BigQuery connection failed')
      
      expect(getBotReviewsForDay).toHaveBeenCalledWith('2023-07-14', undefined)
      expect(upsertBotReviewsForDate).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing bot reviews for 2023-07-14:', error)
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle database upsert errors', async () => {
      const error = new Error('Database connection failed')
      vi.mocked(upsertBotReviewsForDate).mockRejectedValue(error)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await expect(processBotReviewsForDate('2023-07-14')).rejects.toThrow('Database connection failed')
      
      expect(getBotReviewsForDay).toHaveBeenCalledWith('2023-07-14', undefined)
      expect(upsertBotReviewsForDate).toHaveBeenCalledWith(mockBotReviews)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing bot reviews for 2023-07-14:', error)
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle different date formats', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await processBotReviewsForDate('2023-12-31')
      
      expect(getBotReviewsForDay).toHaveBeenCalledWith('2023-12-31', undefined)
      expect(consoleSpy).toHaveBeenCalledWith('Processing bot reviews for date: 2023-12-31')
      
      consoleSpy.mockRestore()
    })
  })
})
