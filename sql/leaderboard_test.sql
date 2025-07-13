-- run this sample query with
-- $ bq query \
--   --use_legacy_sql=false \
--   --format=prettyjson \
--   < 00_leaderboard_dev_test.sql


DECLARE lookback_days  INT64   DEFAULT 7;
DECLARE start_date     DATE    DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY);

-- To get user ID for a login:
-- $ curl -s -H "Accept: application/vnd.github.v3+json"  "https://api.github.com/users/cubic-dev-ai%5Bbot%5D"
DECLARE bot_list ARRAY<STRING> DEFAULT [
  'ellipsis-dev[bot]', -- 65095814
  'coderabbitai[bot]', -- 136622811
  'greptile-apps[bot]', -- 165735046
  'cubic-dev-ai[bot]', -- 191113872
  'windsurf-bot[bot]', -- 189301087
  'qodo-merge-pro[bot]', -- 151058649
  'graphite-app[bot]', -- 96075541
  'cursor[bot]' -- 206951365
--   'copilot-pull-request-reviewer[bot]' -- 175728472 -- TODO doesn't seem to be working?
];

-- 1️⃣  Pull only the months we need
WITH raw_events AS (
  SELECT
    repo.name          AS repo_name,
    LOWER(actor.login) AS actor_login,
    type,
    DATE(created_at)   AS created_date
  FROM `githubarchive.month.*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m', start_date)
                          AND FORMAT_DATE('%Y%m', CURRENT_DATE())
),

-- 2️⃣  Active repos = any PR opened in window
active_repos AS (
  SELECT DISTINCT repo_name
  FROM raw_events
  WHERE type = 'PullRequestEvent'
    AND created_date >= start_date
),

-- 3️⃣  Bot reviews in window
bot_reviews AS (
  SELECT DISTINCT
         repo_name,
         actor_login AS bot_login
  FROM raw_events
  WHERE type = 'PullRequestReviewEvent'
    AND created_date >= start_date
    AND actor_login IN UNNEST(bot_list)
)

-- 4️⃣  Leaderboard
SELECT
  bot_login                     AS tool,
  COUNT(*)                      AS repo_count,
  ROUND(
    100 * COUNT(*) / (SELECT COUNT(*) FROM active_repos),
    2
  )                             AS pct_of_active_repos
FROM bot_reviews
GROUP BY bot_login
ORDER BY repo_count DESC;