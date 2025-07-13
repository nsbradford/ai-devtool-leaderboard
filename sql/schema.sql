CREATE TABLE IF NOT EXISTS bot_reviews_daily (
  event_date  DATE    NOT NULL,
  bot_id      BIGINT  NOT NULL,
  repo_name   TEXT    NOT NULL,
  -- composite key avoids duplicates and gives you a natural clustering order
  PRIMARY KEY (event_date, bot_id, repo_name)
);


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

CREATE OR REPLACE VIEW vw_bot_repo_count_7d AS
WITH calendar AS (
  -- generate one row per date present in the fact table
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily),
           (SELECT MAX(event_date) FROM bot_reviews_daily),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  br.bot_id,
  COUNT(DISTINCT br.repo_name) AS repo_count   -- absolute, windowed
FROM calendar c
JOIN bot_reviews_daily br
  ON br.event_date BETWEEN c.event_date - INTERVAL '6 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id
ORDER BY c.event_date DESC, repo_count DESC;


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

CREATE OR REPLACE VIEW vw_bot_repo_count_30d AS
WITH calendar AS (
  -- generate one row per date present in the fact table
  SELECT generate_series(
           (SELECT MIN(event_date) FROM bot_reviews_daily),
           (SELECT MAX(event_date) FROM bot_reviews_daily),
           '1 day'
         )::date AS event_date
)
SELECT
  c.event_date,
  br.bot_id,
  COUNT(DISTINCT br.repo_name) AS repo_count   -- absolute, windowed
FROM calendar c
JOIN bot_reviews_daily br
  ON br.event_date BETWEEN c.event_date - INTERVAL '29 days'
                      AND     c.event_date
GROUP BY c.event_date, br.bot_id
ORDER BY c.event_date DESC, repo_count DESC;