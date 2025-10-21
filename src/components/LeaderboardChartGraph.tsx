import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { DevTool } from '@/types/api';
import { CustomLegend } from '@/components/ui/CustomLegend';
import { formatStarCount } from '@/lib/utils';
import type { LeaderboardData } from '@/types/api';
import {
  getXAxisTicksUTC,
  xAxisTickFormatterUTC,
} from './leaderboardChartUtils';
import type { ChartDataPoint } from './interfaces';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Props for the LeaderboardChartGraph component.
 */
interface LeaderboardChartGraphProps {
  chartData: ChartDataPoint[];
  selectedTools: Set<number>;
  devtools: DevTool[];
  stats: LeaderboardData;
  scaleType: 'linear' | 'log';
  theme: string | undefined;
  getToolDisplayName: (toolId: number, devtools: DevTool[]) => string;
  getToolColor: (toolId: number, devtools: DevTool[], theme?: string) => string;
  resolvedTheme: string | undefined;
}

/**
 * Line chart graph component for displaying leaderboard data over time.
 * 
 * Features:
 * - Responsive chart with configurable linear/log scale
 * - Custom tooltips with formatted dates and values
 * - Custom legend with tool selection
 * - Theme-aware styling
 */
export function LeaderboardChartGraph({
  chartData,
  selectedTools,
  devtools,
  stats,
  scaleType,
  theme,
  getToolDisplayName,
  getToolColor,
  resolvedTheme,
}: LeaderboardChartGraphProps) {
  return (
    <div className="h-82 sm:h-128">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestampMs"
            type="number"
            scale="time"
            tick={{ fontSize: 11 }}
            domain={['dataMin', 'dataMax']}
            ticks={getXAxisTicksUTC(chartData)}
            tickFormatter={xAxisTickFormatterUTC}
            // ticks={getXAxisTicks(chartData)}
            // tickFormatter={xAxisTickFormatter}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            scale={scaleType}
            domain={
              scaleType === 'log' ? [0.5, 'dataMax'] : ['dataMin', 'dataMax']
            }
            tickFormatter={formatStarCount}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              scaleType === 'log' && value === 0.5
                ? '0'
                : value.toLocaleString(),
              name,
            ]}
            labelFormatter={(label: number) => {
              return `Date: ${formatInTimeZone(label, 'UTC', 'yyyy-MM-dd')}`;
            }}
            wrapperStyle={{ zIndex: 1000 }}
            contentStyle={{
              backgroundColor:
                resolvedTheme === 'dark' ? 'oklch(0.205 0 0)' : 'oklch(1 0 0)',
              color:
                resolvedTheme === 'dark'
                  ? 'oklch(0.985 0 0)'
                  : 'oklch(0.145 0 0)',
              border:
                resolvedTheme === 'dark'
                  ? '1px solid oklch(1 0 0 / 10%)'
                  : '1px solid oklch(0.922 0 0)',
              borderRadius: '0.625rem',
              boxShadow:
                resolvedTheme === 'dark'
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
            labelStyle={{
              color:
                resolvedTheme === 'dark'
                  ? 'oklch(0.985 0 0)'
                  : 'oklch(0.145 0 0)',
            }}
          />
          <Legend
            content={
              <CustomLegend
                selectedTools={selectedTools}
                setSelectedTools={() => {}}
                devtools={devtools}
              />
            }
          />
          {Object.keys(stats?.tools || {})
            .filter((toolIdStr) => {
              const toolId = Number(toolIdStr);
              return selectedTools.size === 0
                ? false
                : selectedTools.has(toolId);
            })
            .map((toolIdStr) => {
              const toolId = Number(toolIdStr);
              const displayName = getToolDisplayName(toolId, devtools);
              const color = getToolColor(toolId, devtools, theme);
              return (
                <Line
                  key={toolId}
                  type="monotone"
                  dataKey={displayName}
                  stroke={color}
                  strokeWidth={2}
                  name={displayName}
                  dot={false}
                  animationDuration={400}
                />
              );
            })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
