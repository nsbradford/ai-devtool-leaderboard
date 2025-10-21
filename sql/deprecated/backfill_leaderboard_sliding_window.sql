-- copywrite 2025 anysphere inc
-- backfill_leaderboard_by_bot_id.sql
-- Example invocation:
--   bq query --use_legacy_sql=false \
--            --parameter='period_start:DATE:2024-07-01' \
--            --parameter='period_end:DATE:2025-07-13' \
--            --parameter='window_days:INT64:7' \
--            < backfill_leaderboard_by_bot_id.sql

DECLARE period_start DATE  DEFAULT @period_start;   -- oldest day to report
DECLARE period_end   DATE  DEFAULT @period_end;     -- newest day to report
DECLARE window_days  INT64 DEFAULT @window_days;    -- sliding-window length

-- 🔖  Bot **account IDs**
DECLARE bot_id_list ARRAY<INT64> DEFAULT [
  65095814,   -- ellipsis-dev[bot]
  136622811,  -- coderabbitai[bot]
  165735046,  -- greptile-apps[bot]
  191113872,  -- cubic-dev-ai[bot]
  189301087,  -- windsurf-bot[bot]
  151058649,  -- qodo-merge-pro[bot]
   96075541,  -- graphite-app[bot]
  206951365   -- cursor[bot]
];

-- 0️⃣ Generate one row per calendar day in the reporting range
WITH calendar AS (
  SELECT day
  FROM UNNEST(GENERATE_DATE_ARRAY(period_start, period_end)) AS day
),

-- 1️⃣ Read GitHub Archive once, keep only needed columns & days
raw AS (
  SELECT
    repo.name        AS repo_name,
    actor.id         AS actor_id,
    type,
    DATE(created_at) AS event_date
  FROM `githubarchive.month.*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m', period_start)
                          AND FORMAT_DATE('%Y%m', period_end)
    AND DATE(created_at)  BETWEEN period_start AND period_end
),

-- 2️⃣ Distinct daily *PR-opened* events  → “active” repos
active_repos_daily AS (
  SELECT DISTINCT event_date, repo_name
  FROM raw
  WHERE type = 'PullRequestEvent'
),

-- 3️⃣ Distinct daily *bot review* events
bot_reviews_daily AS (
  SELECT DISTINCT
         event_date,
         repo_name,
         actor_id AS bot_id
  FROM raw
  WHERE type = 'PullRequestReviewEvent'
    AND actor_id IN UNNEST(bot_id_list)
),

-- 4️⃣ For **each calendar day**, gather repos active in its sliding window
window_active_repos AS (
  SELECT
    c.day,
    COUNT(DISTINCT ar.repo_name) AS window_active_repo_count
  FROM calendar              AS c
  JOIN active_repos_daily    AS ar
    ON ar.event_date BETWEEN DATE_SUB(c.day, INTERVAL window_days - 1 DAY) AND c.day
  GROUP BY c.day
),

-- 5️⃣ For each **day × bot**, count distinct repos they reviewed in the same window
window_bot_counts AS (
  SELECT
    c.day          AS event_date,
    br.bot_id,
    COUNT(DISTINCT br.repo_name) AS repo_count
  FROM calendar           AS c
  JOIN bot_reviews_daily  AS br
    ON br.event_date BETWEEN DATE_SUB(c.day, INTERVAL window_days - 1 DAY) AND c.day
  GROUP BY c.day, br.bot_id
)

-- 6️⃣  Final daily leaderboard with % of active repos
SELECT
  wb.event_date,
  wb.bot_id                      AS tool_id,
  wb.repo_count,
  ROUND(
    100 * wb.repo_count / wa.window_active_repo_count,
    2
  )                              AS pct_of_active_repos
FROM window_bot_counts   AS wb
JOIN window_active_repos AS wa
  ON wa.day = wb.event_date
ORDER BY wb.event_date DESC, wb.repo_count DESC;