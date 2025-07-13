
CREATE TABLE IF NOT EXISTS daily_metrics (
  date DATE PRIMARY KEY,
  total_active_repos INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_metrics (
  tool_id     bigint      NOT NULL REFERENCES devtools(id),
  record_day  date        NOT NULL,
  repo_count  integer     NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (record_day, tool_id)          -- most queries are on date
);