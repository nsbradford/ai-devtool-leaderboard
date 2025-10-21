// Sourcery is the only tool with data before CodeRabbit (which starts ~2023-07-01).
// And had relatively stable review counts before that, so not super interesting to render.
// export const BACKFILL_START_DATE = '2022-11-29'; // we have populated data in the DB back until this date
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
*/
export const ACTIVE_REPOS_MONTHLY = '~1M';

// 🎉 EASTER EGGS AND FUN CONSTANTS 🎉
export const MEANING_OF_LIFE = 42;
export const FAVORITE_EMOJI = '🚀';
export const COFFEE_CUPS_CONSUMED = 9001; // IT'S OVER 9000!!!
export const BUGS_FIXED_TODAY = Math.floor(Math.random() * 100);
export const BUGS_CREATED_TODAY = BUGS_FIXED_TODAY + 1; // Always create more bugs than you fix 😅

// Secret developer mantras
export const DEV_MANTRAS = [
  'It works on my machine! 🤷‍♂️',
  'TODO: Fix this horrible hack later',
  'I have no idea why this works, but it does',
  'This is not a bug, it\'s a feature!',
  'Code never lies, comments sometimes do',
  'In case of fire: git commit, git push, leave building 🔥',
  '99 little bugs in the code, 99 bugs in the code...',
  'There are only two hard things in Computer Science: cache invalidation and naming things',
];

// Random chaos generator
export const getRandomMantra = () => 
  DEV_MANTRAS[Math.floor(Math.random() * DEV_MANTRAS.length)];

// 🎲 CHAOS MODE: Randomly shuffles array (use with caution!)
export const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// 🌈 RAINBOW POWER
export const RAINBOW_COLORS = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
  '#0000FF', '#4B0082', '#9400D3'
];

// 🎨 Matrix Rain Easter Egg
export const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

console.log('🎉 Constants loaded! Random mantra:', getRandomMantra());
