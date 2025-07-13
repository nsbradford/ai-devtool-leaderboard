-- Easier to just keep the data in the json file for now

-- CREATE TABLE IF NOT EXISTS devtools (
--   id bigint PRIMARY KEY,
--   account_login VARCHAR(100) NOT NULL,
--   name VARCHAR(100) NOT NULL,
--   avatar_url VARCHAR(255),
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- INSERT INTO devtools (id, account_login, name, avatar_url)
-- VALUES
--   (65095814 , 'ellipsis-dev[bot]'        , 'ellipsis-dev[bot]'        , 'https://avatars.githubusercontent.com/in/64358?v=4'),
--   (136622811, 'coderabbitai[bot]'        , 'coderabbitai[bot]'        , 'https://avatars.githubusercontent.com/in/347564?v=4'),
--   (165735046, 'greptile-apps[bot]'       , 'greptile-apps[bot]'       , 'https://avatars.githubusercontent.com/in/867647?v=4'),
--   (191113872, 'cubic-dev-ai[bot]'        , 'cubic-dev-ai[bot]'        , 'https://avatars.githubusercontent.com/in/1082092?v=4'),
--   (189301087, 'windsurf-bot[bot]'        , 'windsurf-bot[bot]'        , 'https://avatars.githubusercontent.com/in/1066231?v=4'),
--   (151058649, 'qodo-merge-pro[bot]'      , 'qodo-merge-pro[bot]'      , 'https://avatars.githubusercontent.com/in/484649?v=4'),
--   (96075541 , 'graphite-app[bot]'        , 'graphite-app[bot]'        , 'https://avatars.githubusercontent.com/in/158384?v=4'),
--   (206951365, 'cursor[bot]'              , 'cursor[bot]'              , 'https://avatars.githubusercontent.com/in/1210556?v=4'),
--   (175728472, 'Copilot'                  , 'Copilot'                  , 'https://avatars.githubusercontent.com/in/946600?v=4');
--   (151821869, 'codeant-ai[bot]'                  , 'CodeAnt'                  , 'https://avatars.githubusercontent.com/in/646884?v=4');



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
-- CREATE TABLE IF NOT EXISTS devtools (
--   id bigint PRIMARY KEY,
--   account_login VARCHAR(100) NOT NULL,
--   name VARCHAR(100) NOT NULL,
--   avatar_url VARCHAR(255),
--   created_at TIMESTAMP DEFAULT NOW()
-- );

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