-- Copyright 2025 Anysphere Inc.
/* -----------------------------------------------------------------
   One row per GitHub repository (full "owner/name" string)
   ----------------------------------------------------------------- */

-- graphql doesn't allow fetching by database_id, and BigQuery doesn't include node_id.
-- So, we track our GraphQL fetches (by full_name) in this table, and coalesce later.
CREATE TABLE IF NOT EXISTS github_repositories_by_name (
  full_name   TEXT        PRIMARY KEY,                         -- e.g. "vercel/next.js"
  node_id     TEXT        ,
  database_id BIGINT      ,
  star_count  INTEGER     ,    -- latest stargazer tally
  is_error    BOOLEAN     NOT NULL DEFAULT false,              -- true if star count fetch failed
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()              -- last refresh
);


/* -----------------------------------------------------------------
   Core data
   ----------------------------------------------------------------- */
-- we track # of reviews by repo to allow summing total number of reviews by bot.
CREATE TABLE IF NOT EXISTS bot_reviews_daily_by_repo (
  event_date    DATE    NOT NULL,
  bot_id        BIGINT  NOT NULL,
  repo_db_id    BIGINT  NOT NULL, -- no FK to github_repositories because we use this data to know what repos to populate later.
  repo_full_name TEXT NOT NULL, -- e.g. "vercel/next.js"
  bot_review_count INTEGER NOT NULL, -- number of reviews by the bot
  pr_count        INTEGER NOT NULL, -- number of unique PRs reviewed by the bot
  PRIMARY KEY (event_date, bot_id, repo_db_id)
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
  COUNT(DISTINCT br.repo_db_id) AS repo_count
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
  COUNT(DISTINCT br.repo_db_id) AS repo_count    -- absolute, 30-day window
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


/* -----------------------------------------------------------------
   Materialized views for rolling review counts (per bot)
   ----------------------------------------------------------------- */

-- 7-day rolling window: total reviews
CREATE MATERIALIZED VIEW mv_bot_reviews_stats_7d AS
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
  SUM(br.bot_review_count) AS review_count_7d
FROM calendar c
JOIN bot_reviews_daily_by_repo br
  ON br.event_date BETWEEN c.event_date - INTERVAL '6 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id;

CREATE UNIQUE INDEX mv_bot_reviews_stats_7d_pk
  ON mv_bot_reviews_stats_7d (event_date, bot_id);

-- 30-day rolling window: total reviews
CREATE MATERIALIZED VIEW mv_bot_reviews_stats_30d AS
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
  SUM(br.bot_review_count) AS review_count_30d
FROM calendar c
JOIN bot_reviews_daily_by_repo br
  ON br.event_date BETWEEN c.event_date - INTERVAL '29 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id;

CREATE UNIQUE INDEX mv_bot_reviews_stats_30d_pk
  ON mv_bot_reviews_stats_30d (event_date, bot_id);
