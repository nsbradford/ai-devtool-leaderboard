#!/usr/bin/env tsx

// 🎪 CHAOS GENERATOR SCRIPT 🎪
// Run this script to generate random developer fortunes and predictions!
// Usage: tsx scripts/chaos-generator.ts

import { 
  tellDeveloperFortune, 
  predictPullRequest, 
  generateCommitMessage,
  predictBugFixTime 
} from '../src/lib/fortune-teller';

console.log('\n🔮 ====================================== 🔮');
console.log('      DEVELOPER FORTUNE TELLER');
console.log('🔮 ====================================== 🔮\n');

// Get today's fortune
const fortune = tellDeveloperFortune();

console.log('📜 Your Fortune:');
console.log(`   ${fortune.fortune}\n`);

console.log('💫 Lucky Language:');
console.log(`   ${fortune.luckyLanguage}\n`);

console.log('🎲 Lucky Number:');
console.log(`   ${fortune.luckyNumber}\n`);

console.log('🐛 Bug Prediction:');
console.log(`   ${fortune.bugPrediction}\n`);

console.log('☕ Coffee Recommendation:');
console.log(`   ${fortune.coffeeRecommendation}\n`);

console.log('😊 Today\'s Mood:');
console.log(`   ${fortune.mood}\n`);

console.log('💡 Sage Advice:');
console.log(`   ${fortune.advice}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// PR Prediction
const prPrediction = predictPullRequest();
console.log('🔍 Pull Request Prediction:');
console.log(`   Status: ${prPrediction.status.toUpperCase()}`);
console.log(`   ${prPrediction.prediction}`);
console.log(`   Confidence: ${prPrediction.confidence}%\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Commit Message Suggestions
console.log('💬 Random Commit Message Ideas:');
for (let i = 0; i < 5; i++) {
  console.log(`   ${i + 1}. ${generateCommitMessage()}`);
}
console.log();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Bug Fix Prediction
const bugFix = predictBugFixTime("That weird authentication issue");
console.log('🕐 Bug Fix Time Prediction:');
console.log(`   Initial Estimate: ${bugFix.estimate}`);
console.log(`   Reality: ${bugFix.reality}`);
console.log(`   Confidence: ${bugFix.confidence}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🎉 May your code be bug-free and your coffee be strong! 🎉\n');

// Secret message
if (Math.random() < 0.1) {
  console.log('🎁 BONUS FORTUNE: You\'ve discovered the 10% secret message!');
  console.log('   The universe has blessed you with extra luck today! ✨\n');
}
