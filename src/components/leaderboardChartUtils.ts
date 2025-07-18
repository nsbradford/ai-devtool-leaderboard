import { DevTool } from '@/types/api';
import { format } from 'date-fns';

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

export function getXAxisTicks(
  chartData: { timestamp: number; date: string }[]
): string[] {
  if (chartData.length === 0) return [];
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const firstDate = new Date(first.timestamp * 1000);
  const lastDate = new Date(last.timestamp * 1000);
  const months =
    (lastDate.getUTCFullYear() - firstDate.getUTCFullYear()) * 12 +
    (lastDate.getUTCMonth() - firstDate.getUTCMonth());
  if (months > 24) {
    return chartData
      .filter((d) => {
        const dt = new Date(d.timestamp * 1000);
        return dt.getUTCMonth() === 0 && dt.getUTCDate() === 1;
      })
      .map((d) => d.date);
  } else if (months > 6) {
    return chartData
      .filter((d) => {
        const dt = new Date(d.timestamp * 1000);
        return dt.getUTCDate() === 1;
      })
      .map((d) => d.date);
  } else {
    const step = Math.ceil(chartData.length / 8);
    return chartData.filter((_, i) => i % step === 0).map((d) => d.date);
  }
}

export function xAxisTickFormatter(dateStr: string): string {
  const dt = new Date(dateStr); // Always UTC if ISO string
  if (isNaN(dt.getTime())) return dateStr;
  if (dt.getUTCDate() === 1 && dt.getUTCMonth() === 0) {
    // Jan 1: show year only
    return format(dt, 'yyyy');
  } else if (dt.getUTCDate() === 1) {
    // First of month: show 'Jul 2024'
    return format(dt, 'MMM yyyy');
  } else {
    // All other days: show 'Jul 2'
    return format(dt, 'MMM d');
  }
}

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
