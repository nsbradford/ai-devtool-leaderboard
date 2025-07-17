import { schedules } from '@trigger.dev/sdk/v3';
import {
  processBotReviewsForDate,
  getYesterdayDateString,
} from '@/lib/backfill/bot-reviews';
import { refreshMaterializedViewsConcurrently } from '@/lib/postgres/bot_reviews_daily_by_repo';
import { backfillStarCounts } from '@/lib/backfill/github-repositories';

export const dailyBotReviewsBackfill = schedules.task({
  id: 'daily-bot-reviews-backfill',
  cron: '0 5 * * *',
  run: async (payload) => {
    console.log(`Starting daily bot reviews backfill at ${payload.timestamp}`);
    console.log(`Timezone: ${payload.timezone}`);

    try {
      const targetDate = getYesterdayDateString();
      console.log(`Processing bot reviews for ${targetDate}`);

      await processBotReviewsForDate(targetDate);

      // Refresh materialized views after upsert
      await refreshMaterializedViewsConcurrently();

      // Backfill star counts for 10,000 repos
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
