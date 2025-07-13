import { getLeaderboardDataForDay, getLeaderboardDataForDateRange } from '../src/lib/bigquery';

async function testAPI() {
  console.log('🧪 Testing new API functionality...\n');

  try {
    // Test 1: Weekly view for a single day
    console.log('📅 Testing weekly view for single day...');
    const weeklyData = await getLeaderboardDataForDay('2024-01-15', 'weekly');
    console.log(`✅ Found ${weeklyData.length} records for weekly view`);

    if (weeklyData.length > 0) {
      console.log('Sample weekly data:');
      weeklyData.slice(0, 3).forEach(item => {
        console.log(`  - Bot ID: ${item.bot_id}, Repos: ${item.repo_count}, Date: ${item.event_date}`);
      });
    }

    // Test 2: Monthly view for a single day
    console.log('\n📅 Testing monthly view for single day...');
    const monthlyData = await getLeaderboardDataForDay('2024-01-15', 'monthly');
    console.log(`✅ Found ${monthlyData.length} records for monthly view`);

    if (monthlyData.length > 0) {
      console.log('Sample monthly data:');
      monthlyData.slice(0, 3).forEach(item => {
        console.log(`  - Bot ID: ${item.bot_id}, Repos: ${item.repo_count}, Date: ${item.event_date}`);
      });
    }

    // Test 3: Date range with weekly view
    console.log('\n📅 Testing weekly view for date range...');
    const weeklyRangeData = await getLeaderboardDataForDateRange('2024-01-01', '2024-01-31', 'weekly');
    console.log(`✅ Found ${weeklyRangeData.length} records for weekly range`);

    // Test 4: Date range with monthly view
    console.log('\n📅 Testing monthly view for date range...');
    const monthlyRangeData = await getLeaderboardDataForDateRange('2024-01-01', '2024-01-31', 'monthly');
    console.log(`✅ Found ${monthlyRangeData.length} records for monthly range`);

    console.log('\n✅ All API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

testAPI(); 