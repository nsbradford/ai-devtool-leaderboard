import { processRepoDataUpdates } from '../src/lib/backfill-utils';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

dotenv.config({ path: '.env.local' });

async function backfillRepoData(
  repos: number,
  daysBack: number = 30,
  maxAgeDays: number = 7
): Promise<void> {
  console.log(
    `Starting repo data backfill for ${repos} repos from last ${daysBack} days`
  );
  console.log(`Max age for existing repo data: ${maxAgeDays} days`);

  const startTime = Date.now();

  try {
    // Get all repos needing data updates
    const { getReposNeedingUpdates } = await import('../src/lib/database');
    const allRepos: string[] = await getReposNeedingUpdates(
      daysBack,
      maxAgeDays,
      repos
    );
    if (allRepos.length === 0) {
      console.log('No repos found needing data updates');
      return;
    }
    console.log(`Found ${allRepos.length} repos needing data updates`);

    // Process in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < allRepos.length; i += chunkSize) {
      const batch = allRepos.slice(i, i + chunkSize);
      console.log(
        `\nProcessing chunk ${Math.floor(i / chunkSize) + 1} (${batch.length} repos)...`
      );
      // Call processRepoDataUpdates for this batch
      await processRepoDataUpdates(daysBack, maxAgeDays, batch.length);
      // Wait 6 seconds between chunks, except after the last chunk
      if (i + chunkSize < allRepos.length) {
        console.log('Waiting 6 seconds before next chunk...');
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
    }
  } catch (error) {
    console.error('Error during repo data backfill:', error);
    throw error;
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log(
    `\nRepo data backfill completed in ${duration.toFixed(2)} seconds`
  );
}

async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('repos', {
      alias: 'r',
      type: 'number',
      description: 'Number of repos to process',
      demandOption: true,
    })
    .option('days-back', {
      alias: 'd',
      type: 'number',
      default: 30,
      description: 'Number of days to look back for repos (default: 30)',
    })
    .option('max-age', {
      alias: 'a',
      type: 'number',
      default: 7,
      description:
        'Maximum age of existing star count entries in days (default: 7)',
    })
    .help()
    .alias('help', 'h').argv;

  const { repos, 'days-back': daysBack, 'max-age': maxAgeDays } = argv;

  // Validate inputs
  if (repos <= 0) {
    console.error('Number of repos must be greater than 0');
    process.exit(1);
  }

  if (daysBack <= 0) {
    console.error('Days back must be greater than 0');
    process.exit(1);
  }

  if (maxAgeDays < 0) {
    console.error('Max age days must be 0 or greater');
    process.exit(1);
  }

  console.log(`\nBackfill Repo Data Configuration:`);
  console.log(`  Number of repos: ${repos}`);
  console.log(`  Days back: ${daysBack}`);
  console.log(`  Max age days: ${maxAgeDays}`);

  await backfillRepoData(repos, daysBack, maxAgeDays);
}

if (require.main === module) {
  main().catch(console.error);
}
