// copywrite 2025 anysphere inc
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Star, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { formatStarCount } from '@/lib/utils';
import { DevTool, TopReposByDevtool } from '@/types/api';
import React, { useState } from 'react';

interface RankingItem {
  id: number;
  current_count: number;
}

interface LeaderboardRankingsProps {
  rankings: RankingItem[];
  devtools: DevTool[];
  topRepos: TopReposByDevtool | undefined;
  getToolDisplayName: (toolId: number) => string;
  getToolWebsiteUrl: (toolId: number) => string | undefined;
  chartTitle: string;
  metric: 'active_repos' | 'pr_reviews';
  activeReposMonthly: string;
}

export function LeaderboardRankings({
  rankings,
  devtools,
  topRepos,
  getToolDisplayName,
  getToolWebsiteUrl,
  chartTitle,
  metric,
  activeReposMonthly,
}: LeaderboardRankingsProps) {
  const [openRepoPopover, setOpenRepoPopover] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="">Current Rankings</CardTitle>
          <span className="text-xs text-muted-foreground pr-2">
            {chartTitle}
          </span>
        </div>
        <CardDescription className="text-xs">
          {metric === 'pr_reviews'
            ? 'Total PR reviews by bot in the selected window.'
            : `There were ${activeReposMonthly} public repos with pull requests last month.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {rankings.map((tool, index) => {
            const devtool = devtools.find((dt) => dt.id === tool.id);
            const avatarUrl = devtool?.avatar_url;
            const displayName = getToolDisplayName(tool.id);
            const websiteUrl = getToolWebsiteUrl(tool.id);
            return (
              <div
                key={tool.id}
                className="flex flex-col p-2 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 pl-2">
                    <span className="text-xs font-bold text-muted-foreground min-w-[1.0rem]">
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
                      <span className="text-sm font-medium">{displayName}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {tool.current_count.toLocaleString()}
                    </span>
                    {/* Mobile toggle button */}
                    {topRepos &&
                      topRepos[tool.id.toString()] &&
                      topRepos[tool.id.toString()].length > 0 && (
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
                                {topRepos[tool.id.toString()].map((repo) => (
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
                  topRepos[tool.id.toString()] &&
                  topRepos[tool.id.toString()].length > 0 && (
                    <div className="mt-1 ml-8 flex-wrap gap-1 text-xs text-muted-foreground hidden md:flex">
                      {topRepos[tool.id.toString()]
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
                            {repoIndex < 2 &&
                              repoIndex <
                                topRepos[tool.id.toString()].length - 1 && (
                                <span className="mx-1">•</span>
                              )}
                          </span>
                        ))}
                      {topRepos[tool.id.toString()].length > 3 && (
                        <span className="mx-1">
                          •
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="ml-1 hover:text-blue-600 hover:underline transition-colors cursor-pointer">
                                see more
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0">
                              <div className="p-3">
                                <div className="text-xs font-medium mb-2">
                                  Top Repositories
                                </div>
                                <div className="space-y-2">
                                  {topRepos[tool.id.toString()].map((repo) => (
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
                        </span>
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
