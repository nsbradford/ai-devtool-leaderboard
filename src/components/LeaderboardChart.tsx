// copywrite 2025 anysphere inc
'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/lib/client-utils';
import { DEFAULT_START_DATE } from '@/lib/constants';
import type {
  DateRange,
  DevTool,
  LeaderboardData,
  MaterializedViewType,
  TopReposByDevtool,
} from '@/types/api';
import { format, subDays } from 'date-fns';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { getToolColor, getToolDisplayName } from './leaderboardChartUtils';

import LeaderboardChartAndRankings from './LeaderboardChartAndRankings';
import LeaderboardChartSkeleton from './LeaderboardChartSkeleton';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

const METRIC_OPTIONS: {
  value: 'active_repos' | 'pr_reviews';
  label: string;
}[] = [
  { value: 'active_repos', label: 'Active Repos' },
  { value: 'pr_reviews', label: 'PR Reviews' },
];

export default function LeaderboardChart() {
  const [displayDateRange, setDisplayDateRange] = useState<DateRange>({
    startDate: DEFAULT_START_DATE,
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const debouncedDisplayDateRange = useDebounce(displayDateRange, 300);

  const [viewType, setViewType] = useState<MaterializedViewType>('weekly');
  const [selectedTools, setSelectedTools] = useState<Set<number>>(new Set());
  const prevToolKeysRef = useRef<string[]>([]);
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [toolSearchQuery, setToolSearchQuery] = useState<string>('');
  const [metric, setMetric] = useState<'active_repos' | 'pr_reviews'>(
    'pr_reviews'
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
  const presets = useMemo(() => {
    const today = new Date();
    return [
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
  }, []);

  // Remove passthroughs for getXAxisTicks and xAxisTickFormatter

  return (
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
        <LeaderboardChartSkeleton />
      ) : (
        <LeaderboardChartAndRankings
          filteredStats={filteredStats}
          devtools={devtools}
          stats={stats}
          selectedTools={selectedTools}
          scaleType={scaleType}
          getToolDisplayName={getToolDisplayName}
          getToolColor={getToolColor}
          resolvedTheme={resolvedTheme}
          displayDateRange={displayDateRange}
          setDisplayDateRange={setDisplayDateRange}
          datePickerOpen={datePickerOpen}
          setDatePickerOpen={setDatePickerOpen}
          presets={presets}
          viewType={viewType}
          setViewType={setViewType}
          setScaleType={setScaleType}
          setSelectedTools={setSelectedTools}
          toolSearchQuery={toolSearchQuery}
          setToolSearchQuery={setToolSearchQuery}
          metric={metric}
          setMetric={setMetric}
          METRIC_OPTIONS={METRIC_OPTIONS}
          topRepos={topRepos}
        />
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
}
