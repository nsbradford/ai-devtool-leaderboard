// import { neon } from '@neondatabase/serverless';

// async function migrateSchema() {
//   if (!process.env.DATABASE_URL) {
//     throw new Error('DATABASE_URL environment variable is not set');
//   }
  
//   const sql = neon(process.env.DATABASE_URL);
  
//   try {
//     console.log('Starting schema migration...');
    
//     // Check if old table exists
//     const oldTableExists = await sql`
//       SELECT EXISTS (
//         SELECT FROM information_schema.tables 
//         WHERE table_name = 'leaderboard_snapshots'
//       )
//     `;
    
//     if (!oldTableExists[0].exists) {
//       console.log('Old table does not exist, skipping migration');
//       return;
//     }
    
//     // Create new tables
//     console.log('Creating new tables...');
    
//     await sql`
//       CREATE TABLE IF NOT EXISTS daily_metrics (
//         date DATE PRIMARY KEY,
//         total_active_repos INTEGER NOT NULL,
//         created_at TIMESTAMP DEFAULT NOW(),
//         updated_at TIMESTAMP DEFAULT NOW()
//       )
//     `;
    
//     await sql`
//       CREATE TABLE IF NOT EXISTS tool_metrics (
//         id SERIAL PRIMARY KEY,
//         date DATE NOT NULL,
//         tool VARCHAR(100) NOT NULL,
//         repo_count INTEGER NOT NULL,
//         created_at TIMESTAMP DEFAULT NOW(),
//         updated_at TIMESTAMP DEFAULT NOW(),
//         UNIQUE(date, tool)
//       )
//     `;
    
//     await sql`
//       CREATE TABLE IF NOT EXISTS data_sources (
//         id SERIAL PRIMARY KEY,
//         source_name VARCHAR(100) NOT NULL,
//         last_run_at TIMESTAMP,
//         status VARCHAR(50) DEFAULT 'pending',
//         records_processed INTEGER DEFAULT 0,
//         created_at TIMESTAMP DEFAULT NOW()
//       )
//     `;
    
//     // Create indexes
//     console.log('Creating indexes...');
    
//     await sql`
//       CREATE INDEX IF NOT EXISTS idx_daily_metrics_date 
//       ON daily_metrics(date)
//     `;
    
//     await sql`
//       CREATE INDEX IF NOT EXISTS idx_tool_metrics_date 
//       ON tool_metrics(date)
//     `;
    
//     await sql`
//       CREATE INDEX IF NOT EXISTS idx_tool_metrics_tool 
//       ON tool_metrics(tool)
//     `;
    
//     await sql`
//       CREATE INDEX IF NOT EXISTS idx_tool_metrics_date_tool 
//       ON tool_metrics(date, tool)
//     `;
    
//     // Migrate data from old table to new tables
//     console.log('Migrating data...');
    
//     // First, extract unique daily metrics
//     await sql`
//       INSERT INTO daily_metrics (date, total_active_repos, created_at, updated_at)
//       SELECT DISTINCT 
//         date,
//         total_active_repos,
//         created_at,
//         NOW()
//       FROM leaderboard_snapshots
//       ON CONFLICT (date) DO NOTHING
//     `;
    
//     // Then, extract tool metrics
//     await sql`
//       INSERT INTO tool_metrics (date, tool, repo_count, created_at, updated_at)
//       SELECT 
//         date,
//         tool,
//         repo_count,
//         created_at,
//         NOW()
//       FROM leaderboard_snapshots
//       ON CONFLICT (date, tool) DO NOTHING
//     `;
    
//     // Verify migration
//     const oldCount = await sql`
//       SELECT COUNT(*) as count FROM leaderboard_snapshots
//     `;
    
//     const newToolCount = await sql`
//       SELECT COUNT(*) as count FROM tool_metrics
//     `;
    
//     const newDailyCount = await sql`
//       SELECT COUNT(*) as count FROM daily_metrics
//     `;
    
//     console.log(`Migration completed:`);
//     console.log(`- Old records: ${oldCount[0].count}`);
//     console.log(`- New tool records: ${newToolCount[0].count}`);
//     console.log(`- New daily records: ${newDailyCount[0].count}`);
    
//     // Optional: Drop old table (uncomment if you're confident)
//     // console.log('Dropping old table...');
//     // await sql`DROP TABLE leaderboard_snapshots`;
    
//     console.log('Migration completed successfully!');
    
//   } catch (error) {
//     console.error('Migration failed:', error);
//     throw error;
//   }
// }

// // Run migration if this file is executed directly
// if (require.main === module) {
//   migrateSchema()
//     .then(() => {
//       console.log('Migration script completed');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('Migration script failed:', error);
//       process.exit(1);
//     });
// }

// export { migrateSchema }; 