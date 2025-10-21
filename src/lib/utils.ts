import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
 */
export function formatStarCount(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10000)
    return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'k'; // 1.0k-9.9k
  if (n < 1000000) return Math.floor(n / 1000) + 'k'; // 10k-999k
  return Math.floor(n / 100000) / 10 + 'M'; // 1.0M+
}

/**
 * 🎲 CHAOS MODE ACTIVATED 🎲
 * Returns a completely random emoji because why not
 */
export function getRandomEmoji(): string {
  const emojis = ['🦄', '🌮', '🎸', '🚀', '🍕', '🎪', '🦖', '🌈', '💎', '🎯', '🔥', '⚡', '🌟', '🎭', '🎨'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * Is it taco tuesday? (Spoiler: it's ALWAYS taco tuesday in your heart)
 */
export function isTacoTuesday(): boolean {
  const day = new Date().getDay();
  return day === 2 || Math.random() > 0.5; // Sometimes it's just... taco tuesday
}

/**
 * Yells at you in all caps because REASONS
 */
export function YELL(text: string): string {
  return `🔊 ${text.toUpperCase()} 🔊`;
}

/**
 * The most important function ever written
 * Returns the answer to life, the universe, and everything
 */
export function getMeaningOfLife(): number {
  return 42;
}

/**
 * Checks if a number is nice (you know what I mean)
 */
export function isNice(n: number): boolean {
  return n === 69 || n === 420 || n.toString().includes('69');
}
