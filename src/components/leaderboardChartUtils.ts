import { DevTool } from '@/types/api';
import { format } from 'date-fns';

export function getToolDisplayName(toolId: number, devtools: DevTool[]): string {
  const devtool = devtools.find((dt) => dt.id === toolId);
  return devtool ? devtool.name : `Tool ${toolId}`;
}

export function getToolColor(toolId: number, devtools: DevTool[], theme?: string): string {
  const devtool = devtools.find((dt) => dt.id === toolId);
  if (!devtool) return '#8884d8';
  if (theme === 'dark' && devtool.brand_color_dark) {
    return devtool.brand_color_dark;
  }
  return devtool.brand_color;
}

export function getToolWebsiteUrl(toolId: number, devtools: DevTool[]): string | undefined {
  const devtool = devtools.find((dt) => dt.id === toolId);
  return devtool?.website_url;
}

export function getXAxisTicks(chartData: { timestamp: number; date: string }[]): string[] {
  if (chartData.length === 0) return [];
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const firstDate = new Date(first.timestamp * 1000);
  const lastDate = new Date(last.timestamp * 1000);
  const months =
    (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
    (lastDate.getMonth() - firstDate.getMonth());
  if (months > 24) {
    return chartData
      .filter((d) => {
        const dt = new Date(d.timestamp * 1000);
        return dt.getMonth() === 0 && dt.getDate() === 1;
      })
      .map((d) => d.date);
  } else if (months > 6) {
    return chartData
      .filter((d) => {
        const dt = new Date(d.timestamp * 1000);
        return dt.getDate() === 1;
      })
      .map((d) => d.date);
  } else {
    const step = Math.ceil(chartData.length / 8);
    return chartData.filter((_, i) => i % step === 0).map((d) => d.date);
  }
}

export function xAxisTickFormatter(dateStr: string): string {
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  if (dt.getDate() === 1 && dt.getMonth() === 0) {
    return format(dt, 'yyyy');
  } else if (dt.getDate() === 1) {
    return format(dt, 'MMM yyyy');
  } else {
    return format(dt, 'MMM d');
  }
} 