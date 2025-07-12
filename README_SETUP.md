# AI Leaderboard Setup Guide

## Prerequisites

1. **Google Cloud BigQuery Access**
   - Create a Google Cloud project with BigQuery API enabled
   - Create a service account with BigQuery Job User and BigQuery Data Viewer permissions
   - Download the service account key JSON file

2. **Neon Database**
   - Create a Neon database account
   - Create a new database
   - Get the connection string

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your actual values in `.env.local`:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
   GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
   NEON_DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   ```

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Initialize the database:
   ```bash
   pnpm run setup-db
   ```

## Usage

### Backfill Data

**Note:** You need valid Google Cloud BigQuery credentials and a Neon database to run the backfill script.

Backfill the last 7 days:
```bash
pnpm run backfill
```

Backfill the last 30 days:
```bash
pnpm run backfill 30
```

Backfill a specific date range:
```bash
pnpm run backfill 2024-01-01 2024-01-31
```

### Run the Application

```bash
pnpm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Test the API

To test the API endpoint:
```bash
pnpm run test-api
```

## Database Schema

The application uses a single table `leaderboard_snapshots`:

```sql
CREATE TABLE leaderboard_snapshots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  tool VARCHAR(100) NOT NULL,
  repo_count INTEGER NOT NULL,
  pct_of_active_repos DECIMAL(5,2) NOT NULL,
  total_active_repos INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, tool)
);
```

## Troubleshooting

- Make sure your Google Cloud service account has the necessary permissions
- Verify your Neon database connection string is correct
- Check that the BigQuery API is enabled in your Google Cloud project
- Ensure your service account key file path is correct in the environment variables
