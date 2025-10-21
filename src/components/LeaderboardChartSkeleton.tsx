import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import { WindowToggle } from './ui/WindowToggle';
import { ScaleToggle } from './ui/ScaleToggle';

/**
 * Loading skeleton component that matches the structure of LeaderboardChartAndRankings.
 * 
 * Displays placeholder UI elements while data is being fetched.
 */
const LeaderboardChartSkeleton: React.FC = () => {
  // Date presets skeleton (static for now)
  const presets = [
    { label: 'Last 90 days' },
    { label: 'Last 365 days' },
    { label: 'All time' },
  ];

  return (
    <div className="mx-4 sm:mx-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <div>
              <CardTitle className="mb-2">PR Reviews</CardTitle>
              <CardDescription className="text-xs">
                Number of PR reviews by AI code review bots, 7-day rolling
                window.
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
                        className="px-2 py-1 rounded text-xs border border-input bg-background hover:bg-muted transition-colors whitespace-nowrap"
                        disabled
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
                <WindowToggle value="weekly" onChange={() => {}} />
              </div>
              {/* Scale Section */}
              <div className="flex items-center gap-2">
                <ScaleToggle value="linear" onChange={() => {}} />
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs h-7 rounded-full"
                  disabled
                >
                  <ChevronDown className="h-3 w-3" />
                  Metric
                </Button>
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
              PR Reviews
            </span>
          </div>
          <CardDescription className="text-xs">
            There were ... PR reviews by AI code review bots last week.
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
  );
};

export default LeaderboardChartSkeleton;
