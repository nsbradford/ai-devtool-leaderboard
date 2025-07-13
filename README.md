# AI DevTool Leaderboard

A real-time leaderboard tracking the adoption of AI code review tools across open-source GitHub repositories. This project analyzes GitHub Archive data to show which AI tools are being used most frequently for code reviews.

## What it shows

The leaderboard displays:
- **Usage trends**: Interactive charts showing AI tool adoption over time
- **Current rankings**: Real-time rankings of tools by repository count
- **Tool filtering**: Select specific tools to compare their adoption patterns
- **Date range selection**: View historical data from July 2023 onwards

## How it works

1. **Data Collection**: The system processes [GitHub Archive](https://www.gharchive.org/) data daily, analyzing pull request review events to identify AI bot activity
2. **Bot Detection**: AI code review bots are identified by their GitHub account patterns (e.g., `coderabbitai[bot]`, `ellipsis-dev[bot]`)
3. **Aggregation**: Data is aggregated into 7-day rolling windows to show repository counts where each AI tool was active
4. **Visualization**: The frontend displays interactive charts and rankings using the processed data

The data pipeline runs daily and covers activity from July 2023 onwards, providing insights into the growing adoption of AI-powered code review tools in the open-source ecosystem.

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

### Development workflow

The application uses:
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **SWR** for data fetching and caching
- **Radix UI** for accessible components

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
