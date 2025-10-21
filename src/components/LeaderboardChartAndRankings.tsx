import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ACTIVE_REPOS_MONTHLY } from '@/lib/constants';
import type {
  DateRange,
  DevTool,
  LeaderboardData,
  MaterializedViewType,
  TopReposByDevtool,
} from '@/types/api';
import type { Dispatch, SetStateAction } from 'react';
import React from 'react';
import { LeaderboardChartControls } from './LeaderboardChartControls';
import { LeaderboardChartGraph } from './LeaderboardChartGraph';
import {
  getChartTitleAndDescription,
  getToolWebsiteUrl,
} from './leaderboardChartUtils';
import { LeaderboardRankings } from './LeaderboardRankings';
import type { ChartDataPoint } from './interfaces';

/**
 * Props for the LeaderboardChartAndRankings component.
 */
interface LeaderboardChartAndRankingsProps {
  filteredStats: {
    timestamps: number[];
    tools: Record<string, number[]>;
  } | null;
  devtools: DevTool[];
  stats: LeaderboardData;
  selectedTools: Set<number>;
  scaleType: 'linear' | 'log';
  getToolDisplayName: (toolId: number, devtools: DevTool[]) => string;
  getToolColor: (toolId: number, devtools: DevTool[]) => string;
  resolvedTheme: string | undefined;
  displayDateRange: DateRange;
  setDisplayDateRange: Dispatch<SetStateAction<DateRange>>;
  datePickerOpen: boolean;
  setDatePickerOpen: Dispatch<SetStateAction<boolean>>;
  presets: Array<{ label: string; getRange: () => DateRange }>;
  viewType: MaterializedViewType;
  setViewType: Dispatch<SetStateAction<MaterializedViewType>>;
  setScaleType: Dispatch<SetStateAction<'linear' | 'log'>>;
  setSelectedTools: Dispatch<SetStateAction<Set<number>>>;
  toolSearchQuery: string;
  setToolSearchQuery: Dispatch<SetStateAction<string>>;
  metric: 'active_repos' | 'pr_reviews';
  setMetric: Dispatch<SetStateAction<'active_repos' | 'pr_reviews'>>;
  METRIC_OPTIONS: { value: 'active_repos' | 'pr_reviews'; label: string }[];
  topRepos: TopReposByDevtool | undefined;
}

/**
 * Combined component that displays both the chart and rankings panels.
 * 
 * Orchestrates:
 * - Chart controls (date range, view type, scale, filters)
 * - Line chart visualization
 * - Current rankings list with top repositories
 */
const LeaderboardChartAndRankings: React.FC<
  LeaderboardChartAndRankingsProps
> = ({
  filteredStats,
  devtools,
  stats,
  selectedTools,
  scaleType,
  getToolDisplayName,
  getToolColor,
  resolvedTheme,
  displayDateRange,
  setDisplayDateRange,
  datePickerOpen,
  setDatePickerOpen,
  presets,
  viewType,
  setViewType,
  setScaleType,
  setSelectedTools,
  toolSearchQuery,
  setToolSearchQuery,
  metric,
  setMetric,
  METRIC_OPTIONS,
  topRepos,
}) => {
  if (!filteredStats || !devtools || !stats) return null;

  // Prepare chartData as before
  const chartData: ChartDataPoint[] = filteredStats.timestamps
    .map((timestamp, index) => {
      // const date = new Date(timestamp * 1000).toLocaleDateString('en-US', {
      //   month: 'short',
      //   day: 'numeric',
      //   year: filteredStats.timestamps.length > 365 ? 'numeric' : undefined,
      // });
      const dataPoint: ChartDataPoint = {
        // date,
        timestamp,
        timestampMs: timestamp * 1000,
      };
      Object.entries(filteredStats.tools).forEach(([toolIdStr, counts]) => {
        const toolId = Number(toolIdStr);
        if (selectedTools.size === 0 || selectedTools.has(toolId)) {
          const countsArray = counts as number[];
          const displayName = getToolDisplayName(toolId, devtools);
          let value = countsArray[index];
          if (scaleType === 'log' && value === 0) {
            value = 0.5;
          }
          dataPoint[displayName] = value;
        }
      });
      return dataPoint;
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  // Replace chartTitle and chartDescription logic
  const { chartTitle, chartDescription } = getChartTitleAndDescription(
    metric,
    viewType
  );

  // Rankings data
  const latestIndex = filteredStats.timestamps.length - 1;
  const rankings = Object.entries(filteredStats.tools)
    .map(([toolIdStr, counts]) => {
      const toolId = Number(toolIdStr);
      const countsArray = counts as number[];
      const currentCount = countsArray[latestIndex] || 0;
      return {
        id: toolId,
        current_count: currentCount,
      };
    })
    .sort((a, b) => b.current_count - a.current_count);

  return (
    <div className="mx-4 sm:mx-6 space-y-6">
      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div>
              <CardTitle className="mb-2">{chartTitle}</CardTitle>
              <CardDescription className="text-xs">
                {chartDescription}
              </CardDescription>
            </div>
            <LeaderboardChartControls
              displayDateRange={displayDateRange}
              setDisplayDateRange={setDisplayDateRange}
              datePickerOpen={datePickerOpen}
              setDatePickerOpen={setDatePickerOpen}
              presets={presets}
              viewType={viewType}
              setViewType={setViewType}
              scaleType={scaleType}
              setScaleType={setScaleType}
              selectedTools={selectedTools}
              setSelectedTools={setSelectedTools}
              toolSearchQuery={toolSearchQuery}
              setToolSearchQuery={setToolSearchQuery}
              stats={stats}
              devtools={devtools}
              metric={metric}
              setMetric={setMetric}
              METRIC_OPTIONS={METRIC_OPTIONS}
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 pr-6">
          {/* Chart rendering moved to subcomponent */}
          <LeaderboardChartGraph
            chartData={chartData}
            selectedTools={selectedTools}
            devtools={devtools}
            stats={stats}
            scaleType={scaleType}
            theme={resolvedTheme}
            getToolDisplayName={getToolDisplayName}
            getToolColor={getToolColor}
            resolvedTheme={resolvedTheme}
          />
        </CardContent>
      </Card>
      {/* Rankings Section */}
      <LeaderboardRankings
        rankings={rankings}
        devtools={devtools}
        topRepos={topRepos}
        getToolDisplayName={(toolId) => getToolDisplayName(toolId, devtools)}
        getToolWebsiteUrl={(toolId) => getToolWebsiteUrl(toolId, devtools)}
        chartTitle={chartTitle}
        metric={metric}
        activeReposMonthly={ACTIVE_REPOS_MONTHLY}
      />
    </div>
  );
};

export default LeaderboardChartAndRankings;
