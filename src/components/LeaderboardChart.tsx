'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScaleToggle } from '@/components/ui/ScaleToggle';
import { WindowToggle } from '@/components/ui/WindowToggle';
import { useDebounce } from '@/lib/client-utils';
import { ACTIVE_REPOS_MONTHLY, DEFAULT_START_DATE } from '@/lib/constants';
import type {
  DateRange,
  DevTool,
  LeaderboardData,
  MaterializedViewType,
  TopReposByDevtool,
} from '@/types/api';
import { format, subDays } from 'date-fns';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { LeaderboardChartControls } from './LeaderboardChartControls';
import {
  getToolColor,
  getToolDisplayName,
  getToolWebsiteUrl,
  getXAxisTicks,
  xAxisTickFormatter,
} from './leaderboardChartUtils';
import { LeaderboardRankings } from './LeaderboardRankings';

import { LeaderboardChartGraph } from './LeaderboardChartGraph';
interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: string | number;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

const METRIC_OPTIONS = [
  { value: 'active_repos', label: 'Active Repos' },
  { value: 'pr_reviews', label: 'PR Reviews' },
];

export default function LeaderboardChart() {
  const [displayDateRange, setDisplayDateRange] = useState<DateRange>({
    startDate: DEFAULT_START_DATE,
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const debouncedDisplayDateRange = useDebounce(displayDateRange, 300);

  const [viewType, setViewType] = useState<MaterializedViewType>('monthly');
  const [selectedTools, setSelectedTools] = useState<Set<number>>(new Set());
  const prevToolKeysRef = useRef<string[]>([]);
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [metric, setMetric] = useState<'active_repos' | 'pr_reviews'>(
    'active_repos'
  );

  const baseUrl =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? window.location.origin
      : '';

  // Fetch stats from the correct endpoint based on metric
  const statsEndpoint = useMemo(() => {
    const params = new URLSearchParams({ viewType });
    if (metric === 'pr_reviews') {
      return `${baseUrl}/api/leaderboard-reviews?${params}`;
    }
    return `${baseUrl}/api/leaderboard?${params}`;
  }, [baseUrl, viewType, metric]);

  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<LeaderboardData>(statsEndpoint, fetcher);

  const {
    data: devtools,
    error: devtoolsError,
    isLoading: devtoolsLoading,
  } = useSWR<DevTool[]>(`${baseUrl}/api/devtools`, fetcher);

  const {
    data: topRepos,
    error: topReposError,
    isLoading: topReposLoading,
  } = useSWR<TopReposByDevtool>(
    `${baseUrl}/api/top-repos?limit=10&daysBack=30`,
    fetcher
  );

  const filteredStats = useMemo(() => {
    if (!stats) return null;

    const startTimestamp = Math.floor(
      new Date(debouncedDisplayDateRange.startDate).getTime() / 1000
    );
    const endTimestamp = Math.floor(
      new Date(debouncedDisplayDateRange.endDate).getTime() / 1000
    );

    const filteredIndices: number[] = [];
    const filteredTimestamps: number[] = [];

    stats.timestamps.forEach((timestamp, index) => {
      if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
        filteredIndices.push(index);
        filteredTimestamps.push(timestamp);
      }
    });

    const filteredTools: Record<string, number[]> = {};
    Object.entries(stats.tools).forEach(([toolId, counts]) => {
      filteredTools[toolId] = filteredIndices.map(
        (index) => (counts as number[])[index]
      );
    });

    return {
      timestamps: filteredTimestamps,
      tools: filteredTools,
    };
  }, [stats, debouncedDisplayDateRange]);

  // Initialize selected tools when stats data is loaded, but only if the set of tool keys changes
  useEffect(() => {
    if (stats && stats.tools && Object.keys(stats.tools).length > 0) {
      const toolKeys = Object.keys(stats.tools);
      const prevToolKeys = prevToolKeysRef.current;
      const toolKeysChanged =
        toolKeys.length !== prevToolKeys.length ||
        toolKeys.some((k, i) => k !== prevToolKeys[i]);
      if (toolKeysChanged) {
        setSelectedTools(new Set(toolKeys.map(Number)));
        prevToolKeysRef.current = toolKeys;
      }
    }
  }, [stats]);

  // TODO not sure if this is working properly
  // After the main stats load, prefetch the other window type in the background
  useEffect(() => {
    if (stats) {
      const otherViewType: MaterializedViewType =
        viewType === 'monthly' ? 'weekly' : 'monthly';
      const otherParams = new URLSearchParams({ viewType: otherViewType });
      const otherUrl = `${baseUrl}/api/leaderboard?${otherParams}`;
      mutate(otherUrl, fetcher(otherUrl));
    }
  }, [stats, viewType, baseUrl]);

  const loading = statsLoading || devtoolsLoading || topReposLoading;
  const error = statsError || devtoolsError || topReposError;

  const { resolvedTheme } = useTheme();

  // Date presets
  const today = new Date();
  const presets = [
    {
      label: 'Last 90 days',
      getRange: () => ({
        startDate: format(subDays(today, 89), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      }),
    },
    {
      label: 'Last 365 days',
      getRange: () => ({
        startDate: format(subDays(today, 364), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      }),
    },
    {
      label: 'All time',
      getRange: () => ({
        startDate: DEFAULT_START_DATE,
        endDate: format(today, 'yyyy-MM-dd'),
      }),
    },
  ];

  const pageStructure = (
    <div className="w-full max-w-none xl:max-w-7xl xl:mx-auto space-y-6">
      <div className="text-center relative mx-4 sm:mx-6 mt-4 sm:mt-6">
        <div className="absolute top-[-0.5em] right-[-0.5em] sm:top-0 sm:right-0">
          <ThemeToggle />
        </div>
        <div className="flex justify-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 max-w-[70%]">
            AI Code Review Adoption Tracker
          </h1>
        </div>
        {/* <p className="text-muted-foreground text-sm sm:text-base">
          Tracking usage of AI code review tools in active open-source repos.
        </p> */}
        <p className="text-muted-foreground text-xs sm:text-sm">
          Public repo data fetched from{' '}
          <a
            href="https://www.gharchive.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-600 hover:underline"
          >
            GH Archive
          </a>{' '}
          and updated daily.
        </p>
        <p className="text-muted-foreground text-xs sm:text-sm">
          View source on{' '}
          <a
            href="https://github.com/nsbradford/ai-devtool-leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-600 hover:underline"
          >
            GitHub
          </a>
          .
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Error:{' '}
              {error instanceof Error ? error.message : 'An error occurred'}
            </div>
          </CardContent>
        </Card>
      ) : loading || !stats || !devtools ? (
        <div className="mx-4 sm:mx-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2">
                <div>
                  <CardTitle className="mb-2">Active Repositories</CardTitle>
                  <CardDescription className="text-xs">
                    Repos with an AI code review,{' '}
                    {viewType === 'weekly' ? '7-day' : '30-day'} rolling window.
                  </CardDescription>
                </div>

                {/* Control Bar Skeleton */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                  {/* Time Scope Section */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {/* Time preset buttons skeleton */}
                      <div className="flex gap-1 overflow-x-auto">
                        {presets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            className={`px-2 py-1 rounded text-xs border border-input bg-background hover:bg-muted transition-colors whitespace-nowrap ${
                              displayDateRange.startDate ===
                                preset.getRange().startDate &&
                              displayDateRange.endDate ===
                                preset.getRange().endDate
                                ? 'bg-primary/10 border-primary/20 font-semibold'
                                : ''
                            }`}
                            onClick={() =>
                              setDisplayDateRange(preset.getRange())
                            }
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      {/* Date range picker skeleton */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled
                      >
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Window Size Section */}
                  <div className="flex items-center gap-2">
                    <WindowToggle value={viewType} onChange={setViewType} />
                  </div>

                  {/* Scale Section */}
                  <div className="flex items-center gap-2">
                    <ScaleToggle value={scaleType} onChange={setScaleType} />
                  </div>

                  {/* Series Filter Section */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-xs h-7 rounded-full"
                      disabled
                    >
                      <ChevronDown className="h-3 w-3" />
                      Series (...)
                    </Button>
                  </div>

                  {/* Metric Dropdown */}
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-xs h-7 rounded-full"
                        >
                          <ChevronDown className="h-3 w-3" />
                          {METRIC_OPTIONS.find((opt) => opt.value === metric)
                            ?.label || 'Metric'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-0">
                        <div className="flex flex-col">
                          {METRIC_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              className={`px-3 py-2 text-left text-xs hover:bg-muted ${
                                metric === opt.value
                                  ? 'bg-primary/10 font-semibold'
                                  : ''
                              }`}
                              onClick={() =>
                                setMetric(
                                  opt.value as 'active_repos' | 'pr_reviews'
                                )
                              }
                            >
                              {opt.label}
                              {metric === opt.value && (
                                <Check className="inline ml-2 h-3 w-3 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pr-6">
              <div className="h-82 sm:h-128 flex items-center justify-center bg-muted/20 rounded-md">
                <div className="text-muted-foreground">Loading chart...</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="">Current Rankings</CardTitle>
                <span className="text-xs text-muted-foreground pr-2">
                  Active Repos
                </span>
              </div>
              <CardDescription className="text-xs">
                There were {ACTIVE_REPOS_MONTHLY} public repos with pull
                requests last month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col p-2 rounded-lg border bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-muted-foreground min-w-[1.5rem]">
                          {i}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-muted animate-pulse"></div>
                        <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
                        {/* Mobile toggle button skeleton */}
                        <div className="h-6 w-6 rounded bg-muted animate-pulse md:hidden"></div>
                      </div>
                    </div>
                    {/* Desktop inline display skeleton */}
                    <div className="mt-1 ml-8 flex-wrap gap-1 text-xs text-muted-foreground hidden md:flex">
                      <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        renderChartAndRankings(resolvedTheme)
      )}

      <div className="mx-4 sm:mx-6">
        <br />
        <hr className="border-border" />
        <p className="text-muted-foreground text-xs mt-2 mb-24">
          Vibe coded by{' '}
          <a
            href="https://www.nsbradford.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-600 hover:underline"
          >
            Nick Bradford
          </a>
          .
        </p>
      </div>
    </div>
  );

  function renderChartAndRankings(theme: string | undefined) {
    if (!filteredStats || !devtools || !stats) return null;

    // Prepare chartData as before
    const chartData: ChartDataPoint[] = filteredStats.timestamps
      .map((timestamp, index) => {
        const date = new Date(timestamp * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: filteredStats.timestamps.length > 365 ? 'numeric' : undefined,
        });
        const dataPoint: ChartDataPoint = {
          date,
          timestamp,
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

    const chartTitle =
      metric === 'pr_reviews' ? 'PR Reviews' : 'Active Repositories';
    const chartDescription =
      metric === 'pr_reviews'
        ? `Number of PR reviews by AI code review bots, ${viewType === 'weekly' ? '7-day' : '30-day'} rolling window.`
        : `Repos with an AI code review, ${viewType === 'weekly' ? '7-day' : '30-day'} rolling window.`;

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
              theme={theme}
              getToolDisplayName={getToolDisplayName}
              getToolColor={getToolColor}
              getXAxisTicks={getXAxisTicks}
              xAxisTickFormatter={xAxisTickFormatter}
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
  }

  return pageStructure;
}
