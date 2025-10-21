-- Copyright 2025 Anysphere Inc.
CREATE TABLE IF NOT EXISTS bot_reviews_daily (
  -- TODO key on repo id instead of repo name.
  event_date  DATE    NOT NULL,
  bot_id      BIGINT  NOT NULL,
  repo_name   TEXT    NOT NULL,
  bot_review_count INTEGER NOT NULL,
  PRIMARY KEY (event_date, bot_id, repo_name)
);

CREATE TABLE IF NOT EXISTS bot_reviews_daily_by_repo (
  event_date  DATE    NOT NULL,
  bot_id        BIGINT  NOT NULL,
  repo_id       BIGINT  NOT NULL,
  bot_review_count INTEGER NOT NULL,
  PRIMARY KEY (event_date, bot_id, repo_id)
);

-- we don't track # of reviews in the user table because it's a much larger table.
-- CREATE TABLE IF NOT EXISTS daily_bot_reviews_user (
--   event_date  DATE    NOT NULL,
--   bot_id      BIGINT  NOT NULL,
--   user_id     BIGINT  NOT NULL,
--   PRIMARY KEY (event_date, bot_id, user_id)
-- );


/* -----------------------------------------------------------------
   Rolling-7-day repo coverage, absolute counts (no percent column)
   Depends on a single base table:

     bot_reviews_daily(
       event_date date,
       bot_id     bigint,
       repo_name  text,
       PRIMARY KEY (event_date, bot_id, repo_name)
     )
   ----------------------------------------------------------------- */

-- CREATE OR REPLACE VIEW vw_bot_repo_count_7d AS
-- WITH calendar AS (
--   -- generate one row per date present in the fact table
--   SELECT generate_series(
--            (SELECT MIN(event_date) FROM bot_reviews_daily),
--            (SELECT MAX(event_date) FROM bot_reviews_daily),
--            '1 day'
--          )::date AS event_date
-- )
-- SELECT
--   c.event_date,
--   br.bot_id,
--   COUNT(DISTINCT br.repo_name) AS repo_count   -- absolute, windowed
-- FROM calendar c
-- JOIN bot_reviews_daily br
--   ON br.event_date BETWEEN c.event_date - INTERVAL '6 days'
--                       AND     c.event_date
-- GROUP BY c.event_date, br.bot_id
-- ORDER BY c.event_date DESC, repo_count DESC;


/* -----------------------------------------------------------------
   Rolling-30-day repo coverage, absolute counts (no percent column)
   Depends on a single base table:

     bot_reviews_daily(
       event_date date,
       bot_id     bigint,
       repo_name  text,
       PRIMARY KEY (event_date, bot_id, repo_name)
     )
   ----------------------------------------------------------------- */

-- CREATE OR REPLACE VIEW vw_bot_repo_count_30d AS
-- WITH calendar AS (
--   -- generate one row per date present in the fact table
--   SELECT generate_series(
--            (SELECT MIN(event_date) FROM bot_reviews_daily),
--            (SELECT MAX(event_date) FROM bot_reviews_daily),
--            '1 day'
--          )::date AS event_date
-- )
-- SELECT
--   c.event_date,
--   br.bot_id,
--   COUNT(DISTINCT br.repo_name) AS repo_count   -- absolute, windowed
-- FROM calendar c
-- JOIN bot_reviews_daily br
--   ON br.event_date BETWEEN c.event_date - INTERVAL '29 days'
--                       AND     c.event_date
-- GROUP BY c.event_date, br.bot_id
-- ORDER BY c.event_date DESC, repo_count DESC;



/* -----------------------------------------------------------------
   Switching to materialized views for performance
   ----------------------------------------------------------------- */
CREATE MATERIALIZED VIEW mv_bot_repo_count_7d AS
WITH calendar AS (
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily),
           (SELECT MAX(event_date) FROM bot_reviews_daily),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  br.bot_id,
  COUNT(DISTINCT br.repo_name) AS repo_count
FROM calendar c
JOIN bot_reviews_daily br
  ON br.event_date BETWEEN c.event_date - INTERVAL '6 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id;

-- Needed only if you want CONCURRENTLY refreshes (highly recommended):
CREATE UNIQUE INDEX mv_bot_repo_count_7d_pk
  ON mv_bot_repo_count_7d (event_date, bot_id);



CREATE MATERIALIZED VIEW mv_bot_repo_count_30d AS
WITH calendar AS (
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily),
           (SELECT MAX(event_date) FROM bot_reviews_daily),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  br.bot_id,
  COUNT(DISTINCT br.repo_name) AS repo_count    -- absolute, 30-day window
FROM calendar c
JOIN bot_reviews_daily br
  ON br.event_date BETWEEN c.event_date - INTERVAL '29 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id;

CREATE UNIQUE INDEX mv_bot_repo_count_30d_pk
  ON mv_bot_repo_count_30d (event_date, bot_id);


/* -----------------------------------------------------------------
   One row per GitHub repository (full “owner/name” string)
   ----------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS repo_star_counts (
  full_name   TEXT        PRIMARY KEY,                         -- e.g. "vercel/next.js"
  star_count  INTEGER     NOT NULL CHECK (star_count >= 0),    -- latest stargazer tally
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),              -- last refresh
  is_error    BOOLEAN     NOT NULL DEFAULT false               -- true if star count fetch failed
);

-- Keep `updated_at` current on every insert or update
CREATE OR REPLACE FUNCTION touch_repo_star_counts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_repo_star_counts
BEFORE INSERT OR UPDATE ON repo_star_counts
FOR EACH ROW EXECUTE FUNCTION touch_repo_star_counts();


