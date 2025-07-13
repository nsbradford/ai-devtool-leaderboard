import { getActiveReposForDay } from '../src/lib/bigquery';
import { upsertActiveReposForDate } from '../src/lib/database';
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
    
    // Fetch active repos count for the date
    const activeRepoCount = await getActiveReposForDay(targetDate);
    
    // Upsert the data
    await upsertActiveReposForDate(targetDate, activeRepoCount);
    
    console.log(`Successfully processed ${targetDate} with ${activeRepoCount} active repos`);
  } catch (error) {
    console.error(`Error processing ${targetDate}:`, error);
    throw error;
  } finally {
    semaphore.release();
  }
}

async function backfillActiveReposDateRange(startDate: Date, endDate: Date, maxConcurrency: number = 4): Promise<void> {
  console.log(`Starting active repos backfill from ${formatDate(startDate)} to ${formatDate(endDate)}`);
  console.log(`Max concurrency: ${maxConcurrency}`);

  const semaphore = new Semaphore(maxConcurrency);
  const currentDate = new Date(startDate);
  const finalDate = new Date(endDate);
  const datePromises: Promise<void>[] = [];
  const allDates: string[] = [];

  // Collect all dates to process
  while (currentDate <= finalDate) {
    allDates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`Total dates to process: ${allDates.length}`);

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
  
  console.log(`\nActive repos backfill completed in ${duration.toFixed(2)} seconds`);
  console.log(`Average time per date: ${(duration / allDates.length).toFixed(2)} seconds`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  let startDate: Date, endDate: Date;
  let maxConcurrency = 4; // Default concurrency limit
  
  if (args.length === 0) {
    // Default to last 7 days
    endDate = new Date();
    startDate = addDays(endDate, -7);
  } else if (args.length === 1) {
    const daysBack = parseInt(args[0]);
    if (isNaN(daysBack)) {
      console.error('Usage: pnpm run backfill-active-repos [days_back] [concurrency] or pnpm run backfill-active-repos [start_date] [end_date] [concurrency]');
      process.exit(1);
    }
    endDate = new Date();
    startDate = addDays(endDate, -daysBack);
  } else if (args.length === 2) {
    // Check if second arg is a number (concurrency) or date
    const secondArg = parseInt(args[1]);
    if (!isNaN(secondArg)) {
      // Format: [days_back] [concurrency]
      const daysBack = parseInt(args[0]);
      if (isNaN(daysBack)) {
        console.error('Usage: pnpm run backfill-active-repos [days_back] [concurrency] or pnpm run backfill-active-repos [start_date] [end_date] [concurrency]');
        process.exit(1);
      }
      endDate = new Date();
      startDate = addDays(endDate, -daysBack);
      maxConcurrency = secondArg;
    } else {
      // Format: [start_date] [end_date]
      startDate = new Date(args[0]);
      endDate = new Date(args[1]);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date format. Use YYYY-MM-DD');
        process.exit(1);
      }
    }
  } else if (args.length === 3) {
    // Format: [start_date] [end_date] [concurrency]
    startDate = new Date(args[0]);
    endDate = new Date(args[1]);
    maxConcurrency = parseInt(args[2]);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(maxConcurrency)) {
      console.error('Invalid format. Use: [start_date] [end_date] [concurrency] where dates are YYYY-MM-DD and concurrency is a number');
      process.exit(1);
    }
  } else {
    console.error('Usage: pnpm run backfill-active-repos [days_back] [concurrency] or pnpm run backfill-active-repos [start_date] [end_date] [concurrency]');
    process.exit(1);
  }

  // Validate concurrency limit
  if (maxConcurrency < 1 || maxConcurrency > 10) {
    console.warn(`Concurrency limit ${maxConcurrency} seems extreme. Consider using 1-8 for optimal performance.`);
  }

  await backfillActiveReposDateRange(startDate, endDate, maxConcurrency);
}

if (require.main === module) {
  main().catch(console.error);
} 