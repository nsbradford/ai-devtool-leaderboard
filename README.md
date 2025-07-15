# ✨ AI DevTool Adoption Tracker

A dashboard tracking the adoption of AI developer tools across open-source GitHub repositories.

Currently tracks only Code Review bots, tracking for code generation bots is coming soon.

## How it works

The data pipeline runs daily for the previous day, and has been backfilled from July 2023 onwards.

- List of tracked devtools is in [devtools.json](/src/devtools.json)
- Data source: [GH Archive](https://www.gharchive.org/)'s BigQuery dataset. We currently only search over PR Review events.
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

1. **Install dependencies**

   ```bash
   pnpm install
   ```

1. **Environment configuration**

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the required environment variables.

1. **Start the development server**

   ```bash
   pnpm dev
   ```

1. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Run Prettier

## License

This project is open source and available under the [MIT License](LICENSE).
