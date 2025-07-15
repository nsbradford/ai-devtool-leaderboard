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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useDebounce } from '@/lib/client-utils';
import { cn } from '@/lib/utils';
import type {
  DateRange,
  DevTool,
  LeaderboardData,
  MaterializedViewType,
  TopReposByDevtool,
} from '@/types/api';
import { format, subDays } from 'date-fns';
import { Calendar, Check, ChevronDown, Star } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useSWR, { mutate } from 'swr';
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

function formatStarCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10000)
    return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'k'; // 1.0k-9.9k
  if (n < 1000000) return Math.floor(n / 1000) + 'k'; // 10k-999k
  return Math.floor(n / 100000) / 10 + 'M'; // 1.0M+
}

function WindowToggle({
  value,
  onChange,
}: {
  value: 'weekly' | 'monthly';
  onChange: (v: 'weekly' | 'monthly') => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      /* shadcn passes `null` when a selected item is clicked again */
      onValueChange={(v) => v && onChange(v as 'weekly' | 'monthly')}
      /* one ring, one radius → wrapper handles the outer shape */
      className="inline-flex isolate rounded-lg ring-1 ring-inset ring-border bg-background"
    >
      {(['weekly', 'monthly'] as const).map((v) => (
        <ToggleGroupItem
          key={v}
          value={v}
          aria-label={v === 'weekly' ? '7-day window' : '30-day window'}
          /* first/last utilities give you the pill shape without manual classes */
          className={cn(
            'h-7 px-3 text-xs font-medium focus-visible:outline-none',
            'ring-1 ring-inset ring-transparent first:rounded-l-lg last:rounded-r-lg',
            /* selected state */
            'data-[state=on]:bg-primary/10 data-[state=on]:border-primary/20 data-[state=on]:font-semibold',
            /* hover */
            'hover:bg-muted/50'
          )}
        >
          {v === 'weekly' ? '7-day' : '30-day'}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function ScaleToggle({
  value,
  onChange,
}: {
  value: 'linear' | 'log';
  onChange: (v: 'linear' | 'log') => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      /* shadcn passes `null` when a selected item is clicked again */
      onValueChange={(v) => v && onChange(v as 'linear' | 'log')}
      /* one ring, one radius → wrapper handles the outer shape */
      className="inline-flex isolate rounded-lg ring-1 ring-inset ring-border bg-background"
    >
      {(['linear', 'log'] as const).map((v) => (
        <ToggleGroupItem
          key={v}
          value={v}
          aria-label={v === 'linear' ? 'Linear scale' : 'Logarithmic scale'}
          /* first/last utilities give you the pill shape without manual classes */
          className={cn(
            'h-7 px-3 text-xs font-medium focus-visible:outline-none',
            'ring-1 ring-inset ring-transparent first:rounded-l-lg last:rounded-r-lg',
            /* selected state */
            'data-[state=on]:bg-primary/10 data-[state=on]:border-primary/20 data-[state=on]:font-semibold',
            /* hover */
            'hover:bg-muted/50'
          )}
        >
          {v === 'linear' ? 'Linear' : 'Log'}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function CustomLegend({
  payload,
  selectedTools,
  setSelectedTools,
  devtools,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  selectedTools: Set<string>;
  setSelectedTools: (tools: Set<string>) => void;
  devtools?: DevTool[];
}) {
  if (!payload || !devtools) return null;

  const getToolIdFromDisplayName = (displayName: string): string | null => {
    const devtool = devtools.find((dt: DevTool) => dt.name === displayName);
    return devtool ? devtool.id : null;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        width: '100%',
      }}
    >
      {payload.map((entry) => {
        const toolId = getToolIdFromDisplayName(entry.value);
        const isSelected = toolId ? selectedTools.has(toolId) : true;
        const opacity = isSelected ? 1 : 0.5;

        return (
          <div
            key={entry.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              opacity,
              transition: 'opacity 0.2s ease',
            }}
            onClick={() => {
              if (toolId) {
                const newSelected = new Set(selectedTools);
                if (isSelected) {
                  newSelected.delete(toolId);
                } else {
                  newSelected.add(toolId);
                }
                setSelectedTools(newSelected);
              }
            }}
            title={`Click to ${isSelected ? 'hide' : 'show'} ${entry.value}`}
          >
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                backgroundColor: entry.color,
                borderRadius: 3,
                marginRight: 2,
                border: '1px solid #ccc',
              }}
            />
            <span style={{ fontSize: 13, color: entry.color }}>
              {entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function LeaderboardChart() {
  const [displayDateRange, setDisplayDateRange] = useState<DateRange>({
    startDate: '2023-07-01',
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const debouncedDisplayDateRange = useDebounce(displayDateRange, 300);

  const [viewType, setViewType] = useState<MaterializedViewType>('monthly');
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const prevToolKeysRef = useRef<string[]>([]);
  const [scaleType, setScaleType] = useState<'linear' | 'log'>('linear');
  const [openRepoPopover, setOpenRepoPopover] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');

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

  // Initialize selected tools when stats data is loaded, but only if the set of tool keys changes
  useEffect(() => {
    if (stats && stats.tools && Object.keys(stats.tools).length > 0) {
      const toolKeys = Object.keys(stats.tools);
      const prevToolKeys = prevToolKeysRef.current;
      const toolKeysChanged =
        toolKeys.length !== prevToolKeys.length ||
        toolKeys.some((k, i) => k !== prevToolKeys[i]);
      if (toolKeysChanged) {
        setSelectedTools(new Set(toolKeys));
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
        startDate: '2023-07-01',
        endDate: format(today, 'yyyy-MM-dd'),
      }),
    },
  ];

  const pageStructure = (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">
          AI Code Review Adoption Tracker
        </h1>
        {/* <p className="text-muted-foreground text-sm sm:text-base">
          Tracking usage of AI code review tools in active open-source repos.
        </p> */}
        <p className="text-muted-foreground text-xs sm:text-sm">
          Data sourced from{' '}
          <a
            href="https://www.gharchive.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-600 hover:underline"
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
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <CardTitle>Active Repositories</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Number of repositories with an AI code review,{' '}
                    {viewType === 'weekly' ? '7-day' : '30-day'} rolling window.
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Rolling window toggle */}
                  <WindowToggle value={viewType} onChange={setViewType} />
                  <ScaleToggle value={scaleType} onChange={setScaleType} />
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
              {/* Date Presets Row */}
              <div className="flex flex-wrap gap-1 mb-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`px-2 py-1 rounded text-xs border border-input bg-background hover:bg-muted transition-colors ${
                      displayDateRange.startDate ===
                        preset.getRange().startDate &&
                      displayDateRange.endDate === preset.getRange().endDate
                        ? 'bg-primary/10 border-primary/20 font-semibold'
                        : ''
                    }`}
                    onClick={() => setDisplayDateRange(preset.getRange())}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  {/* <label className="text-xs font-medium">Start Date:</label> */}
                  <input
                    type="date"
                    value={displayDateRange.startDate}
                    onChange={(e) =>
                      setDisplayDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  {/* <label className="text-xs font-medium">End Date:</label> */}
                  <label className="text-xs font-medium">→</label>
                  <input
                    type="date"
                    value={displayDateRange.endDate}
                    onChange={(e) =>
                      setDisplayDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
            </CardHeader>{' '}
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
        renderChartAndRankings(resolvedTheme)
      )}

      <br />
      <hr className="border-border" />
      <p className="text-muted-foreground text-xs mb-24">
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

  function renderChartAndRankings(theme: string | undefined) {
    if (!filteredStats || !devtools) return null;

    // Map tool IDs to display names
    const getToolDisplayName = (toolId: string): string => {
      const devtool = devtools.find((dt: DevTool) => dt.id === toolId);
      const displayName = devtool ? devtool.name : `Tool ${toolId}`;
      return displayName;
    };

    const getToolColor = (toolId: string): string => {
      const devtool = devtools.find((dt: DevTool) => dt.id === toolId);
      if (!devtool) return '#8884d8';
      if (theme === 'dark' && devtool.brand_color_dark) {
        return devtool.brand_color_dark;
      }
      return devtool.brand_color;
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
            <div className="flex flex-col gap-4">
              <div>
                <CardTitle>Active Repositories</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Number of repositories with an AI code review,{' '}
                  {viewType === 'weekly' ? '7-day' : '30-day'} rolling window.
                </CardDescription>
              </div>

              {/* Single Horizontal Control Bar */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Time Scope Section */}
                <div className="flex items-center gap-2">
                  {/* <span className="text-sm font-medium text-muted-foreground">Time scope</span> */}
                  <div className="flex items-center gap-1">
                    {/* Time preset buttons - horizontal scroll if > 5 */}
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
                          onClick={() => setDisplayDateRange(preset.getRange())}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    {/* Date range picker icon */}
                    <Popover
                      open={datePickerOpen}
                      onOpenChange={setDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <Calendar className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-4">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={displayDateRange.startDate}
                                onChange={(e) =>
                                  setDisplayDateRange((prev) => ({
                                    ...prev,
                                    startDate: e.target.value,
                                  }))
                                }
                                className="px-3 py-2 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={displayDateRange.endDate}
                                onChange={(e) =>
                                  setDisplayDateRange((prev) => ({
                                    ...prev,
                                    endDate: e.target.value,
                                  }))
                                }
                                className="px-3 py-2 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="h-6 w-px bg-border" />

                {/* Window Size Section */}
                <div className="flex items-center gap-2">
                  {/* <span className="text-sm font-medium text-muted-foreground">
                    Window
                  </span> */}
                  <WindowToggle value={viewType} onChange={setViewType} />
                </div>

                {/* Scale Section */}
                <div className="flex items-center gap-2">
                  {/* <span className="text-sm font-medium text-muted-foreground">
                    Scale
                  </span> */}
                  <ScaleToggle value={scaleType} onChange={setScaleType} />
                </div>

                {/* Vertical divider */}
                <div className="h-6 w-px bg-border" />

                {/* Series Filter Section */}
                <div className="flex items-center gap-2">
                  {/* <span className="text-sm font-medium text-muted-foreground">Series filter</span> */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs h-7 rounded-full"
                      >
                        <ChevronDown className="h-3 w-3" />
                        Series (
                        {selectedTools.size === 0 ? 'All' : selectedTools.size})
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <div className="flex flex-col space-y-2 p-2 border-b rounded-t-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {selectedTools.size === 0
                              ? 'All tools selected'
                              : `${selectedTools.size} of ${Object.keys(stats?.tools || {}).length} tools selected`}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
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
                            selectedTools.size ===
                              Object.keys(stats.tools).length
                              ? 'Clear All'
                              : 'Select All'}
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Search tools..."
                            value={toolSearchQuery}
                            onChange={(e) => setToolSearchQuery(e.target.value)}
                            className="w-full px-2 py-1 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                          />
                          <div className="space-y-0.5 max-h-64 overflow-y-auto">
                            {Object.keys(stats?.tools || {})
                              .map((toolId) => ({
                                toolId,
                                displayName: getToolDisplayName(toolId),
                                devtool: devtools.find(
                                  (dt: DevTool) => dt.id === toolId
                                ),
                              }))
                              .filter(({ displayName }) =>
                                displayName
                                  .toLowerCase()
                                  .includes(toolSearchQuery.toLowerCase())
                              )
                              .sort((a, b) =>
                                a.displayName.localeCompare(b.displayName)
                              )
                              .map(({ toolId, displayName, devtool }) => {
                                const isSelected = selectedTools.has(toolId);
                                const avatarUrl = devtool?.avatar_url;
                                return (
                                  <div
                                    key={toolId}
                                    className={`flex items-center space-x-1.5 p-1.5 rounded-md border cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-primary/10 border-primary/20'
                                        : 'bg-background border-border hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      const newSelected = new Set(
                                        selectedTools
                                      );
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
                                        width={12}
                                        height={12}
                                        className="w-3 h-3 rounded-full"
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            'none';
                                        }}
                                      />
                                    )}
                                    <span className="text-xs font-medium truncate">
                                      {displayName}
                                    </span>
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-primary ml-auto" />
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    ticks={getXAxisTicks(chartData)}
                    tickFormatter={xAxisTickFormatter}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    scale={scaleType}
                    domain={
                      scaleType === 'log'
                        ? [0.5, 'dataMax']
                        : ['dataMin', 'dataMax']
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
                    labelFormatter={(label) => `Date: ${label}`}
                    wrapperStyle={{ zIndex: 1000 }}
                  />
                  <Legend
                    content={
                      <CustomLegend
                        selectedTools={selectedTools}
                        setSelectedTools={setSelectedTools}
                        devtools={devtools}
                      />
                    }
                  />
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
                          animationDuration={400}
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
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-lg m-0">Current Rankings</CardTitle>
              <span className="text-xs text-muted-foreground pr-2">
                Active Repos
              </span>
            </div>
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
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {tool.current_count.toLocaleString()}
                          </span>
                          {/* Mobile toggle button */}
                          {topRepos &&
                            topRepos[tool.id] &&
                            topRepos[tool.id].length > 0 && (
                              <Popover
                                open={openRepoPopover === tool.id}
                                onOpenChange={(open) => {
                                  setOpenRepoPopover(open ? tool.id : null);
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 md:hidden"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0">
                                  <div className="p-3">
                                    <div className="text-xs font-medium mb-2">
                                      Top Repositories
                                    </div>
                                    <div className="space-y-2">
                                      {topRepos[tool.id].map((repo) => (
                                        <div
                                          key={repo.repo_name}
                                          className="flex items-center justify-between"
                                        >
                                          <a
                                            href={`https://github.com/${repo.repo_name}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs hover:text-blue-600 hover:underline transition-colors truncate max-w-[180px]"
                                          >
                                            {repo.repo_name}
                                          </a>
                                          <span className="text-xs text-muted-foreground flex items-center">
                                            {formatStarCount(repo.star_count)}
                                            <Star className="inline w-3 h-3 ml-1 text-muted-foreground" />
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                        </div>
                      </div>
                      {/* Desktop inline display */}
                      {topRepos &&
                        topRepos[tool.id] &&
                        topRepos[tool.id].length > 0 && (
                          <div className="mt-1 ml-8 flex-wrap gap-1 text-xs text-muted-foreground hidden md:flex">
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
                                    ({formatStarCount(repo.star_count)}
                                    <Star
                                      className="inline w-3 h-3 text-muted-foreground"
                                      style={{ verticalAlign: '-0.125em' }}
                                    />
                                    )
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

  function getXAxisTicks(chartData: ChartDataPoint[]): string[] {
    if (chartData.length === 0) return [];
    // If the range is more than 2 years, show only Jan 1 of each year
    // If the range is more than 6 months, show first of each month
    // Otherwise, show first of each week (or just use recharts default)
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const firstDate = new Date(first.timestamp * 1000);
    const lastDate = new Date(last.timestamp * 1000);
    const months =
      (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
      (lastDate.getMonth() - firstDate.getMonth());
    if (months > 24) {
      // Show Jan 1 of each year
      return chartData
        .filter((d) => {
          const dt = new Date(d.timestamp * 1000);
          return dt.getMonth() === 0 && dt.getDate() === 1;
        })
        .map((d) => d.date);
    } else if (months > 6) {
      // Show first of each month
      return chartData
        .filter((d) => {
          const dt = new Date(d.timestamp * 1000);
          return dt.getDate() === 1;
        })
        .map((d) => d.date);
    } else {
      // Show every 2nd or 3rd tick to avoid crowding
      const step = Math.ceil(chartData.length / 8);
      return chartData.filter((_, i) => i % step === 0).map((d) => d.date);
    }
  }

  function xAxisTickFormatter(dateStr: string) {
    // Try to parse the date string back to a Date
    // The current format is 'Apr 6, 25' or 'Apr 6' (from toLocaleDateString)
    // We'll just show 'MMM yyyy' or 'MMM d' depending on range
    // But since we control the ticks, we can show 'MMM yyyy' for year/month, 'MMM d' for short
    // Try to parse as Date
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return dateStr;
    if (dt.getDate() === 1 && dt.getMonth() === 0) {
      // Jan 1: show year
      return format(dt, 'yyyy');
    } else if (dt.getDate() === 1) {
      // First of month: show month and year
      return format(dt, 'MMM yyyy');
    } else {
      // Otherwise, show month/day
      return format(dt, 'MMM d');
    }
  }

  return pageStructure;
}
