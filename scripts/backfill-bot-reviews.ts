import { getBotReviewsForDay } from '../src/lib/bigquery';
import { upsertBotReviewsForDate } from '../src/lib/database';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

dotenv.config({ path: '.env.local' });

if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Semaphore class for controlling concurrency
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function processDate(targetDate: string, semaphore: Semaphore): Promise<void> {
  await semaphore.acquire();
  
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
    
    // console.log(`Successfully processed ${targetDate}`);
  } catch (error) {
    console.error(`Error processing ${targetDate}:`, error);
    throw error;
  } finally {
    semaphore.release();
  }
}

async function backfillBotReviewsDateRange(startDate: Date, endDate: Date, maxConcurrency: number = 4): Promise<void> {
  console.log(`Starting bot reviews backfill from ${formatDate(startDate)} to ${formatDate(endDate)}`);
  console.log(`Max concurrency: ${maxConcurrency}`);

  const semaphore = new Semaphore(maxConcurrency);
  const finalDate = new Date(endDate);
  const datePromises: Promise<void>[] = [];
  const allDates: string[] = [];

  // Collect all dates to process
  let currentDate = new Date(startDate);
  while (currentDate <= finalDate) {
    allDates.push(formatDate(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  console.log(`Total dates to process: ${allDates.length}`);
  // console.log(`DEBUG: First 5 dates: ${allDates.slice(0, 5).join(', ')}`);
  // console.log(`DEBUG: Last 5 dates: ${allDates.slice(-5).join(', ')}`);

  // Process all dates with controlled concurrency
  const startTime = Date.now();
  
  for (const dateString of allDates) {
    const promise = processDate(dateString, semaphore).catch((error) => {
      console.error(`Failed to process ${dateString}:`, error);
      // Don't re-throw to allow other dates to continue processing
    });
    datePromises.push(promise);
  }

  // Wait for all dates to complete
  await Promise.all(datePromises);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\nBot reviews backfill completed in ${duration.toFixed(2)} seconds`);
  console.log(`Average time per date: ${(duration / allDates.length).toFixed(2)} seconds`);
}

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('days', {
      alias: 'd',
      type: 'number',
      description: 'Number of days to go back from today'
    })
    .option('start', {
      alias: 's',
      type: 'string',
      description: 'Start date (YYYY-MM-DD format)'
    })
    .option('end', {
      alias: 'e',
      type: 'string',
      description: 'End date (YYYY-MM-DD format)'
    })
    .option('concurrency', {
      alias: 'c',
      type: 'number',
      default: 8,
      description: 'Maximum number of concurrent operations (1-10)'
    })
    .help()
    .alias('help', 'h')
    .argv;

  let startDate: Date, endDate: Date;
  let maxConcurrency = argv.concurrency;

  // Validate concurrency limit
  if (maxConcurrency < 1 || maxConcurrency > 10) {
    console.warn(`Concurrency limit ${maxConcurrency} seems extreme. Consider using 1-8 for optimal performance.`);
  }

  if (argv.days) {
    // Use days back from today
    endDate = new Date();
    startDate = addDays(endDate, -argv.days);
  } else if (argv.start && argv.end) {
    // Use specific date range
    startDate = new Date(argv.start);
    endDate = new Date(argv.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date format. Use YYYY-MM-DD');
      process.exit(1);
    }
  } else {
    // Default to last 7 days
    endDate = new Date();
    startDate = addDays(endDate, -7);
  }

  // Debug: Log the parsed dates
  // console.log(`\nDEBUG: Parsed arguments:`);
  // console.log(`  Start date: ${startDate.toISOString()} (${formatDate(startDate)})`);
  // console.log(`  End date: ${endDate.toISOString()} (${formatDate(endDate)})`);
  // console.log(`  Max concurrency: ${maxConcurrency}`);
  await backfillBotReviewsDateRange(startDate, endDate, maxConcurrency);
}

if (require.main === module) {
  main().catch(console.error);
} 