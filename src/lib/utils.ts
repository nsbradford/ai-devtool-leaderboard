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
