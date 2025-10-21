// 🎪 THE CHAOS API ENDPOINT 🎪
// For when you need a little randomness in your life

import { NextResponse } from 'next/server';
import { 
  generateRandomExcuse, 
  canDeployToProduction, 
  calculateDeveloperHappiness,
  getDebugMotivation 
} from '@/lib/utils';
import { getRandomCodingQuote, getSpecialDay, EASTER_EGG_MESSAGES } from '@/lib/chaos-mode';

export const dynamic = 'force-dynamic';

interface ChaosResponse {
  timestamp: string;
  randomExcuse: string;
  deploymentStatus: { safe: boolean; reason: string };
  developerHappiness: { happiness: number; mood: string };
  motivationalQuote: string;
  debugMotivation: string;
  easterEgg: string;
  specialDay: string | null;
  luckyNumber: number;
  shouldYouDoIt: boolean;
  magicEightBallSays: string;
  mood: string;
}

const MAGIC_EIGHT_BALL_RESPONSES = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don't count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
  "Absolutely not",
  "Ship it! 🚀",
  "The compiler says maybe",
  "Stack Overflow has no answer for this",
];

const MOODS = [
  "chaotic neutral",
  "caffeinated",
  "debugging demons",
  "merge conflict survivor",
  "production ready (probably)",
  "vibing with the code",
  "questioning existence",
  "successfully compiled",
  "git committed (emotionally)",
  "async/awaiting life",
];

export async function GET(request: Request) {
  // Generate some random stats for fun
  const randomCoffee = Math.floor(Math.random() * 10);
  const randomBugsFixed = Math.floor(Math.random() * 20);
  const randomBugsCreated = Math.floor(Math.random() * 15);
  const randomMeetings = Math.floor(Math.random() * 8);

  const chaosData: ChaosResponse = {
    timestamp: new Date().toISOString(),
    randomExcuse: generateRandomExcuse(),
    deploymentStatus: canDeployToProduction(),
    developerHappiness: calculateDeveloperHappiness(
      randomCoffee,
      randomBugsFixed,
      randomBugsCreated,
      randomMeetings
    ),
    motivationalQuote: getRandomCodingQuote(),
    debugMotivation: getDebugMotivation(),
    easterEgg: EASTER_EGG_MESSAGES[Math.floor(Math.random() * EASTER_EGG_MESSAGES.length)],
    specialDay: getSpecialDay(),
    luckyNumber: Math.floor(Math.random() * 100) + 1,
    shouldYouDoIt: Math.random() > 0.5,
    magicEightBallSays: MAGIC_EIGHT_BALL_RESPONSES[Math.floor(Math.random() * MAGIC_EIGHT_BALL_RESPONSES.length)],
    mood: MOODS[Math.floor(Math.random() * MOODS.length)],
  };

  return NextResponse.json({
    ...chaosData,
    meta: {
      message: "Welcome to the chaos API! 🎪",
      documentation: "There is no documentation. Embrace the chaos.",
      support: "If you need support, try rubber duck debugging 🦆",
      bugs: "They're features in disguise ✨",
    }
  });
}

// POST endpoint for Magic 8-Ball style questions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body.question || "Should I push to production?";
    
    const answer = MAGIC_EIGHT_BALL_RESPONSES[
      Math.floor(Math.random() * MAGIC_EIGHT_BALL_RESPONSES.length)
    ];

    return NextResponse.json({
      question,
      answer,
      confidence: Math.floor(Math.random() * 100) + 1 + "%",
      timestamp: new Date().toISOString(),
      disclaimer: "This API is for entertainment purposes only. Please don't actually make production decisions based on it. (But also... YOLO? 🚀)",
    });
  } catch {
    return NextResponse.json(
      { 
        error: "Invalid request",
        suggestion: "Try asking a yes/no question!",
        example: { question: "Should I refactor this code?" }
      },
      { status: 400 }
    );
  }
}
