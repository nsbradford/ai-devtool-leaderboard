"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { LeaderboardData, LeaderboardStats, ToolRanking, DateRange } from '@/types/api';
import { ThemeToggle } from '@/components/theme-toggle';

const TOOL_COLORS = {
  "coderabbitai[bot]": "#8884d8",
  "ellipsis-dev[bot]": "#82ca9d", 
  "github-actions[bot]": "#ffc658",
  "dependabot[bot]": "#ff7300",
  "codecov[bot]": "#00ff88",
  "sonarcloud[bot]": "#ff0088",
  "renovate[bot]": "#8800ff"
};

interface ChartDataPoint {
  date: string;
  timestamp: number;
  [key: string]: string | number;
}

export default function LeaderboardChart() {
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        
        const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
          ? window.location.origin 
          : '';
        const response = await fetch(`${baseUrl}/api/leaderboard?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data: LeaderboardData = await response.json();
        
        if (data.active_repos.length === 0 || Object.keys(data.tools).length === 0) {
          setStats({
            total_active_repos: 0,
            rankings: [],
            data
          });
          return;
        }
        
        const latestIndex = data.active_repos.length - 1;
        const totalActiveRepos = data.active_repos[latestIndex] || 0;
        
        const rankings: ToolRanking[] = Object.entries(data.tools)
          .map(([name, counts]) => {
            const countsArray = counts as number[];
            const currentCount = countsArray[latestIndex] || 0;
            const percentage = totalActiveRepos > 0 ? (currentCount / totalActiveRepos) * 100 : 0;
            const previousCount = countsArray[latestIndex - 1] || currentCount;
            
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (currentCount > previousCount) trend = 'up';
            else if (currentCount < previousCount) trend = 'down';
            
            return {
              name,
              current_count: currentCount,
              percentage,
              trend
            };
          })
          .sort((a, b) => b.current_count - a.current_count);

        setStats({
          total_active_repos: totalActiveRepos,
          rankings,
          data
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

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

  const chartData: ChartDataPoint[] = stats.data.timestamps.map((timestamp, index) => {
    const date = new Date(timestamp * 1000).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: stats.data.timestamps.length > 365 ? '2-digit' : undefined
    });
    
    const dataPoint: ChartDataPoint = {
      date,
      timestamp,
      active_repos: stats.data.active_repos[index]
    };

    Object.entries(stats.data.tools).forEach(([toolName, counts]) => {
      const countsArray = counts as number[];
      const activeRepos = stats.data.active_repos[index];
      const percentage = activeRepos > 0 ? (countsArray[index] / activeRepos) * 100 : 0;
      dataPoint[`${toolName}_pct`] = parseFloat(percentage.toFixed(1));
      dataPoint[toolName] = countsArray[index];
    });

    return dataPoint;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-bold mb-2">AI Code Review Tools Leaderboard</h1>
        <p className="text-muted-foreground">
          7-day rolling view of AI code review tool usage across active GitHub repositories
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
          </div>
        </CardContent>
      </Card>

      {/* Rankings Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Rankings</CardTitle>
          <CardDescription>
            Based on {stats.total_active_repos.toLocaleString()} active repositories (had a PR review in the last week)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">#</th>
                  <th className="text-left py-2 px-4 font-medium">Tool</th>
                  <th className="text-right py-2 px-4 font-medium">Repositories</th>
                  <th className="text-right py-2 px-4 font-medium">Percentage</th>
                  <th className="text-center py-2 px-4 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {stats.rankings.map((tool, index) => (
                  <tr key={tool.name} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-bold text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {tool.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tool.current_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tool.percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm font-medium ${
                        tool.trend === 'up' ? 'text-green-600' : 
                        tool.trend === 'down' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {tool.trend === 'up' ? '↗' : tool.trend === 'down' ? '↘' : '→'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends (7-Day View)</CardTitle>
          <CardDescription>
            Percentage of active repositories using each AI code review tool
          </CardDescription>
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
                  label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name.replace('_pct', '')
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {Object.keys(stats.data.tools).map((toolName) => (
                  <Line
                    key={toolName}
                    type="monotone"
                    dataKey={`${toolName}_pct`}
                    stroke={TOOL_COLORS[toolName as keyof typeof TOOL_COLORS] || "#8884d8"}
                    strokeWidth={2}
                    name={toolName}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Absolute Numbers Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Absolute Usage Numbers</CardTitle>
          <CardDescription>
            Number of repositories using each AI code review tool
          </CardDescription>
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
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {Object.keys(stats.data.tools).map((toolName) => (
                  <Line
                    key={toolName}
                    type="monotone"
                    dataKey={toolName}
                    stroke={TOOL_COLORS[toolName as keyof typeof TOOL_COLORS] || "#8884d8"}
                    strokeWidth={2}
                    name={toolName}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
