
import { neon } from '@neondatabase/serverless';

export interface Snapshot {
  date: string;
  tool: string;
  repo_count: number;
  pct_of_active_repos: number;
  total_active_repos: number;
}

export interface DailyMetrics {
  date: string;
  total_active_repos: number;
  created_at: string;
  updated_at: string;
}

export interface ToolMetrics {
  date: string;
  tool: string;
  repo_count: number;
  created_at: string;
  updated_at: string;
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
        dm.date::text,
        tm.tool,
        tm.repo_count,
        ROUND(
          (tm.repo_count::DECIMAL / dm.total_active_repos * 100)::DECIMAL, 
          2
        ) AS pct_of_active_repos,
        dm.total_active_repos
      FROM daily_metrics dm
      JOIN tool_metrics tm ON dm.date = tm.date
      WHERE dm.date >= ${startDate} 
        AND dm.date <= ${endDate}
      ORDER BY dm.date, tm.repo_count DESC
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
    
    // Daily metrics table - stores total active repos per day
    await sql`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        date DATE PRIMARY KEY,
        total_active_repos INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Tool metrics table - stores individual tool data per day
    await sql`
      CREATE TABLE IF NOT EXISTS tool_metrics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        tool VARCHAR(100) NOT NULL,
        repo_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(date, tool)
      )
    `;
    
    // Data source tracking table
    // await sql`
    //   CREATE TABLE IF NOT EXISTS data_sources (
    //     id SERIAL PRIMARY KEY,
    //     source_name VARCHAR(100) NOT NULL,
    //     last_run_at TIMESTAMP,
    //     status VARCHAR(50) DEFAULT 'pending',
    //     records_processed INTEGER DEFAULT 0,
    //     created_at TIMESTAMP DEFAULT NOW()
    //   )
    // `;
    
    // Indexes for performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_daily_metrics_date 
      ON daily_metrics(date)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tool_metrics_date 
      ON tool_metrics(date)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tool_metrics_tool 
      ON tool_metrics(tool)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tool_metrics_date_tool 
      ON tool_metrics(date, tool)
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
    
    // Insert/update daily metrics
    await sql`
      INSERT INTO daily_metrics (date, total_active_repos, updated_at)
      VALUES (${snapshot.date}, ${snapshot.total_active_repos}, NOW())
      ON CONFLICT (date) DO UPDATE SET
        total_active_repos = EXCLUDED.total_active_repos,
        updated_at = NOW()
    `;
    
    // Insert/update tool metrics
    await sql`
      INSERT INTO tool_metrics (date, tool, repo_count, updated_at)
      VALUES (${snapshot.date}, ${snapshot.tool}, ${snapshot.repo_count}, NOW())
      ON CONFLICT (date, tool) DO UPDATE SET
        repo_count = EXCLUDED.repo_count,
        updated_at = NOW()
    `;
    
    console.log(`Inserted/updated: ${snapshot.tool} - ${snapshot.repo_count} repos`);
  } catch (error) {
    console.error('Failed to insert snapshot:', error);
    throw error;
  }
}

export async function insertDailyMetrics(date: string, totalActiveRepos: number): Promise<void> {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO daily_metrics (date, total_active_repos, updated_at)
      VALUES (${date}, ${totalActiveRepos}, NOW())
      ON CONFLICT (date) DO UPDATE SET
        total_active_repos = EXCLUDED.total_active_repos,
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('Failed to insert daily metrics:', error);
    throw error;
  }
}

export async function insertToolMetrics(date: string, tool: string, repoCount: number): Promise<void> {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO tool_metrics (date, tool, repo_count, updated_at)
      VALUES (${date}, ${tool}, ${repoCount}, NOW())
      ON CONFLICT (date, tool) DO UPDATE SET
        repo_count = EXCLUDED.repo_count,
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('Failed to insert tool metrics:', error);
    throw error;
  }
}

export async function getLatestDataDate(): Promise<string | null> {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT MAX(date)::text as latest_date
      FROM daily_metrics
    `;
    return result[0]?.latest_date || null;
  } catch (error) {
    console.error('Failed to get latest data date:', error);
    throw error;
  }
}

export async function getToolList(): Promise<string[]> {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT DISTINCT tool
      FROM tool_metrics
      ORDER BY tool
    `;
    return result.map(row => row.tool);
  } catch (error) {
    console.error('Failed to get tool list:', error);
    throw error;
  }
}
