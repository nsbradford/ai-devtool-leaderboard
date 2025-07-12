interface APIResponse {
  timestamps?: string[];
  active_repos?: number;
  tools?: Record<string, any>;
}

async function testAPI(): Promise<void> {
  try {
    console.log('Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/leaderboard');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: APIResponse = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.timestamps && data.active_repos && data.tools) {
      console.log('✅ API structure looks correct');
      console.log(`📊 Data points: ${data.timestamps.length}`);
      console.log(`🔧 Tools: ${Object.keys(data.tools).length}`);
    } else {
      console.log('❌ API structure is incorrect');
    }
  } catch (error) {
    console.error('❌ API test failed:', error instanceof Error ? error.message : error);
  }
}

if (require.main === module) {
  testAPI();
} 