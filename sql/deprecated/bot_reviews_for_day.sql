-- Copyright 2025 Anysphere Inc.
-- bot_reviews_for_day.sql
-- Call with:  --parameter='target_date:DATE:2025-07-12'

DECLARE target_date DATE DEFAULT @target_date;

DECLARE bot_id_list ARRAY<INT64> DEFAULT [
  65095814, 136622811, 165735046, 191113872, 189301087, 151058649, 96075541, 206951365
];

SELECT DISTINCT
  target_date                     AS event_date,
  repo.name                       AS repo_name,
  actor.id                        AS bot_id
FROM `githubarchive.day.20*`                      -- ← skips every view
WHERE _TABLE_SUFFIX = FORMAT_DATE('%y%m%d', target_date)   -- 250712
  AND type          = 'PullRequestReviewEvent'
  AND actor.id      IN UNNEST(bot_id_list)
ORDER BY repo_name;