import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, getSecondsUntilCacheReset, formatStarCount } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', null, 'class2')).toBe('class1 class2');
      expect(cn('class1', false, 'class2')).toBe('class1 class2');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });
  });

  describe('getSecondsUntilCacheReset', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate seconds until target time today', () => {
      const mockDate = new Date('2023-07-15T04:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getSecondsUntilCacheReset(6, 0);
      expect(result).toBe(7200);
    });

    it('should calculate seconds until target time tomorrow if already passed', () => {
      const mockDate = new Date('2023-07-15T08:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getSecondsUntilCacheReset(6, 0);
      expect(result).toBe(79200);
    });

    it('should use default values when no parameters provided', () => {
      const mockDate = new Date('2023-07-15T04:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getSecondsUntilCacheReset();
      expect(result).toBe(7200);
    });

    it('should handle custom target hour and minute', () => {
      const mockDate = new Date('2023-07-15T10:30:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getSecondsUntilCacheReset(12, 15);
      expect(result).toBe(6300);
    });

    it('should handle edge case at exact target time', () => {
      const mockDate = new Date('2023-07-15T06:00:00.000Z');
      vi.setSystemTime(mockDate);

      const result = getSecondsUntilCacheReset(6, 0);
      expect(result).toBe(86400);
    });
  });

  describe('formatStarCount', () => {
    it('should format numbers under 1000 as strings', () => {
      expect(formatStarCount(0)).toBe('0');
      expect(formatStarCount(1)).toBe('1');
      expect(formatStarCount(999)).toBe('999');
    });

    it('should format numbers 1k-9.9k with decimal', () => {
      expect(formatStarCount(1000)).toBe('1k');
      expect(formatStarCount(1200)).toBe('1.2k');
      expect(formatStarCount(1500)).toBe('1.5k');
      expect(formatStarCount(9900)).toBe('9.9k');
      expect(formatStarCount(9999)).toBe('9.9k');
    });

    it('should format numbers 10k-999k without decimal', () => {
      expect(formatStarCount(10000)).toBe('10k');
      expect(formatStarCount(50000)).toBe('50k');
      expect(formatStarCount(999000)).toBe('999k');
      expect(formatStarCount(999999)).toBe('999k');
    });

    it('should format numbers 1M+ with M suffix', () => {
      expect(formatStarCount(1000000)).toBe('1M');
      expect(formatStarCount(1500000)).toBe('1.5M');
      expect(formatStarCount(2500000)).toBe('2.5M');
      expect(formatStarCount(10000000)).toBe('10M');
    });

    it('should handle edge cases', () => {
      expect(formatStarCount(1001)).toBe('1k');
      expect(formatStarCount(9999)).toBe('9.9k');
      expect(formatStarCount(10001)).toBe('10k');
      expect(formatStarCount(999999)).toBe('999k');
      expect(formatStarCount(1000001)).toBe('1M');
    });
  });
});
