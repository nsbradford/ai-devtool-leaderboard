import { getBotReviewsForDay } from '../bigquery';
import { upsertBotReviewsForDate } from '../postgres/bot_reviews_daily_by_repo';

/**
 * Process bot reviews for a single date (updated for schema v3)
 * @param targetDate Date in YYYY-MM-DD format
 * @param botIds Optional array of bot IDs to filter by
 * @returns Promise<void>
 */
export async function processBotReviewsForDate(
  targetDate: string,
  botIds?: number[]
): Promise<void> {
  const botFilter = botIds ? ` (filtering for ${botIds.length} bots)` : '';
  console.log(`Processing bot reviews for date: ${targetDate}${botFilter}`);

  try {
    const botReviews = await getBotReviewsForDay(targetDate, botIds);
    await upsertBotReviewsForDate(botReviews);
    console.log(
      `Successfully processed ${botReviews.length} bot reviews for ${targetDate}${botFilter}`
    );
  } catch (error) {
    console.error(`Error processing bot reviews for ${targetDate}:`, error);
    throw error;
  }
}

/**
 * Get the date string for yesterday in YYYY-MM-DD format
 * @returns string
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}
