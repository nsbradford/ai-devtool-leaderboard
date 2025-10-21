#!/usr/bin/env tsx

/**
 * 🌪️ CHAOS GENERATOR 9000 🌪️
 * 
 * This script exists purely to spread joy and confusion.
 * Run at your own risk. Side effects may include:
 * - Uncontrollable laughter
 * - Confusion
 * - A sudden desire to rewrite everything in Rust
 * - Existential questions about your code
 */

console.log(`
   _____ _    _          ____   _____ 
  / ____| |  | |   /\\   / __ \\ / ____|
 | |    | |__| |  /  \\ | |  | | (___  
 | |    |  __  | / /\\ \\| |  | |\\___ \\ 
 | |____| |  | |/ ____ \\ |__| |____) |
  \\_____|_|  |_/_/    \\_\\____/|_____/ 
                                       
`);

interface ChaoticIdea {
  title: string;
  description: string;
  dangerLevel: number; // 1-10
}

const chaoticIdeas: ChaoticIdea[] = [
  {
    title: "Rename all variables to Pokemon names",
    description: "Who needs 'user' when you can have 'pikachu'?",
    dangerLevel: 7
  },
  {
    title: "Replace all semicolons with emojis",
    description: "JavaScript doesn't need them anyway, right? 😏",
    dangerLevel: 9
  },
  {
    title: "Make everything pink",
    description: "Every color in the entire app. Just... pink.",
    dangerLevel: 3
  },
  {
    title: "Add 'uwu' to all error messages",
    description: "Error: Something went wwrong uwu 🥺",
    dangerLevel: 5
  },
  {
    title: "Randomly shuffle array elements",
    description: "Leaderboards are boring. Let's add EXCITEMENT!",
    dangerLevel: 10
  },
  {
    title: "Replace 'const' with 'CHAOS_CONSTANT'",
    description: "Because constants shouldn't be boring",
    dangerLevel: 4
  }
];

function generateChaos(): void {
  console.log('🎲 Generating chaos...\n');
  
  const selectedIdea = chaoticIdeas[Math.floor(Math.random() * chaoticIdeas.length)];
  
  console.log(`📢 Today's Chaotic Suggestion:\n`);
  console.log(`   ${selectedIdea.title}`);
  console.log(`   ${selectedIdea.description}`);
  console.log(`   Danger Level: ${'🔥'.repeat(selectedIdea.dangerLevel)}\n`);
  
  if (selectedIdea.dangerLevel > 7) {
    console.log('⚠️  WARNING: This is a TERRIBLE idea. Do it anyway? Absolutely. 😎\n');
  }
}

function printWisdom(): void {
  const wisdom = [
    "With great power comes great irresponsibility",
    "Move fast and break things (literally everything)",
    "Code is just jazz with semicolons",
    "If it compiles, ship it. If it doesn't, ship it anyway.",
    "There are no bugs, only unexpected features",
    "Sleep is for the weak and the well-architected"
  ];
  
  console.log(`💭 Chaotic Wisdom: "${wisdom[Math.floor(Math.random() * wisdom.length)]}"\n`);
}

// EXECUTE THE CHAOS
generateChaos();
printWisdom();

console.log('✨ May the chaos be with you ✨\n');
