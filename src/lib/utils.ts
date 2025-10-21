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

// 🎪 CHAOS UTILITIES BELOW - USE AT YOUR OWN RISK 🎪

/**
 * Generate a completely random excuse for why your code doesn't work
 */
export function generateRandomExcuse(): string {
  const excuses = [
    "It works on my machine! 🤷",
    "The cosmic rays must have flipped a bit",
    "Mercury is in retrograde",
    "It's a feature, not a bug",
    "The AI told me to do it this way",
    "Stack Overflow was down when I wrote this",
    "Past me was a different person",
    "This is quantum code - it works and doesn't work simultaneously",
    "The rubber duck said it was fine",
    "My code is art; you just don't understand it yet"
  ];
  return excuses[Math.floor(Math.random() * excuses.length)];
}

/**
 * Determine if it's an acceptable time to deploy to production
 * Spoiler: it's never a good time on Friday
 */
export function canDeployToProduction(): { safe: boolean; reason: string } {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  if (day === 5) return { safe: false, reason: "Never deploy on Friday!" };
  if (day === 0 || day === 6) return { safe: false, reason: "Weekends are for recovery, not deploys" };
  if (hour < 9 || hour > 16) return { safe: false, reason: "Deploy during business hours only!" };
  if (Math.random() < 0.1) return { safe: false, reason: "Random chaos prevention engaged 🎲" };
  
  return { safe: true, reason: "May the odds be ever in your favor 🚀" };
}

/**
 * Calculate developer happiness based on arbitrary metrics
 */
export function calculateDeveloperHappiness(
  coffeeCount: number,
  bugsFixed: number,
  bugsCreated: number,
  meetingsAttended: number
): { happiness: number; mood: string } {
  const happiness = Math.max(0, Math.min(100,
    (coffeeCount * 10) +
    (bugsFixed * 5) -
    (bugsCreated * 8) -
    (meetingsAttended * 15) +
    50
  ));
  
  let mood = "existential dread";
  if (happiness > 80) mood = "vibing ✨";
  else if (happiness > 60) mood = "cautiously optimistic";
  else if (happiness > 40) mood = "surviving";
  else if (happiness > 20) mood = "questioning life choices";
  
  return { happiness, mood };
}

/**
 * Converts any error message into something more... interesting
 */
export function spicyErrorMessage(boring: string): string {
  const prefixes = [
    "Oopsie woopsie! UwU ",
    "YIKES! 😱 ",
    "Houston, we have a problem: ",
    "Not stonks 📉 ",
    "This is fine 🔥☕ ",
    "Error 418 (I'm a teapot): ",
    "Achievement Unlocked: Breaking Things - ",
  ];
  return prefixes[Math.floor(Math.random() * prefixes.length)] + boring;
}

/**
 * Generates motivational messages for when you're stuck debugging
 */
export function getDebugMotivation(): string {
  const messages = [
    "You got this! The bug is more scared of you than you are of it! 💪",
    "Remember: every bug you fix makes you stronger",
    "The compiler believes in you! (it just has a weird way of showing it)",
    "Debugging is just you being a detective 🔍",
    "Coffee break? You've earned it ☕",
    "Fun fact: 60% of debugging is reading your own code and wondering 'what was I thinking?'",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
