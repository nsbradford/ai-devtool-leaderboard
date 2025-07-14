import { schedules } from '@trigger.dev/sdk/v3';
import {
  processBotReviewsForDate,
  getYesterdayDateString,
} from '../src/lib/backfill-utils';
import { refreshMaterializedViewsConcurrently } from '@/lib/database';

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

      console.log(
        `Daily bot reviews backfill completed successfully for ${targetDate}`
      );
    } catch (error) {
      console.error('Daily bot reviews backfill failed:', error);
      throw error;
    }
  },
});
