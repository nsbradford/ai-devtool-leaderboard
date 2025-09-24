import { describe, it, expect } from 'vitest'
import { DEFAULT_START_DATE, ACTIVE_REPOS_MONTHLY } from '@/lib/constants'

describe('constants', () => {
  describe('DEFAULT_START_DATE', () => {
    it('should have correct default start date', () => {
      expect(DEFAULT_START_DATE).toBe('2023-07-01')
    })

    it('should be a valid date format', () => {
      expect(DEFAULT_START_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(new Date(DEFAULT_START_DATE).toISOString().split('T')[0]).toBe(DEFAULT_START_DATE)
    })

    it('should be a date in 2023', () => {
      expect(DEFAULT_START_DATE.startsWith('2023')).toBe(true)
    })
  })

  describe('ACTIVE_REPOS_MONTHLY', () => {
    it('should have correct active repos monthly value', () => {
      expect(ACTIVE_REPOS_MONTHLY).toBe('~1M')
    })

    it('should be a string representing approximate count', () => {
      expect(typeof ACTIVE_REPOS_MONTHLY).toBe('string')
      expect(ACTIVE_REPOS_MONTHLY).toContain('M')
      expect(ACTIVE_REPOS_MONTHLY).toContain('~')
    })
  })
})
