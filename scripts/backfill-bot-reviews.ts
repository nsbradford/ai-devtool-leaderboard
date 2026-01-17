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

function formatDuration(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) {
    return '--:--:--';
  }
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

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

  // Process all dates with controlled concurrency
  const startTime = Date.now();
  const totalDates = allDates.length;
  let completed = 0;
  let failed = 0;
  const barWidth = 30;
  const updateProgress = (): void => {
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const progress = totalDates === 0 ? 1 : completed / totalDates;
    const filled = Math.round(progress * barWidth);
    const bar = `${'#'.repeat(filled)}${'-'.repeat(barWidth - filled)}`;
    const percent = Math.round(progress * 100);
    const rate =
      elapsedSeconds > 0 ? (completed / elapsedSeconds).toFixed(2) : '0.00';
    const remaining = totalDates - completed;
    const etaSeconds =
      elapsedSeconds > 0 && completed > 0
        ? (remaining / completed) * elapsedSeconds
        : Number.POSITIVE_INFINITY;
    process.stdout.write(
      `\r[${bar}] ${percent}% (${completed}/${totalDates}) failed: ${failed} | rate: ${rate}/s | ETA: ${formatDuration(etaSeconds)}`
    );
  };
  updateProgress();

  for (const dateString of allDates) {
    const promise = processDate(dateString, semaphore, botIds).catch(
      (error) => {
        failed += 1;
        process.stdout.write('\r');
        console.error(`Failed to process ${dateString}:`, error);
        updateProgress();
      }
    );
    promise.finally(() => {
      completed += 1;
      updateProgress();
    });
    datePromises.push(promise);
  }

  // Wait for all dates to complete
  await Promise.all(datePromises);
  process.stdout.write('\n');

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
