# AI DevTool Adoption Tracker

A dashboard tracking the adoption of AI code review tools across open-source GitHub repositories.

Currently indexes Code Review bots, indexing for code generation bots is coming soon.

The data pipeline runs daily for the previous day, and has been backfilled from July 2023 onwards.

## How it works

- Data source: [GH Archive](https://www.gharchive.org/)'s BigQuery dataset
- Cron job: uses [Trigger.dev](https://trigger.dev/) every day at 5am UTC to process the previous day's data archive (which is usually uploaded a few minutes after midnight UTC)
- Storage: [Neon](https://neon.com/) serverless postgres to store intermediate data and materialized views for window aggregates.
- Frontend: NextJS, Tailwind
- Hosting: Vercel

## Local development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (for data storage)
- Google Cloud BigQuery access (for data processing)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/nsbradford/ai-devtool-leaderboard.git
   cd ai-devtool-leaderboard
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment configuration**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `GOOGLE_CLOUD_PROJECT_ID`: Your Google Cloud project ID
   - `GOOGLE_APPLICATION_CREDENTIALS`: Base64-encoded service account JSON

4. **Database setup**

   ```bash
   pnpm run setup-db
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm backfill` - Backfill historical data
- `pnpm setup-db` - Initialize database schema

## License

This project is open source and available under the [MIT License](LICENSE).
