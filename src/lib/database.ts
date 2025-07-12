
import { neon } from '@neondatabase/serverless';

export interface Snapshot {
  date: string;
  tool: string;
  repo_count: number;
  pct_of_active_repos: number;
  total_active_repos: number;
}

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

export async function getSnapshotsInDateRange(startDate: string, endDate: string): Promise<Snapshot[]> {
  try {
    console.log(`Getting snapshots from ${startDate} to ${endDate}`);
    
    const sql = getSql();
    const snapshots = await sql`
      SELECT 
        date::text,
        tool,
        repo_count,
        pct_of_active_repos,
        total_active_repos
      FROM leaderboard_snapshots 
      WHERE date >= ${startDate} 
        AND date <= ${endDate}
      ORDER BY date, tool
    `;
    
    return snapshots as Snapshot[];
  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database schema...');
    
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        tool VARCHAR(100) NOT NULL,
        repo_count INTEGER NOT NULL,
        pct_of_active_repos DECIMAL(5,2) NOT NULL,
        total_active_repos INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(date, tool)
      )
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_date 
      ON leaderboard_snapshots(date)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_tool 
      ON leaderboard_snapshots(tool)
    `;
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export async function insertSnapshot(snapshot: Snapshot): Promise<void> {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO leaderboard_snapshots (date, tool, repo_count, pct_of_active_repos, total_active_repos)
      VALUES (${snapshot.date}, ${snapshot.tool}, ${snapshot.repo_count}, ${snapshot.pct_of_active_repos}, ${snapshot.total_active_repos})
      ON CONFLICT (date, tool) DO UPDATE SET
        repo_count = EXCLUDED.repo_count,
        pct_of_active_repos = EXCLUDED.pct_of_active_repos,
        total_active_repos = EXCLUDED.total_active_repos,
        created_at = NOW()
    `;
    
    console.log(`Inserted/updated: ${snapshot.tool} - ${snapshot.repo_count} repos (${snapshot.pct_of_active_repos}%)`);
  } catch (error) {
    console.error('Failed to insert snapshot:', error);
    throw error;
  }
}
