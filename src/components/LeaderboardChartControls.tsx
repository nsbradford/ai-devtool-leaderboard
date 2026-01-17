import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScaleToggle } from '@/components/ui/ScaleToggle';
import { WindowToggle } from '@/components/ui/WindowToggle';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import type { LeaderboardData, MaterializedViewType } from '@/types/api';
import Image from 'next/image';
import React from 'react';
import { DevTool } from '@/types/api';

interface LeaderboardChartControlsProps {
  displayDateRange: { startDate: string; endDate: string };
  setDisplayDateRange: (range: { startDate: string; endDate: string }) => void;
  datePickerOpen: boolean;
  setDatePickerOpen: (open: boolean) => void;
  presets: {
    label: string;
    getRange: () => { startDate: string; endDate: string };
  }[];
  viewType: MaterializedViewType;
  setViewType: (v: MaterializedViewType) => void;
  scaleType: 'linear' | 'log';
  setScaleType: (v: 'linear' | 'log') => void;
  selectedTools: Set<number>;
  setSelectedTools: (s: Set<number>) => void;
  toolSearchQuery: string;
  setToolSearchQuery: (q: string) => void;
  stats: LeaderboardData;
  devtools: DevTool[];
  metric: 'active_repos' | 'pr_reviews';
  setMetric: (m: 'active_repos' | 'pr_reviews') => void;
  METRIC_OPTIONS: { value: string; label: string }[];
}

export function LeaderboardChartControls({
  displayDateRange,
  setDisplayDateRange,
  datePickerOpen,
  setDatePickerOpen,
  presets,
  viewType,
  setViewType,
  scaleType,
  setScaleType,
  selectedTools,
  setSelectedTools,
  toolSearchQuery,
  setToolSearchQuery,
  stats,
  devtools,
  metric,
  setMetric,
  METRIC_OPTIONS,
}: LeaderboardChartControlsProps) {
  // Helper for tool display name
  const getToolDisplayName = (toolId: number): string => {
    const devtool = devtools.find((dt) => dt.id === toolId);
    return devtool ? devtool.name : `Tool ${toolId}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
      {/* Time Scope Section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="flex gap-1 overflow-x-auto">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`px-2 py-1 rounded text-xs border border-input bg-background hover:bg-muted transition-colors whitespace-nowrap ${
                  displayDateRange.startDate === preset.getRange().startDate &&
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
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <Calendar className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium">Start Date</label>
                    <input
                      type="date"
                      value={displayDateRange.startDate}
                      onChange={(e) =>
                        setDisplayDateRange({
                          ...displayDateRange,
                          startDate: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium">End Date</label>
                    <input
                      type="date"
                      value={displayDateRange.endDate}
                      onChange={(e) =>
                        setDisplayDateRange({
                          ...displayDateRange,
                          endDate: e.target.value,
                        })
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs h-7 rounded-full"
            >
              <ChevronDown className="h-3 w-3" />
              Series ({selectedTools.size === 0 ? 'All' : selectedTools.size})
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
                      selectedTools.size === Object.keys(stats.tools).length
                    ) {
                      setSelectedTools(new Set());
                    } else if (stats) {
                      setSelectedTools(
                        new Set(Object.keys(stats.tools).map(Number))
                      );
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
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={toolSearchQuery}
                  onChange={(e) => setToolSearchQuery(e.target.value)}
                  className="w-full px-2 py-1 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {Object.keys(stats?.tools || {})
                    .map((toolIdStr) => {
                      const toolId = Number(toolIdStr);
                      return {
                        toolId,
                        displayName: getToolDisplayName(toolId),
                        devtool: devtools.find((dt) => dt.id === toolId),
                      };
                    })
                    .filter(({ displayName }) =>
                      displayName
                        .toLowerCase()
                        .includes(toolSearchQuery.toLowerCase())
                    )
                    .sort((a, b) => a.displayName.localeCompare(b.displayName))
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
                              width={12}
                              height={12}
                              className="w-3 h-3 rounded-full"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
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
              {METRIC_OPTIONS.find((opt) => opt.value === metric)?.label ||
                'Metric'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-0">
            <div className="flex flex-col">
              {METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`px-3 py-2 text-left text-xs hover:bg-muted ${
                    metric === opt.value ? 'bg-primary/10 font-semibold' : ''
                  }`}
                  onClick={() =>
                    setMetric(opt.value as 'active_repos' | 'pr_reviews')
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
  );
}
