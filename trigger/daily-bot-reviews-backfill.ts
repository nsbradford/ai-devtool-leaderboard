/**
 * Daily scheduled job that backfills AI code review bot adoption data.
 * Runs at 5:00 AM UTC to process yesterday's reviews, refresh aggregated views,
 * and update repository star counts.
 */
import { schedules } from '@trigger.dev/sdk';
import {
  processBotReviewsForDate,
  getYesterdayDateString,
} from '@/lib/backfill/bot-reviews';
import { refreshMaterializedViewsConcurrently } from '@/lib/postgres/bot_reviews_daily_by_repo';
import { backfillStarCounts } from '@/lib/backfill/github-repositories';

export const dailyBotReviewsBackfill = schedules.task({
  id: 'daily-bot-reviews-backfill',
  // 5:00 AM UTC every day (minute hour day month weekday)
  cron: '0 5 * * *',
  run: async (payload) => {
    console.log(`Starting daily bot reviews backfill at ${payload.timestamp}`);
    console.log(`Timezone: ${payload.timezone}`);

    try {
      // Process yesterday's bot reviews (GitHub day boundaries are UTC-based)
      const targetDate = getYesterdayDateString();
      console.log(`Processing bot reviews for ${targetDate}`);

      await processBotReviewsForDate(targetDate);

      // Refresh materialized views so leaderboard/charts reflect new data
      await refreshMaterializedViewsConcurrently();

      // Backfill star counts for up to 10,000 repos (incremental update)
      await backfillStarCounts(10000);

      console.log(
        `Daily bot reviews backfill completed successfully for ${targetDate}`
      );
    } catch (error) {
      console.error('Daily bot reviews backfill failed:', error);
      throw error;
    }
  },
});
