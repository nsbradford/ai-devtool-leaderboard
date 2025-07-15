'use client';

import React, { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import type {
  LeaderboardData,
  DateRange,
  MaterializedViewType,
  DevTool,
  TopReposByDevtool,
} from '@/types/api';
import { ThemeToggle } from '@/components/theme-toggle';
import { useDebounce } from '@/lib/client-utils';
import Image from 'next/image';
// Removed Collapsible import, using Popover instead

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

export default function LeaderboardChart() {
  const [displayDateRange, setDisplayDateRange] = useState<DateRange>({
    startDate: '2023-07-01',
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const debouncedDisplayDateRange = useDebounce(displayDateRange, 300);

  const [viewType, setViewType] = useState<MaterializedViewType>('monthly');
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');

  const baseUrl =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? window.location.origin
      : '';

  const maxRangeParams = useMemo(
    () =>
      new URLSearchParams({
        viewType,
      }),
    [viewType]
  );

  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<LeaderboardData>(
    `${baseUrl}/api/leaderboard?${maxRangeParams}`,
    fetcher
  );

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
    `${baseUrl}/api/top-repos?limit=5&daysBack=30`,
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

  // Initialize selected tools when stats data is loaded
  useEffect(() => {
    if (stats && stats.tools && Object.keys(stats.tools).length > 0) {
      // Initialize with all tools selected
      setSelectedTools(new Set(Object.keys(stats.tools)));
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

  const pageStructure = (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">
          AI Code Review Usage Tracker
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Tracking adoption of AI code review tools in active open-source repos.
        </p>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Data sourced from{' '}
          <a
            href="https://www.gharchive.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-400 hover:underline"
          >
            GH Archive
          </a>{' '}
          starting 2023-07-01 and updated daily.
        </p>
        <p className="text-muted-foreground text-xs sm:text-sm">
          View source on{' '}
          <a
            href="https://github.com/nsbradford/ai-devtool-leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-400 hover:underline"
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
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <CardTitle>Usage Trends</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Number of repositories with an AI code review,{' '}
                    {viewType === 'weekly' ? '7-day' : '30-day'} rolling window.
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Rolling window toggle */}
                  <div
                    className="flex gap-1"
                    role="group"
                    aria-label="Rolling window selector"
                  >
                    <Button
                      variant={viewType === 'weekly' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      aria-pressed={viewType === 'weekly'}
                      onClick={() => setViewType('weekly')}
                    >
                      7-day
                    </Button>
                    <Button
                      variant={viewType === 'monthly' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      aria-pressed={viewType === 'monthly'}
                      onClick={() => setViewType('monthly')}
                    >
                      30-day
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled
                  >
                    Linear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Log
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                    disabled
                  >
                    <ChevronDown className="h-3 w-3" />
                    Tools (Loading...)
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <label className="text-sm font-medium">Start Date:</label>
                  <input
                    type="date"
                    value={displayDateRange.startDate}
                    onChange={(e) =>
                      setDisplayDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <label className="text-sm font-medium">End Date:</label>
                  <input
                    type="date"
                    value={displayDateRange.endDate}
                    onChange={(e) =>
                      setDisplayDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-96 flex items-center justify-center bg-muted/20 rounded-md">
                <div className="text-muted-foreground">Loading chart...</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Rankings</CardTitle>
              <CardDescription className="text-xs">
                All tools ranked by current repository count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-muted-foreground min-w-[1.5rem]">
                        {i}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-muted animate-pulse"></div>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        renderChartAndRankings()
      )}

      <br />
      <hr className="border-border" />
      <p className="text-muted-foreground text-xs">
        Vibe coded by{' '}
        <a
          href="https://www.nsbradford.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-400 hover:underline"
        >
          Nick Bradford
        </a>
        .
      </p>
    </div>
  );

  function renderChartAndRankings() {
    if (!filteredStats || !devtools) return null;

    // Map tool IDs to display names
    const getToolDisplayName = (toolId: string): string => {
      const devtool = devtools.find((dt: DevTool) => dt.id === toolId);
      const displayName = devtool ? devtool.name : `Tool ${toolId}`;
      return displayName;
    };

    const getToolColor = (toolId: string): string => {
      const devtool = devtools.find((dt: DevTool) => dt.id === toolId);
      return devtool?.brand_color || '#8884d8';
    };

    const getToolWebsiteUrl = (toolId: string): string | undefined => {
      const devtool = devtools.find((dt: DevTool) => dt.id === toolId);
      return devtool?.website_url;
    };

    const chartData: ChartDataPoint[] = filteredStats.timestamps
      .map((timestamp, index) => {
        const date = new Date(timestamp * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: filteredStats.timestamps.length > 365 ? '2-digit' : undefined,
        });

        const dataPoint: ChartDataPoint = {
          date,
          timestamp,
        };

        Object.entries(filteredStats.tools).forEach(([toolId, counts]) => {
          // Only include selected tools (or all if none selected)
          if (selectedTools.size === 0 || selectedTools.has(toolId)) {
            const countsArray = counts as number[];
            const displayName = getToolDisplayName(toolId);
            let value = countsArray[index];
            // For log scale, we need to handle zero values carefully
            // We'll use a small positive value (0.5) to represent zero
            if (scaleType === 'log' && value === 0) {
              value = 0.5;
            }
            dataPoint[displayName] = value;
          }
        });

        return dataPoint;
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return (
      <div className="space-y-6">
        {/* Chart Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div>
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Number of repositories with an AI code review,{' '}
                  {viewType === 'weekly' ? '7-day' : '30-day'} rolling window.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Rolling window toggle */}
                <div
                  className="flex gap-1"
                  role="group"
                  aria-label="Rolling window selector"
                >
                  <Button
                    variant={viewType === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    aria-pressed={viewType === 'weekly'}
                    onClick={() => setViewType('weekly')}
                  >
                    7-day
                  </Button>
                  <Button
                    variant={viewType === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    aria-pressed={viewType === 'monthly'}
                    onClick={() => setViewType('monthly')}
                  >
                    30-day
                  </Button>
                </div>
                <Button
                  variant={scaleType === 'linear' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScaleType('linear')}
                  className="text-xs"
                >
                  Linear
                </Button>
                <Button
                  variant={scaleType === 'log' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScaleType('log')}
                  className="text-xs"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Log
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-xs"
                    >
                      <ChevronDown className="h-3 w-3" />
                      Tools (
                      {selectedTools.size === 0 ? 'All' : selectedTools.size})
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0">
                    <div className="flex flex-col space-y-3 p-4 border-b rounded-t-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {selectedTools.size === 0
                            ? 'All tools selected'
                            : `${selectedTools.size} of ${Object.keys(stats?.tools || {}).length} tools selected`}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (
                              stats &&
                              selectedTools.size ===
                                Object.keys(stats.tools).length
                            ) {
                              setSelectedTools(new Set()); // Clear all
                            } else if (stats) {
                              setSelectedTools(
                                new Set(Object.keys(stats.tools))
                              ); // Select all
                            }
                          }}
                        >
                          {stats &&
                          selectedTools.size === Object.keys(stats.tools).length
                            ? 'Clear All'
                            : 'Select All'}
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {Object.keys(stats?.tools || {})
                          .map((toolId) => ({
                            toolId,
                            displayName: getToolDisplayName(toolId),
                            devtool: devtools.find(
                              (dt: DevTool) => dt.id === toolId
                            ),
                          }))
                          .sort((a, b) =>
                            a.displayName.localeCompare(b.displayName)
                          )
                          .map(({ toolId, displayName, devtool }) => {
                            const isSelected = selectedTools.has(toolId);
                            const avatarUrl = devtool?.avatar_url;
                            return (
                              <div
                                key={toolId}
                                className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-primary/10 border-primary/20'
                                    : 'bg-background border-border hover:bg-muted'
                                }`}
                                onClick={() => {
                                  const newSelected = new Set(selectedTools);
                                  if (isSelected) {
                                    newSelected.delete(toolId);
                                  } else {
                                    newSelected.add(toolId);
                                  }
                                  setSelectedTools(newSelected);
                                }}
                              >
                                {avatarUrl && (
                                  <Image
                                    src={avatarUrl}
                                    alt={`${displayName} avatar`}
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 rounded-full"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-sm font-medium truncate">
                                  {displayName}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-primary ml-auto" />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <label className="text-sm font-medium">Start Date:</label>
                <input
                  type="date"
                  value={displayDateRange.startDate}
                  onChange={(e) =>
                    setDisplayDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <label className="text-sm font-medium">End Date:</label>
                <input
                  type="date"
                  value={displayDateRange.endDate}
                  onChange={(e) =>
                    setDisplayDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    label={{
                      value: 'Repository Count',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                    tick={{ fontSize: 12 }}
                    scale={scaleType}
                    domain={
                      scaleType === 'log'
                        ? [0.5, 'dataMax']
                        : ['dataMin', 'dataMax']
                    }
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      scaleType === 'log' && value === 0.5
                        ? '0'
                        : value.toLocaleString(),
                      name,
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  {Object.keys(stats?.tools || {})
                    .filter((toolId) =>
                      selectedTools.size === 0
                        ? false
                        : selectedTools.has(toolId)
                    )
                    .map((toolId) => {
                      const displayName = getToolDisplayName(toolId);
                      const color = getToolColor(toolId);
                      return (
                        <Line
                          key={toolId}
                          type="monotone"
                          dataKey={displayName}
                          stroke={color}
                          strokeWidth={2}
                          name={displayName}
                          dot={false}
                        />
                      );
                    })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rankings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Rankings</CardTitle>
            <CardDescription className="text-xs">
              All tools ranked by current repository count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {(() => {
                const latestIndex = filteredStats.timestamps.length - 1;
                const rankings = Object.entries(filteredStats.tools)
                  .map(([toolId, counts]) => {
                    const countsArray = counts as number[];
                    const currentCount = countsArray[latestIndex] || 0;

                    return {
                      id: toolId,
                      current_count: currentCount,
                    };
                  })
                  .sort((a, b) => b.current_count - a.current_count);

                return rankings.map((tool, index) => {
                  const devtool = devtools.find(
                    (dt: DevTool) => dt.id === tool.id
                  );
                  const avatarUrl = devtool?.avatar_url;
                  const displayName = getToolDisplayName(tool.id);
                  const websiteUrl = getToolWebsiteUrl(tool.id);

                  return (
                    <div
                      key={tool.id}
                      className="flex flex-col p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-muted-foreground min-w-[1.5rem]">
                            {index + 1}
                          </span>
                          {avatarUrl && (
                            <Image
                              src={avatarUrl}
                              alt={`${displayName} avatar`}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {websiteUrl ? (
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:text-blue-600 hover:underline transition-colors"
                            >
                              {displayName}
                            </a>
                          ) : (
                            <span className="text-sm font-medium">
                              {displayName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {tool.current_count.toLocaleString()}
                        </span>
                      </div>
                      {topRepos &&
                        topRepos[tool.id] &&
                        topRepos[tool.id].length > 0 && (
                          <div className="mt-1 ml-8 flex flex-wrap gap-1 text-xs text-muted-foreground">
                            {topRepos[tool.id]
                              .slice(0, 3)
                              .map((repo, repoIndex) => (
                                <span key={repo.repo_name}>
                                  <a
                                    href={`https://github.com/${repo.repo_name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 hover:underline transition-colors"
                                  >
                                    {repo.repo_name}
                                  </a>
                                  <span className="ml-1">
                                    ({repo.star_count.toLocaleString()}⭐)
                                  </span>
                                  {repoIndex <
                                    Math.min(topRepos[tool.id].length, 3) -
                                      1 && <span className="mx-1">•</span>}
                                </span>
                              ))}
                          </div>
                        )}
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return pageStructure;
}
