import { getBotReviewsForDay } from '../src/lib/bigquery';
import { upsertBotReviewsForDate } from '../src/lib/database';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function processDate(targetDate: string): Promise<void> {
  try {
    console.log(`\nProcessing date: ${targetDate}`);
    
    // Fetch bot reviews for the date
    const botReviews = await getBotReviewsForDay(targetDate);
    
    if (botReviews.length === 0) {
      console.log(`No bot reviews found for ${targetDate}`);
      return;
    }
    
    // Upsert the data
    await upsertBotReviewsForDate(botReviews);
    
    console.log(`Successfully processed ${targetDate}`);
  } catch (error) {
    console.error(`Error processing ${targetDate}:`, error);
    throw error;
  }
}

async function backfillBotReviewsDateRange(startDate: Date, endDate: Date): Promise<void> {
  console.log(`Starting bot reviews backfill from ${formatDate(startDate)} to ${formatDate(endDate)}`);

  const currentDate = new Date(startDate);
  const finalDate = new Date(endDate);

  while (currentDate <= finalDate) {
    const dateString = formatDate(currentDate);
    
    try {
      await processDate(dateString);
    } catch (error) {
      console.error(`Failed to process ${dateString}:`, error);
      // Continue with next date even if one fails
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('\nBot reviews backfill completed');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  let startDate: Date, endDate: Date;
  
  if (args.length === 0) {
    // Default to last 7 days
    endDate = new Date();
    startDate = addDays(endDate, -7);
  } else if (args.length === 1) {
    const daysBack = parseInt(args[0]);
    if (isNaN(daysBack)) {
      console.error('Usage: pnpm run backfill-bot-reviews [days_back] or pnpm run backfill-bot-reviews [start_date] [end_date]');
      process.exit(1);
    }
    endDate = new Date();
    startDate = addDays(endDate, -daysBack);
  } else if (args.length === 2) {
    startDate = new Date(args[0]);
    endDate = new Date(args[1]);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date format. Use YYYY-MM-DD');
      process.exit(1);
    }
  } else {
    console.error('Usage: pnpm run backfill-bot-reviews [days_back] or pnpm run backfill-bot-reviews [start_date] [end_date]');
    process.exit(1);
  }

  await backfillBotReviewsDateRange(startDate, endDate);
}

if (require.main === module) {
  main().catch(console.error);
} 