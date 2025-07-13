CREATE TABLE IF NOT EXISTS active_repos_daily (
  event_date        DATE    PRIMARY KEY,
  active_repo_count INTEGER NOT NULL CHECK (active_repo_count >= 0)
);

CREATE TABLE IF NOT EXISTS bot_reviews_daily (
  event_date  DATE    NOT NULL,
  bot_id      BIGINT  NOT NULL,
  repo_name   TEXT    NOT NULL,
  -- composite key avoids duplicates and gives you a natural clustering order
  PRIMARY KEY (event_date, bot_id, repo_name)
);
