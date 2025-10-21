-- copywrite 2025 anysphere inc

/* -----------------------------------------------------------------
   One row per GitHub repository (full “owner/name” string)
   ----------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS github_repositories (
  node_id     TEXT        PRIMARY KEY,
  database_id BIGINT      NOT NULL,
  full_name   TEXT        NOT NULL,                         -- e.g. "vercel/next.js"
  star_count  INTEGER     NOT NULL CHECK (star_count >= 0),    -- latest stargazer tally
  is_error    BOOLEAN     NOT NULL DEFAULT false,              -- true if fetch failed (probably deleted repo)
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()              -- last refresh
);

/* -----------------------------------------------------------------
   Core data
   ----------------------------------------------------------------- */
-- we track # of reviews by repo to allow summing total number of reviews by bot.
CREATE TABLE IF NOT EXISTS bot_reviews_daily_by_repo (
  event_date    DATE    NOT NULL,
  bot_id        BIGINT  NOT NULL,
  repo_node_id  TEXT    NOT NULL, -- no FK to github_repositories because we use this data to know what repos to populate later.
  -- repo_db_id    BIGINT  NOT NULL,
  bot_review_count INTEGER NOT NULL,
  PRIMARY KEY (event_date, bot_id, repo_node_id)
);

-- we don't track # of reviews in the user table because it's a much larger table.
CREATE TABLE IF NOT EXISTS bot_reviews_daily_by_user (
  event_date  DATE    NOT NULL,
  bot_id      BIGINT  NOT NULL,
  user_id     BIGINT  NOT NULL,
  PRIMARY KEY (event_date, bot_id, user_id)
);


/* -----------------------------------------------------------------
   Materialized views for repo data
   ----------------------------------------------------------------- */
CREATE MATERIALIZED VIEW mv_bot_reviews_repo_7d AS
WITH calendar AS (
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily_by_repo),
           (SELECT MAX(event_date) FROM bot_reviews_daily_by_repo),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  br.bot_id,
  COUNT(DISTINCT br.repo_node_id) AS repo_count
FROM calendar c
JOIN bot_reviews_daily_by_repo br
  ON br.event_date BETWEEN c.event_date - INTERVAL '6 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id;

-- Needed only if you want CONCURRENTLY refreshes (highly recommended):
CREATE UNIQUE INDEX mv_bot_reviews_repo_7d_pk
  ON mv_bot_reviews_repo_7d (event_date, bot_id);



CREATE MATERIALIZED VIEW mv_bot_reviews_repo_30d AS
WITH calendar AS (
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily_by_repo),
           (SELECT MAX(event_date) FROM bot_reviews_daily_by_repo),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  br.bot_id,
  COUNT(DISTINCT br.repo_node_id) AS repo_count    -- absolute, 30-day window
FROM calendar c
JOIN bot_reviews_daily_by_repo br
  ON br.event_date BETWEEN c.event_date - INTERVAL '29 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id;

-- Needed only if you want CONCURRENTLY refreshes (highly recommended):
CREATE UNIQUE INDEX mv_bot_reviews_repo_30d_pk
  ON mv_bot_reviews_repo_30d (event_date, bot_id);


/* -----------------------------------------------------------------
   Materialized views for user data
   ----------------------------------------------------------------- */
CREATE MATERIALIZED VIEW mv_bot_reviews_user_7d AS
WITH calendar AS (
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily_by_user),
           (SELECT MAX(event_date) FROM bot_reviews_daily_by_user),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  bu.bot_id,
  COUNT(DISTINCT bu.user_id) AS user_count
FROM calendar c
JOIN bot_reviews_daily_by_user bu
  ON bu.event_date BETWEEN c.event_date - INTERVAL '6 days'
                      AND     c.event_date
GROUP BY c.event_date, bu.bot_id;

CREATE UNIQUE INDEX mv_bot_reviews_user_7d_pk
  ON mv_bot_reviews_user_7d (event_date, bot_id);


CREATE MATERIALIZED VIEW mv_bot_reviews_user_30d AS
WITH calendar AS (
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily_by_user),
           (SELECT MAX(event_date) FROM bot_reviews_daily_by_user),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  bu.bot_id,
  COUNT(DISTINCT bu.user_id) AS user_count
FROM calendar c
JOIN bot_reviews_daily_by_user bu
  ON bu.event_date BETWEEN c.event_date - INTERVAL '29 days'
                      AND     c.event_date
GROUP BY c.event_date, bu.bot_id;

CREATE UNIQUE INDEX mv_bot_reviews_user_30d_pk
  ON mv_bot_reviews_user_30d (event_date, bot_id);

