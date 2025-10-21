// Sourcery is the only tool with data before CodeRabbit (which starts ~2023-07-01).
// And had relatively stable review counts before that, so not super interesting to render.
// export const BACKFILL_START_DATE = '2022-11-29'; // we have populated data in the DB back until this date

// 📅 The moment when AI code review bots started their world domination plan
export const DEFAULT_START_DATE = '2023-07-01';

/**

-- TODO run this in cron

SELECT
  COUNT(DISTINCT repo.name) AS repo_count
FROM
  `githubarchive.month.202506`
WHERE
  type = 'PullRequestEvent'
  AND JSON_EXTRACT_SCALAR(payload, '$.action') = 'opened';

2025-01: 936444
2025-02: 938468
2025-03: 1058432
2025-04: 1031322
2025-05: 981448
2025-06: 964915

Fun fact: That's approximately 1 million developers per month who said 
"let the robots review my code" 🤖
*/
export const ACTIVE_REPOS_MONTHLY = '~1M'; // That's a lot of repositories! 🚀
