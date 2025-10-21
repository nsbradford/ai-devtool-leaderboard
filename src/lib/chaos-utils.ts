// 🎪 WELCOME TO THE CHAOS ZONE 🎪
// ⚠️ WARNING: This file contains highly experimental and completely unnecessary code ⚠️

/**
 * Reverses a string but only on Tuesdays
 */
export function tuesdayReverse(str: string): string {
  const isTuesday = new Date().getDay() === 2;
  return isTuesday ? str.split('').reverse().join('') : str;
}

/**
 * A sleep function that might or might not actually sleep
 */
export async function schrodingersSleep(ms: number): Promise<void> {
  const shouldActuallySleep = Math.random() > 0.5;
  if (shouldActuallySleep) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Did it sleep? We may never know... 🤔
}

/**
 * Counts to infinity (please don't actually call this)
 */
export function* countToInfinity() {
  let i = 0;
  while (true) {
    yield i++;
    // Yes, this will run forever. That's the point! 🚀
  }
}

/**
 * Determines if a number is even using the most inefficient algorithm possible
 */
export function isEvenTheHardWay(n: number): boolean {
  const arr = Array.from({ length: Math.abs(n) + 1 }, (_, i) => i);
  return arr.filter((_, idx) => idx % 2 === 0).includes(Math.abs(n));
}

/**
 * Adds two numbers together but with extra steps
 */
export function addWithStyle(a: number, b: number): number {
  const result = a + b;
  console.log(`🎯 ${a} + ${b} = ${result} 🎯`);
  console.log('Math is beautiful! ✨');
  console.log('Thanks for using addWithStyle()! 🙏');
  return result;
}

/**
 * A deeply philosophical function
 */
export function contemplateExistence(): string {
  const thoughts = [
    'What is code but organized chaos?',
    'Do bugs dream of electric sheep?',
    'Is a function pure if no one calls it?',
    'The console.log is the window to the developer\'s soul',
    'There are 10 types of people: those who understand binary and those who don\'t',
  ];
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}

/**
 * Generates a completely random and useless ID
 */
export function generateChaoticId(): string {
  const chaos = Math.random().toString(36).substring(2);
  const moreChoas = Date.now().toString(36);
  const emoji = ['🎲', '🎰', '🎪'][Math.floor(Math.random() * 3)];
  return `${emoji}-${chaos}-${moreChoas}`;
}

export const CHAOS_CONSTANTS = {
  ANSWER_TO_EVERYTHING: 42,
  PERFECT_NUMBER: 28,
  LUCKY_NUMBER: 7,
  UNLUCKY_NUMBER: 13,
  PI_BUT_WRONG: 3.14, // Close enough!
  E_BUT_ALSO_WRONG: 2.71,
  ABSOLUTE_ZERO: -273.15,
  ROOM_TEMPERATURE_IN_KELVIN: 293.15,
  MEANING_OF_LIFE: '42',
  UNIVERSAL_GREETING: 'Hello, World!',
  FAREWELL_MESSAGE: 'So long, and thanks for all the fish!',
} as const;
