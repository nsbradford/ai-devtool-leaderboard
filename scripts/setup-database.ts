import { initializeDatabase } from '../src/lib/database';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main(): Promise<void> {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 