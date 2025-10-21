#!/usr/bin/env tsx

// 🎲 THE ULTIMATE CHAOS GENERATOR 🎲
// Run this at your own risk!

import * as fs from 'fs';
import * as path from 'path';

const CHAOS_EMOJIS = ['🎪', '🎨', '🎭', '🎰', '🎲', '🃏', '🌈', '⚡', '💥', '🔥'];

function getRandomEmoji(): string {
  return CHAOS_EMOJIS[Math.floor(Math.random() * CHAOS_EMOJIS.length)];
}

function generateChaoticMessage(): string {
  const messages = [
    'Chaos reigns supreme!',
    'Order is overrated anyway',
    'Embrace the randomness',
    'What could possibly go wrong?',
    'This is fine 🔥',
    'Let the chaos flow through you',
    'In chaos, we trust',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function main() {
  console.log('🎪 CHAOS GENERATOR ACTIVATED 🎪\n');
  
  console.log('Generating chaos...');
  console.log(getRandomEmoji(), generateChaoticMessage());
  console.log(getRandomEmoji(), generateChaoticMessage());
  console.log(getRandomEmoji(), generateChaoticMessage());
  
  console.log('\n✨ Random Numbers (because why not?):');
  for (let i = 0; i < 5; i++) {
    console.log(`  ${getRandomEmoji()} ${Math.random().toString(36).substring(2, 10)}`);
  }
  
  console.log('\n💭 Today\'s philosophical question:');
  const questions = [
    'If a tree falls in a forest and no one is around, does it make a sound?',
    'Can you step in the same river twice?',
    'What is the sound of one hand clapping?',
    'If a function returns undefined, did it ever really run?',
  ];
  console.log('  ', questions[Math.floor(Math.random() * questions.length)]);
  
  console.log('\n🎉 Chaos generation complete! 🎉');
}

main();
