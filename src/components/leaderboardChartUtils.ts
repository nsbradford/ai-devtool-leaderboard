// Copyright 2025 Anysphere Inc.

import { DevTool } from '@/types/api';
import { formatInTimeZone } from 'date-fns-tz';

export function getToolDisplayName(
  toolId: number,
  devtools: DevTool[]
): string {
  const devtool = devtools.find((dt) => dt.id === toolId);
  return devtool ? devtool.name : `Tool ${toolId}`;
}

export function getToolColor(
  toolId: number,
  devtools: DevTool[],
  theme?: string
): string {
  const devtool = devtools.find((dt) => dt.id === toolId);
  if (!devtool) return '#8884d8';
  if (theme === 'dark' && devtool.brand_color_dark) {
    return devtool.brand_color_dark;
  }
  return devtool.brand_color;
}

export function getToolWebsiteUrl(
  toolId: number,
  devtools: DevTool[]
): string | undefined {
  const devtool = devtools.find((dt) => dt.id === toolId);
  return devtool?.website_url;
}

export function getXAxisTicksUTC(
  chartData: { timestampMs: number }[]
): number[] {
  if (chartData.length === 0) return [];

  const first = new Date(chartData[0].timestampMs);
  const last = new Date(chartData[chartData.length - 1].timestampMs);

  const months =
    (last.getUTCFullYear() - first.getUTCFullYear()) * 12 +
    (last.getUTCMonth() - first.getUTCMonth());

  const isJan1 = (d: Date) => d.getUTCMonth() === 0 && d.getUTCDate() === 1;
  const isFirstOfMonth = (d: Date) => d.getUTCDate() === 1;

  if (months > 24) {
    return chartData
      .filter((p) => isJan1(new Date(p.timestampMs)))
      .map((p) => p.timestampMs);
  }

  if (months > 6) {
    return chartData
      .filter((p) => isFirstOfMonth(new Date(p.timestampMs)))
      .map((p) => p.timestampMs);
  }

  const step = Math.ceil(chartData.length / 8); // ~8 ticks max
  return chartData.filter((_, i) => i % step === 0).map((p) => p.timestampMs);
}

export const xAxisTickFormatterUTC = (tsMs: number): string => {
  const dt = new Date(tsMs);

  if (dt.getUTCDate() === 1 && dt.getUTCMonth() === 0) {
    return String(dt.getUTCFullYear());
  }

  if (dt.getUTCDate() === 1) {
    return formatInTimeZone(dt, 'UTC', 'MMM yyyy'); // “Jul 2025”
  }

  return formatInTimeZone(dt, 'UTC', 'MMM d'); // “Jul 18”
};
export function getChartTitleAndDescription(
  metric: 'active_repos' | 'pr_reviews',
  viewType: 'weekly' | 'monthly'
) {
  const chartTitle =
    metric === 'pr_reviews' ? 'PR Reviews' : 'Active Repositories';
  const chartDescription =
    metric === 'pr_reviews'
      ? `Number of PR reviews by AI code review bots, ${viewType === 'weekly' ? '7-day' : '30-day'} rolling window.`
      : `Repos with an AI code review, ${viewType === 'weekly' ? '7-day' : '30-day'} rolling window.`;
  return { chartTitle, chartDescription };
}
