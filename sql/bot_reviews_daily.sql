-- bot_reviews_daily.sql   (handles any year span)

DECLARE period_start DATE DEFAULT @period_start;   -- inclusive
DECLARE period_end   DATE DEFAULT @period_end;     -- inclusive

DECLARE bot_id_list ARRAY<INT64> DEFAULT [
  65095814,136622811 --,165735046,191113872,189301087,151058649,96075541,206951365
];

-- Convert the date bounds to the 6-digit yyMMdd strings
DECLARE start_suffix STRING DEFAULT FORMAT_DATE('%y%m%d', period_start);
DECLARE end_suffix   STRING DEFAULT FORMAT_DATE('%y%m%d', period_end);

WITH r AS (
  SELECT DISTINCT
    DATE(created_at) AS event_date,
    repo.name        AS repo_name,
    actor.id         AS bot_id
  FROM `githubarchive.day.20*`                       -- skips all the views
  WHERE _TABLE_SUFFIX BETWEEN start_suffix AND end_suffix      -- yyMMdd range
    AND DATE(created_at) BETWEEN period_start AND period_end   -- double-check
    AND type            = 'PullRequestReviewEvent'
    AND actor.id        IN UNNEST(bot_id_list)
)

SELECT
  event_date,
  repo_name,
  bot_id
FROM r
ORDER BY event_date, repo_name;