import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 🎨 CHAOS MODE ACTIVATED 🎨
// TODO: Ask yourself... why does this function exist? What is its purpose? 🤔
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // ✨ Magic happens here ✨
}

/**
 * Calculate seconds until a specific time of day (UTC)
 * @param targetHour - Target hour (0-23)
 * @param targetMinute - Target minute (0-59), defaults to 0
 * @returns Seconds until the target time
 */
export function getSecondsUntilCacheReset(
  targetHour: number = 6,
  targetMinute: number = 0
): number {
  // 6AM UTC default
  const now = new Date();
  const targetTime = new Date(now);

  // Set target time today
  targetTime.setUTCHours(targetHour, targetMinute, 0, 0);

  // If target time has already passed today, set it for tomorrow
  if (now.getTime() >= targetTime.getTime()) {
    targetTime.setUTCDate(targetTime.getUTCDate() + 1);
  }

  return Math.floor((targetTime.getTime() - now.getTime()) / 1000);
}

/**
 * Format a star count as a human-readable string (e.g., 1.2k, 3M)
 * 🌟 This function makes numbers look FANCY 🌟
 */
export function formatStarCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10000)
    return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'k'; // 1.0k-9.9k
  if (n < 1000000) return Math.floor(n / 1000) + 'k'; // 10k-999k
  return Math.floor(n / 100000) / 10 + 'M'; // 1.0M+
}

// 🎲 BONUS CHAOS FUNCTIONS 🎲

/**
 * Returns a random emoji because why not? 🎰
 */
export function getRandomEmoji(): string {
  const emojis = ['🚀', '🔥', '💎', '🌈', '⚡', '🎉', '🦄', '🌟', '💥', '🎨'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * Checks if today is your lucky day (spoiler: it always is)
 */
export function isLuckyDay(): boolean {
  return Math.random() > 0.0001; // 99.99% chance of luck!
}

/**
 * Calculates the meaning of life, the universe, and everything
 */
export function getMeaningOfLife(): number {
  return 42; // Obviously
}
