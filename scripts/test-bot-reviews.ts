#!/usr/bin/env tsx

import { getBotReviewsForDay, getLeaderboardDataForDay, getActiveReposForDay, getBotIds } from '../src/lib/bigquery';

async function testBotReviews() {
  try {
    console.log('🧪 Testing updated BigQuery bot reviews functionality...\n');

    // Test 1: Get bot reviews for a specific day
    const targetDate = '2025-01-15'; // Example date
    console.log(`📅 Testing bot reviews for ${targetDate}...`);
    
    const botReviews = await getBotReviewsForDay(targetDate);
    console.log(`✅ Found ${botReviews.length} bot review events`);
    
    if (botReviews.length > 0) {
      console.log('Sample events:');
      botReviews.slice(0, 3).forEach(review => {
        console.log(`  - ${review.repo_name} (Bot ID: ${review.bot_id})`);
      });
    }

    // Test 2: Get active repos count for the same day
    console.log(`\n📊 Testing active repos count for ${targetDate}...`);
    const activeRepoCount = await getActiveReposForDay(targetDate);
    console.log(`✅ Found ${activeRepoCount} active repositories`);

    // Test 3: Get leaderboard data for the day
    console.log(`\n🏆 Testing leaderboard data for ${targetDate}...`);
    const leaderboardData = await getLeaderboardDataForDay(targetDate);
    console.log(`✅ Found ${leaderboardData.length} tools with activity`);
    
    if (leaderboardData.length > 0) {
      console.log('Leaderboard results:');
      leaderboardData.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.tool}: ${result.repo_count} repos (${result.pct_of_active_repos}%)`);
      });
    }

    // Test 4: Test with specific bot IDs
    console.log(`\n🎯 Testing with specific bot IDs...`);
    const specificBotIds = [65095814, 136622811]; // Ellipsis and CodeRabbit
    const specificBotReviews = await getBotReviewsForDay(targetDate, specificBotIds);
    console.log(`✅ Found ${specificBotReviews.length} events for specific bots`);

    // Test 5: Show available bot IDs
    console.log(`\n🤖 Available bot IDs:`);
    const allBotIds = getBotIds();
    console.log(`Total bots: ${allBotIds.length}`);
    console.log(`Bot IDs: ${allBotIds.join(', ')}`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testBotReviews();
} 