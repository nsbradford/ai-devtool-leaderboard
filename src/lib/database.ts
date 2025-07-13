
import { neon } from '@neondatabase/serverless';
import { BotReviewInRepoDate } from '@/types/api';

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

/**
 * Upsert active repos count for a specific date
 * @param targetDate Date in YYYY-MM-DD format
 * @param activeRepoCount Number of active repositories
 * @returns Promise<void>
 */
export async function upsertActiveReposForDate(targetDate: string, activeRepoCount: number): Promise<void> {
  const sql = getSql();
  
  try {
    // First, ensure the active_repos_daily table exists
    await sql(`
      CREATE TABLE IF NOT EXISTS active_repos_daily (
        event_date DATE PRIMARY KEY,
        active_repos_count INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Upsert the active repos count
    const query = `
      INSERT INTO active_repos_daily (event_date, active_repos_count)
      VALUES ($1, $2)
      ON CONFLICT (event_date) 
      DO UPDATE SET 
        active_repos_count = EXCLUDED.active_repos_count,
        updated_at = NOW();
    `;

    await sql(query, [targetDate, activeRepoCount]);
    
    console.log(`Upserted active repos data for ${targetDate}: ${activeRepoCount} repos`);
  } catch (error) {
    console.error(`Failed to upsert active repos for ${targetDate}:`, error);
    throw error;
  }
}

/**
 * Upsert bot review data for a specific date in batches
 * @param botReviews Array of bot review events to upsert
 * @param batchSize Size of each batch (default: 1000)
 * @returns Promise<void>
 */
export async function upsertBotReviewsForDate(botReviews: BotReviewInRepoDate[], batchSize: number = 1000): Promise<void> {
  if (botReviews.length === 0) {
    console.log('No bot reviews to upsert');
    return;
  }

  const sql = getSql();
  const totalRecords = botReviews.length;
  let processedRecords = 0;
  
  try {
    // Process in batches
    for (let i = 0; i < botReviews.length; i += batchSize) {
      const batch = botReviews.slice(i, i + batchSize);
      
      // Build batch upsert query
      const values = batch.map(review => 
        `('${review.event_date}', ${review.bot_id}, '${review.repo_name.replace(/'/g, "''")}')`
      ).join(', ');

      const query = `
        INSERT INTO bot_reviews_daily (event_date, bot_id, repo_name)
        VALUES ${values}
        ON CONFLICT (event_date, bot_id, repo_name) DO NOTHING;
      `;

      await sql(query);
      
      processedRecords += batch.length;
      // console.log(`Upserted batch: ${processedRecords}/${totalRecords} records for ${botReviews[0].event_date}`);
    }
    
    console.log(`Completed upsert of ${totalRecords} bot review records for ${botReviews[0].event_date}`);
  } catch (error) {
    console.error(`Failed to upsert bot reviews for ${botReviews[0].event_date}:`, error);
    throw error;
  }
}
