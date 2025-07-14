import { getBotReviewsForDay } from './bigquery';
import { upsertBotReviewsForDate } from './database';

/**
 * Process bot reviews for a single date
 * @param targetDate Date in YYYY-MM-DD format
 * @returns Promise<void>
 */
export async function processBotReviewsForDate(
  targetDate: string
): Promise<void> {
  console.log(`Processing bot reviews for date: ${targetDate}`);

  try {
    const botReviews = await getBotReviewsForDay(targetDate);

    if (botReviews.length === 0) {
      console.log(`No bot reviews found for ${targetDate}`);
      return;
    }

    await upsertBotReviewsForDate(botReviews);

    console.log(
      `Successfully processed ${botReviews.length} bot reviews for ${targetDate}`
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
