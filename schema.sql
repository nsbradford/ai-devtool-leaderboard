-- AI Dev Tool Leaderboard Database Schema
-- This schema is designed for tracking AI development tool usage across GitHub repositories

-- Daily metrics table - stores total active repositories per day
-- This is the denominator for calculating percentages
CREATE TABLE IF NOT EXISTS daily_metrics (
  date DATE PRIMARY KEY,
  total_active_repos INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tool metrics table - stores individual tool data per day
-- Each row represents one tool's usage on one specific date
CREATE TABLE IF NOT EXISTS tool_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  tool VARCHAR(100) NOT NULL,
  repo_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, tool)
);

-- Data source tracking table - for monitoring data pipeline health
CREATE TABLE IF NOT EXISTS data_sources (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(100) NOT NULL,
  last_run_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date 
ON daily_metrics(date);

CREATE INDEX IF NOT EXISTS idx_tool_metrics_date 
ON tool_metrics(date);

CREATE INDEX IF NOT EXISTS idx_tool_metrics_tool 
ON tool_metrics(tool);

CREATE INDEX IF NOT EXISTS idx_tool_metrics_date_tool 
ON tool_metrics(date, tool);

-- Example queries for common use cases:

-- 1. Get leaderboard data for a date range (with calculated percentages)
-- SELECT 
--   dm.date::text,
--   tm.tool,
--   tm.repo_count,
--   ROUND(
--     (tm.repo_count::DECIMAL / dm.total_active_repos * 100)::DECIMAL, 
--     2
--   ) AS pct_of_active_repos,
--   dm.total_active_repos
-- FROM daily_metrics dm
-- JOIN tool_metrics tm ON dm.date = tm.date
-- WHERE dm.date >= '2024-01-01' AND dm.date <= '2024-01-07'
-- ORDER BY dm.date, tm.repo_count DESC;

-- 2. Get latest data date
-- SELECT MAX(date)::text as latest_date FROM daily_metrics;

-- 3. Get list of all tools
-- SELECT DISTINCT tool FROM tool_metrics ORDER BY tool;

-- 4. Get tool growth over time
-- SELECT 
--   date::text,
--   tool,
--   repo_count,
--   LAG(repo_count) OVER (PARTITION BY tool ORDER BY date) as prev_count,
--   repo_count - LAG(repo_count) OVER (PARTITION BY tool ORDER BY date) as growth
-- FROM tool_metrics
-- WHERE date >= '2024-01-01'
-- ORDER BY tool, date;

-- 5. Get top tools by total repos across date range
-- SELECT 
--   tool,
--   SUM(repo_count) as total_repos,
--   AVG(repo_count) as avg_daily_repos
-- FROM tool_metrics
-- WHERE date >= '2024-01-01' AND date <= '2024-01-07'
-- GROUP BY tool
-- ORDER BY total_repos DESC; 