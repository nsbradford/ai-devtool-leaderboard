"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { LeaderboardData, LeaderboardStats, ToolRanking, DateRange, MaterializedViewType, DevTool } from '@/types/api';
import { ThemeToggle } from '@/components/theme-toggle';
// Removed Collapsible import, using Popover instead

interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: string | number;
}

export default function LeaderboardChart() {
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [devtools, setDevtools] = useState<DevTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2025-03-01',
    endDate: format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  });
  const [viewType, setViewType] = useState<MaterializedViewType>('weekly');
  const [isLogScale, setIsLogScale] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

  // Initialize selected tools when stats data is loaded
  useEffect(() => {
    if (stats && stats.data.tools && Object.keys(stats.data.tools).length > 0) {
      // Initialize with all tools selected
      setSelectedTools(new Set(Object.keys(stats.data.tools)));
    }
  }, [stats]);

  useEffect(() => {
    async function fetchDevtools() {
      try {
        const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
          ? window.location.origin 
          : '';
        const response = await fetch(`${baseUrl}/api/devtools`);
        if (!response.ok) {
          throw new Error('Failed to fetch devtools data');
        }
        const data: DevTool[] = await response.json();
        setDevtools(data);
      } catch (err) {
        console.error('Failed to fetch devtools:', err);
      }
    }

    fetchDevtools();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          viewType: viewType
        });
        
        const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
          ? window.location.origin 
          : '';
        const response = await fetch(`${baseUrl}/api/leaderboard?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data: LeaderboardData = await response.json();
        
        if (data.timestamps.length === 0 || Object.keys(data.tools).length === 0) {
          setStats({
            data
          });
          return;
        }

        setStats({
          data
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange, viewType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading leaderboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!stats) return null;
  if (devtools.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading devtools data...</div>
      </div>
    );
  }

  // Map tool IDs to display names
  const getToolDisplayName = (toolId: string): string => {
    const devtool = devtools.find((dt: DevTool) => dt.id === toolId);
    const displayName = devtool ? devtool.name : `Tool ${toolId}`;
    return displayName;
  };

  // Generate a random color for each tool
  const generateToolColors = (toolIds: string[]): Record<string, string> => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff0088', '#8800ff',
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff',
      '#5f27cd', '#ff6348', '#2ed573', '#ff4757', '#3742fa', '#ffa502', '#ff9f43',
      '#10ac84', '#ee5a24', '#575fcf', '#3c40c6', '#0fbcf9', '#00d2d3', '#54a0ff',
      '#5f27cd', '#ff6348', '#2ed573', '#ff4757', '#3742fa', '#ffa502', '#ff9f43'
    ];
    
    const toolColors: Record<string, string> = {};
    toolIds.forEach((toolId, index) => {
      toolColors[toolId] = colors[index % colors.length];
    });
    
    return toolColors;
  };

  if (stats.data.timestamps.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">AI Code Review Tools Leaderboard</h1>
          <p className="text-muted-foreground">
            7-day rolling view of AI code review tool usage across active GitHub repositories
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">No data available for the selected date range</p>
              <p className="text-sm">
                This could be because:
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• No data has been backfilled yet</li>
                <li>• The database connection is not configured</li>
                <li>• The selected date range has no data</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData: ChartDataPoint[] = stats.data.timestamps
    .map((timestamp, index) => {
      const date = new Date(timestamp * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: stats.data.timestamps.length > 365 ? '2-digit' : undefined
      });
      
      const dataPoint: ChartDataPoint = {
        date,
        timestamp
      };

      Object.entries(stats.data.tools).forEach(([toolId, counts]) => {
        // Only include selected tools (or all if none selected)
        if (selectedTools.size === 0 || selectedTools.has(toolId)) {
          const countsArray = counts as number[];
          const displayName = getToolDisplayName(toolId);
          dataPoint[displayName] = countsArray[index];
        }
      });

      return dataPoint;
    })
    .sort((a, b) => a.timestamp - b.timestamp);




  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-bold mb-2">AI Code Review Tools Leaderboard</h1>
        <p className="text-muted-foreground">
          {viewType === 'weekly' ? '7-day' : '30-day'} rolling view of AI code review tool usage across active GitHub repositories
        </p>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>
            Select the date range for the chart display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Start Date:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(dateRange.startDate), 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(dateRange.startDate)}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">End Date:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(dateRange.endDate), 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(dateRange.endDate)}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">View Type:</label>
              <Button 
                variant={viewType === 'weekly' ? "default" : "outline"}
                onClick={() => setViewType('weekly')}
                className="w-[120px]"
              >
                Weekly
              </Button>
              <Button 
                variant={viewType === 'monthly' ? "default" : "outline"}
                onClick={() => setViewType('monthly')}
                className="w-[120px]"
              >
                Monthly
              </Button>
            </div> */}
            {/* <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Scale:</label>
              <Button 
                variant={isLogScale ? "default" : "outline"}
                onClick={() => setIsLogScale(!isLogScale)}
                className="w-[120px]"
              >
                {isLogScale ? "Logarithmic" : "Linear"}
              </Button>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usage Trends ({viewType === 'weekly' ? '7-Day' : '30-Day'} View)</CardTitle>
              <CardDescription>
                Number of repositories using each AI code review tool
              </CardDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4" />
                  Tools ({selectedTools.size === 0 ? 'All' : selectedTools.size})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0">
                <div className="flex flex-col space-y-3 p-4 border-b rounded-t-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedTools.size === 0 ? 'All tools selected' : `${selectedTools.size} of ${Object.keys(stats.data.tools).length} tools selected`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedTools.size === Object.keys(stats.data.tools).length) {
                          setSelectedTools(new Set()); // Clear all
                        } else {
                          setSelectedTools(new Set(Object.keys(stats.data.tools))); // Select all
                        }
                      }}
                    >
                      {selectedTools.size === Object.keys(stats.data.tools).length ? 'Clear All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {Object.keys(stats.data.tools)
                      .map((toolId) => ({
                        toolId,
                        displayName: getToolDisplayName(toolId),
                        devtool: devtools.find((dt: DevTool) => dt.id === toolId),
                      }))
                      .sort((a, b) => a.displayName.localeCompare(b.displayName))
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
                              <img 
                                src={avatarUrl} 
                                alt={`${displayName} avatar`}
                                className="w-4 h-4 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="text-sm font-medium truncate">{displayName}</span>
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
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Repository Count', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                  scale={isLogScale ? "log" : "linear"}
                  domain={isLogScale ? [1, 'dataMax'] : ['dataMin', 'dataMax']}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {Object.keys(stats.data.tools)
                  .filter(toolId => selectedTools.size === 0 ? false : selectedTools.has(toolId))
                  .map((toolId) => {
                    const toolColors = generateToolColors(Array.from(selectedTools));
                    const displayName = getToolDisplayName(toolId);
                    return (
                      <Line
                        key={toolId}
                        type="monotone"
                        dataKey={displayName}
                        stroke={toolColors[toolId] || "#8884d8"}
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
              const latestIndex = stats.data.timestamps.length - 1;
              const rankings = Object.entries(stats.data.tools)
                .map(([toolId, counts]) => {
                  const countsArray = counts as number[];
                  const currentCount = countsArray[latestIndex] || 0;
                  
                  return {
                    id: toolId,
                    current_count: currentCount
                  };
                })
                .sort((a, b) => b.current_count - a.current_count);

              return rankings.map((tool, index) => {
                const devtool = devtools.find((dt: DevTool) => dt.id === tool.id);
                const avatarUrl = devtool?.avatar_url;
                const displayName = getToolDisplayName(tool.id);
                
                return (
                  <div key={tool.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-muted-foreground min-w-[1.5rem]">
                        {index + 1}
                      </span>
                      {avatarUrl && (
                        <img 
                          src={avatarUrl} 
                          alt={`${displayName} avatar`}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-sm font-medium">{displayName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {tool.current_count.toLocaleString()}
                    </span>
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
