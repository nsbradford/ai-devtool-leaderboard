const { initializeDatabase } = require('../src/lib/database');

require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.stack || error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
