import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getToolDisplayName,
  getToolColor,
  getToolWebsiteUrl,
  getXAxisTicksUTC,
  xAxisTickFormatterUTC,
  getChartTitleAndDescription,
} from '@/components/leaderboardChartUtils';
import type { DevTool } from '@/types/api';

const mockDevtools: DevTool[] = [
  {
    id: 1,
    account_login: 'test-bot',
    name: 'Test Tool',
    avatar_url: 'https://example.com/avatar.png',
    website_url: 'https://example.com',
    brand_color: '#ff0000',
    brand_color_dark: '#cc0000',
  },
  {
    id: 2,
    account_login: 'another-bot',
    name: 'Another Tool',
    avatar_url: 'https://example.com/avatar2.png',
    website_url: 'https://another.com',
    brand_color: '#00ff00',
  },
];

describe('leaderboardChartUtils', () => {
  describe('getToolDisplayName', () => {
    it('should return tool name when found', () => {
      expect(getToolDisplayName(1, mockDevtools)).toBe('Test Tool');
      expect(getToolDisplayName(2, mockDevtools)).toBe('Another Tool');
    });

    it('should return fallback when tool not found', () => {
      expect(getToolDisplayName(999, mockDevtools)).toBe('Tool 999');
      expect(getToolDisplayName(0, mockDevtools)).toBe('Tool 0');
    });

    it('should handle empty devtools array', () => {
      expect(getToolDisplayName(1, [])).toBe('Tool 1');
    });
  });

  describe('getToolColor', () => {
    it('should return brand color for light theme', () => {
      expect(getToolColor(1, mockDevtools, 'light')).toBe('#ff0000');
      expect(getToolColor(2, mockDevtools, 'light')).toBe('#00ff00');
    });

    it('should return dark brand color for dark theme when available', () => {
      expect(getToolColor(1, mockDevtools, 'dark')).toBe('#cc0000');
    });

    it('should fallback to regular brand color when dark color not available', () => {
      expect(getToolColor(2, mockDevtools, 'dark')).toBe('#00ff00');
    });

    it('should return default color when tool not found', () => {
      expect(getToolColor(999, mockDevtools)).toBe('#8884d8');
      expect(getToolColor(999, mockDevtools, 'dark')).toBe('#8884d8');
    });

    it('should handle empty devtools array', () => {
      expect(getToolColor(1, [])).toBe('#8884d8');
    });

    it('should handle undefined theme', () => {
      expect(getToolColor(1, mockDevtools)).toBe('#ff0000');
    });
  });

  describe('getToolWebsiteUrl', () => {
    it('should return website URL when found', () => {
      expect(getToolWebsiteUrl(1, mockDevtools)).toBe('https://example.com');
      expect(getToolWebsiteUrl(2, mockDevtools)).toBe('https://another.com');
    });

    it('should return undefined when tool not found', () => {
      expect(getToolWebsiteUrl(999, mockDevtools)).toBeUndefined();
    });

    it('should handle empty devtools array', () => {
      expect(getToolWebsiteUrl(1, [])).toBeUndefined();
    });
  });

  describe('getXAxisTicksUTC', () => {
    const createChartData = (dates: string[]) =>
      dates.map((date) => ({ timestampMs: new Date(date).getTime() }));

    it('should return empty array for empty data', () => {
      expect(getXAxisTicksUTC([])).toEqual([]);
    });

    it('should return yearly ticks for data spanning more than 24 months', () => {
      const chartData = createChartData([
        '2021-01-01',
        '2022-01-01',
        '2023-01-01',
        '2024-01-01',
      ]);

      const result = getXAxisTicksUTC(chartData);
      expect(result).toHaveLength(4);
      expect(result).toEqual(chartData.map((d) => d.timestampMs));
    });

    it('should return monthly ticks for data spanning 6-24 months', () => {
      const chartData = createChartData([
        '2023-01-01',
        '2023-02-01',
        '2023-03-01',
        '2023-04-01',
        '2023-05-01',
        '2023-06-01',
        '2023-07-01',
        '2023-08-01',
      ]);

      const result = getXAxisTicksUTC(chartData);
      expect(result).toHaveLength(8);
      expect(result).toEqual(chartData.map((d) => d.timestampMs));
    });

    it('should return filtered ticks for shorter time periods', () => {
      const chartData = createChartData([
        '2023-07-01',
        '2023-07-02',
        '2023-07-03',
        '2023-07-04',
        '2023-07-05',
        '2023-07-06',
        '2023-07-07',
        '2023-07-08',
        '2023-07-09',
        '2023-07-10',
      ]);

      const result = getXAxisTicksUTC(chartData);
      expect(result.length).toBeLessThanOrEqual(8);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle single data point', () => {
      const chartData = createChartData(['2023-07-01']);
      const result = getXAxisTicksUTC(chartData);
      expect(result).toEqual([chartData[0].timestampMs]);
    });
  });

  describe('xAxisTickFormatterUTC', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format January 1st as year only', () => {
      const jan1 = new Date('2023-01-01T00:00:00.000Z').getTime();
      expect(xAxisTickFormatterUTC(jan1)).toBe('2023');
    });

    it('should format first of month as month and year', () => {
      const jul1 = new Date('2023-07-01T00:00:00.000Z').getTime();
      expect(xAxisTickFormatterUTC(jul1)).toBe('Jul 2023');
    });

    it('should format other dates as month and day', () => {
      const jul15 = new Date('2023-07-15T00:00:00.000Z').getTime();
      expect(xAxisTickFormatterUTC(jul15)).toBe('Jul 15');
    });

    it('should handle different months correctly', () => {
      const dec25 = new Date('2023-12-25T00:00:00.000Z').getTime();
      expect(xAxisTickFormatterUTC(dec25)).toBe('Dec 25');
    });
  });

  describe('getChartTitleAndDescription', () => {
    it('should return correct title and description for active_repos weekly', () => {
      const result = getChartTitleAndDescription('active_repos', 'weekly');
      expect(result.chartTitle).toBe('Active Repositories');
      expect(result.chartDescription).toBe(
        'Repos with an AI code review, 7-day rolling window.'
      );
    });

    it('should return correct title and description for active_repos monthly', () => {
      const result = getChartTitleAndDescription('active_repos', 'monthly');
      expect(result.chartTitle).toBe('Active Repositories');
      expect(result.chartDescription).toBe(
        'Repos with an AI code review, 30-day rolling window.'
      );
    });

    it('should return correct title and description for pr_reviews weekly', () => {
      const result = getChartTitleAndDescription('pr_reviews', 'weekly');
      expect(result.chartTitle).toBe('PR Reviews');
      expect(result.chartDescription).toBe(
        'Number of PR reviews by AI code review bots, 7-day rolling window.'
      );
    });

    it('should return correct title and description for pr_reviews monthly', () => {
      const result = getChartTitleAndDescription('pr_reviews', 'monthly');
      expect(result.chartTitle).toBe('PR Reviews');
      expect(result.chartDescription).toBe(
        'Number of PR reviews by AI code review bots, 30-day rolling window.'
      );
    });
  });
});
