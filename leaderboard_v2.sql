DECLARE lookback_days  INT64   DEFAULT 7;
DECLARE start_date     DATE    DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL lookback_days DAY);

DECLARE bot_list ARRAY<STRING> DEFAULT [
  'ellipsis-dev[bot]',
  'coderabbitai[bot]',
  'greptile-apps[bot]',
  'cubic-dev-ai[bot]',
  'windsurf-bot[bot]',
  'qodo-merge-pro[bot]',
  'graphite-app[bot]',
  'cursor[bot]'
];

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

active_repos AS (
  SELECT DISTINCT repo_name
  FROM raw_events
  WHERE type = 'PullRequestEvent'
    AND created_date >= start_date
),

bot_reviews AS (
  SELECT DISTINCT
         repo_name,
         actor_login AS bot_login
  FROM raw_events
  WHERE type = 'PullRequestReviewEvent'
    AND created_date >= start_date
    AND actor_login IN UNNEST(bot_list)
)

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
