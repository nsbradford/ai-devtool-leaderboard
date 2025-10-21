// 🎪 CHAOS MODE ACTIVATED 🎪
// This file contains Easter eggs and secret features
// Because every serious app needs some silliness

export interface ChaosConfig {
  enableRainbowMode: boolean;
  enableMatrixRain: boolean;
  enablePartyMode: boolean;
  chaosLevel: number; // 0-100
}

/**
 * Konami Code sequence: ↑ ↑ ↓ ↓ ← → ← → B A
 */
export class KonamiCodeDetector {
  private sequence: string[] = [
    'ArrowUp',
    'ArrowUp', 
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  private currentIndex = 0;
  private onSuccess: () => void;

  constructor(onSuccess: () => void) {
    this.onSuccess = onSuccess;
  }

  handleKeyPress(key: string): boolean {
    if (key === this.sequence[this.currentIndex]) {
      this.currentIndex++;
      if (this.currentIndex === this.sequence.length) {
        this.currentIndex = 0;
        this.onSuccess();
        return true;
      }
    } else {
      this.currentIndex = 0;
    }
    return false;
  }

  reset() {
    this.currentIndex = 0;
  }
}

/**
 * Easter egg messages that might randomly appear
 */
export const EASTER_EGG_MESSAGES = [
  "You found the secret message! 🎉",
  "Nice inspect element skills! 🕵️",
  "The cake is a lie 🍰",
  "Have you tried turning it off and on again? 🔌",
  "404: Humor not found... wait, yes it is! 😄",
  "This message will self-destruct in 3... 2... 1... just kidding! 💣",
  "Powered by vibes and caffeine ☕✨",
  "No AI was harmed in the making of this website 🤖",
  "If you're reading this, you're too close! 👀",
  "Roses are red, violets are blue, unexpected '{' on line 32 💔",
];

/**
 * Apply rainbow effect to text (returns CSS class)
 */
export function getRainbowCSS(): string {
  return `
    background: linear-gradient(
      45deg,
      #ff0000,
      #ff7f00,
      #ffff00,
      #00ff00,
      #0000ff,
      #4b0082,
      #9400d3
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: rainbow 3s ease infinite;
  `;
}

/**
 * Generate random confetti position
 */
export function generateConfetti(count: number = 50) {
  const confetti = [];
  for (let i = 0; i < count; i++) {
    confetti.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      size: Math.random() * 10 + 5,
    });
  }
  return confetti;
}

/**
 * Get a random inspirational coding quote
 */
export function getRandomCodingQuote(): string {
  const quotes = [
    "Code is like humor. When you have to explain it, it's bad. - Cory House",
    "First, solve the problem. Then, write the code. - John Johnson", 
    "Experience is the name everyone gives to their mistakes. - Oscar Wilde",
    "In order to be irreplaceable, one must always be different. - Coco Chanel",
    "Java is to JavaScript what car is to Carpet. - Chris Heilmann",
    "I'm not a great programmer; I'm just a good programmer with great habits. - Kent Beck",
    "Truth can only be found in one place: the code. - Robert C. Martin",
    "It's not a bug – it's an undocumented feature. - Anonymous",
    "99 little bugs in the code, 99 bugs in the code. Take one down, patch it around, 127 bugs in the code. - Anonymous",
    "Walking on water and developing software from a specification are easy if both are frozen. - Edward V. Berard",
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Log fun ASCII art to console
 */
export function logConsoleArt() {
  const art = `
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║     🎨 CHAOS MODE ACTIVATED! 🎨      ║
    ║                                       ║
    ║  You've discovered the secret zone!  ║
    ║   Where bugs become features and     ║
    ║     features become adventures!      ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
  `;
  
  console.log('%c' + art, 'color: #ff00ff; font-weight: bold; font-family: monospace;');
  console.log('%c🌈 Welcome to the rainbow dimension! 🦄', 'color: #00ff00; font-size: 16px; font-weight: bold;');
  console.log('%cRandom quote:', 'color: #00aaff; font-weight: bold;');
  console.log('%c' + getRandomCodingQuote(), 'color: #ffaa00; font-style: italic;');
}

/**
 * Check if today is a special day
 */
export function getSpecialDay(): string | null {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  if (month === 10 && day === 31) return "🎃 Happy Halloween! Time for some spooky code!";
  if (month === 12 && day === 25) return "🎄 Merry Christmas! Ho ho hope your code doesn't break!";
  if (month === 1 && day === 1) return "🎆 Happy New Year! New year, new bugs!";
  if (month === 3 && day === 14) return "🥧 Happy Pi Day! π = approximately 3.14159...";
  if (month === 5 && day === 4) return "✨ May the 4th be with you!";
  if (month === 4 && day === 1) return "🤡 April Fools! Or is your code always this silly?";
  if (day === 13) return "😱 Friday the 13th vibes...";
  
  return null;
}

/**
 * Party mode animations and effects
 */
export const PARTY_MODE_CSS = `
  @keyframes party-spin {
    0% { transform: rotate(0deg) scale(1); }
    25% { transform: rotate(90deg) scale(1.1); }
    50% { transform: rotate(180deg) scale(1); }
    75% { transform: rotate(270deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1); }
  }
  
  @keyframes rainbow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes disco {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
  
  .party-mode {
    animation: party-spin 2s ease-in-out infinite;
  }
  
  .rainbow-text {
    ${getRainbowCSS()}
  }
  
  .disco-mode {
    animation: disco 3s linear infinite;
  }
`;
