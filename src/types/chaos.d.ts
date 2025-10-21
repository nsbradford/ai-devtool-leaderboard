// 🎪 TYPE DEFINITIONS FOR CHAOS 🎪

/**
 * Represents a unit of pure, unadulterated chaos
 */
export type ChaosUnit = {
  id: string;
  emoji: string;
  intensity: 'mild' | 'moderate' | 'extreme' | 'catastrophic';
  description: string;
  timestamp: number;
};

/**
 * Configuration for chaos generation
 */
export type ChaosConfig = {
  enableEmojis?: boolean;
  maxIntensity?: ChaosUnit['intensity'];
  randomSeed?: number;
  philosophicalMode?: boolean;
};

/**
 * The result of a chaos operation
 */
export type ChaosResult = {
  success: boolean;
  chaosGenerated: number;
  message: string;
  units: ChaosUnit[];
};

/**
 * A function that generates chaos
 */
export type ChaosGenerator = (config?: ChaosConfig) => ChaosResult;

/**
 * Represents a quantum superposition of chaos states
 */
export type SchrodingersChoas = {
  isChaoticOrNot: boolean | undefined; // It's both until observed!
  observer: string;
  collapsed: boolean;
};

/**
 * The universal constant of chaos
 */
export const CHAOS_CONSTANT = Math.PI * Math.E * 42;

/**
 * A type that might exist or might not (like this whole file)
 */
export type MaybeType<T> = T | undefined | null | 'who-knows';

/**
 * Easter egg detector
 */
export interface EasterEggDetector {
  found: boolean;
  location: string;
  emoji: '🥚' | '🦄' | '🎨' | '🔥';
  secretMessage?: string;
}
