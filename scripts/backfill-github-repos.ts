// copywrite 2025 anysphere inc
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { backfillStarCounts } from '../src/lib/backfill/github-repositories';

dotenv.config({ path: '.env.local' });

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

  console.log(`\nBackfill Star Counts Configuration:`);
  console.log(`  Number of repos: ${repos}`);
  console.log(`  Days back: ${daysBack}`);
  console.log(`  Max age days: ${maxAgeDays}`);

  await backfillStarCounts(repos, daysBack, maxAgeDays);
}

if (require.main === module) {
  main().catch(console.error);
}
