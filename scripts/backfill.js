const { BigQuery } = require('@google-cloud/bigquery');
const { initializeDatabase, insertSnapshot } = require('../src/lib/database');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
  process.exit(1);
}

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function runQueryForDate(targetDate) {
  const sqlTemplate = fs.readFileSync(path.join(__dirname, '../leaderboard_v2.sql'), 'utf8');
  
  const formattedDate = formatDate(targetDate);
  const lookbackDays = 7;
  const startDate = formatDate(addDays(targetDate, -lookbackDays));
  
  const query = sqlTemplate
    .replace('DECLARE lookback_days  INT64   DEFAULT 7;', `DECLARE lookback_days  INT64   DEFAULT ${lookbackDays};`)
    .replace('DECLARE start_date     DATE    DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY);', 
             `DECLARE start_date     DATE    DEFAULT DATE('${startDate}');`);

  console.log(`Running BigQuery for date: ${formattedDate} (looking back to ${startDate})`);
  
  const [job] = await bigquery.createQueryJob({
    query: query,
    location: 'US',
  });

  const [rows] = await job.getQueryResults();
  
  if (rows.length === 0) {
    console.log(`No data returned for date ${formattedDate}`);
    return;
  }

  const totalActiveRepos = await calculateTotalActiveRepos(startDate, formattedDate);
  
  for (const row of rows) {
    const snapshot = {
      date: formattedDate,
      tool: row.tool,
      repo_count: parseInt(row.repo_count),
      pct_of_active_repos: parseFloat(row.pct_of_active_repos),
      total_active_repos: totalActiveRepos
    };
    
    await insertSnapshot(snapshot);
    console.log(`Inserted: ${snapshot.tool} - ${snapshot.repo_count} repos (${snapshot.pct_of_active_repos}%)`);
  }
}

async function calculateTotalActiveRepos(startDate, endDate) {
  const query = `
    WITH raw_events AS (
      SELECT DISTINCT repo.name AS repo_name
      FROM \`githubarchive.month.*\`
      WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m', DATE('${startDate}'))
                              AND FORMAT_DATE('%Y%m', DATE('${endDate}'))
        AND type = 'PullRequestEvent'
        AND DATE(created_at) >= DATE('${startDate}')
        AND DATE(created_at) <= DATE('${endDate}')
    )
    SELECT COUNT(*) as total_active_repos
    FROM raw_events
  `;

  const [job] = await bigquery.createQueryJob({
    query: query,
    location: 'US',
  });

  const [rows] = await job.getQueryResults();
  return rows.length > 0 ? parseInt(rows[0].total_active_repos) : 0;
}

async function backfillDateRange(startDate, endDate) {
  console.log(`Starting backfill from ${formatDate(startDate)} to ${formatDate(endDate)}`);
  
  await initializeDatabase();
  console.log('Database initialized');

  const currentDate = new Date(startDate);
  const finalDate = new Date(endDate);

  while (currentDate <= finalDate) {
    try {
      await runQueryForDate(new Date(currentDate));
      console.log(`Completed ${formatDate(currentDate)}`);
    } catch (error) {
      console.error(`Error processing ${formatDate(currentDate)}:`, error);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('Backfill completed');
}

async function main() {
  const args = process.argv.slice(2);
  
  let startDate, endDate;
  
  if (args.length === 0) {
    endDate = new Date();
    startDate = addDays(endDate, -7);
  } else if (args.length === 1) {
    const daysBack = parseInt(args[0]);
    if (isNaN(daysBack)) {
      console.error('Usage: npm run backfill [days_back] or npm run backfill [start_date] [end_date]');
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
    console.error('Usage: npm run backfill [days_back] or npm run backfill [start_date] [end_date]');
    process.exit(1);
  }

  await backfillDateRange(startDate, endDate);
}

if (require.main === module) {
  main().catch(console.error);
}
