import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import devtools from '../src/devtools.json';
import { processBotReviewsForDate } from '../src/lib/backfill/bot-reviews';
import { refreshMaterializedViewsConcurrently } from '../src/lib/postgres/bot_reviews_daily_by_repo';

dotenv.config({ path: '.env.local' });

if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

/**
 * Get bot IDs for newly added bots (those with "#000000" color)
 * @returns Array of bot IDs
 */
function getNewlyAddedBotIds(): number[] {
  return devtools
    .filter((bot) => bot.brand_color === '#000000')
    .map((bot) => bot.id);
}

/**
 * Semaphore class for controlling concurrency of async operations.
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  /**
   * Create a new Semaphore.
   * @param permits - Maximum number of concurrent operations allowed
   */
  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquire a permit, waiting if none are available.
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release a permit, allowing waiting operations to proceed.
   */
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

/**
 * Format a Date object as YYYY-MM-DD string.
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Add days to a date.
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date object
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Process bot reviews for a single date with semaphore control.
 * @param targetDate - Date to process in YYYY-MM-DD format
 * @param semaphore - Semaphore for controlling concurrency
 * @param botIds - Optional array of bot IDs to filter by
 */
async function processDate(
  targetDate: string,
  semaphore: Semaphore,
  botIds?: number[]
): Promise<void> {
  await semaphore.acquire();

  try {
    await processBotReviewsForDate(targetDate, botIds);
  } catch (error) {
    console.error(`Error processing ${targetDate}:`, error);
    throw error;
  } finally {
    semaphore.release();
  }
}

/**
 * Backfill bot reviews data for a date range with controlled concurrency.
 * 
 * @param startDate - Start date of the range
 * @param endDate - End date of the range (inclusive)
 * @param maxConcurrency - Maximum number of concurrent operations (default: 4)
 * @param botIds - Optional array of bot IDs to filter by
 */
async function backfillBotReviewsDateRange(
  startDate: Date,
  endDate: Date,
  maxConcurrency: number = 4,
  botIds?: number[]
): Promise<void> {
  const botFilter = botIds
    ? ` (filtering for ${botIds.length} newly added bots)`
    : '';
  console.log(
    `Starting bot reviews backfill from ${formatDate(startDate)} to ${formatDate(endDate)}${botFilter}`
  );
  console.log(`Max concurrency: ${maxConcurrency}`);

  if (botIds) {
    console.log(`Newly added bot IDs: ${botIds.join(', ')}`);
  }

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
    const promise = processDate(dateString, semaphore, botIds).catch(
      (error) => {
        console.error(`Failed to process ${dateString}:`, error);
        // Don't re-throw to allow other dates to continue processing
      }
    );
    datePromises.push(promise);
  }

  // Wait for all dates to complete
  await Promise.all(datePromises);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(
    `\nBot reviews backfill completed in ${duration.toFixed(2)} seconds`
  );
  console.log(
    `Average time per date: ${(duration / allDates.length).toFixed(2)} seconds`
  );

  // Refresh materialized views after upsert
  await refreshMaterializedViewsConcurrently();
}

/**
 * Main entry point for the bot reviews backfill script.
 * Parses command-line arguments and orchestrates the backfill process.
 */
async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('days', {
      alias: 'd',
      type: 'number',
      description: 'Number of days to go back from today',
    })
    .option('start', {
      alias: 's',
      type: 'string',
      description: 'Start date (YYYY-MM-DD format)',
    })
    .option('end', {
      alias: 'e',
      type: 'string',
      description: 'End date (YYYY-MM-DD format)',
    })
    .option('concurrency', {
      alias: 'c',
      type: 'number',
      default: 8,
      description: 'Maximum number of concurrent operations (1-10)',
    })
    .option('new-bots-only', {
      alias: 'n',
      type: 'boolean',
      description: 'Only process newly added bots (those with "#000000" color)',
    })
    .help()
    .alias('help', 'h').argv;

  let startDate: Date, endDate: Date;
  let maxConcurrency = argv.concurrency;
  let botIds: number[] | undefined;

  // Get newly added bot IDs if the option is enabled
  if (argv['new-bots-only']) {
    botIds = getNewlyAddedBotIds();
    if (botIds.length === 0) {
      console.log('No newly added bots found (bots with "#000000" color)');
      return;
    }
    console.log(`Found ${botIds.length} newly added bots to process`);
  }

  // Validate concurrency limit
  if (maxConcurrency < 1 || maxConcurrency > 10) {
    console.warn(
      `Concurrency limit ${maxConcurrency} seems extreme. Consider using 1-8 for optimal performance.`
    );
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
  await backfillBotReviewsDateRange(startDate, endDate, maxConcurrency, botIds);
}

if (require.main === module) {
  main().catch(console.error);
}
