# Project Information

## BigQuery Usage

This project uses Google Cloud BigQuery to query GitHub event data from the GH Archive dataset.

### Main BigQuery Implementation

**Location:** `src/lib/bigquery.ts`

The BigQuery integration is implemented in a dedicated module that:

1. **Authentication**: Parses base64-encoded Google Cloud service account credentials from environment variables
2. **Client Management**: Creates and configures BigQuery client instances with project ID and credentials
3. **Data Querying**: Queries the GH Archive BigQuery dataset to fetch bot review activity

### Key Functionality

The primary function `getBotReviewsForDay()` queries `githubarchive.day.20*` tables to:
- Fetch PullRequestReviewEvent data for a specific date
- Filter by bot actor IDs (AI devtools from `devtools.json`)
- Aggregate bot review counts and PR counts per repository
- Return structured data about bot review activity

### Dependencies

- **Package**: `@google-cloud/bigquery` version `^7.0.0` (installed: `7.9.4`)
- **External Data Source**: [GH Archive](https://www.gharchive.org/) BigQuery public dataset

### Other Files Using BigQuery

- `src/lib/backfill/bot-reviews.ts` - Imports and uses `getBotReviewsForDay()` for backfilling data
- `next.config.ts` - Marks `@google-cloud/bigquery` as a server external package
- `.env.local.example` - Documents required Google Cloud BigQuery environment variables
- `README.md` - Documents the BigQuery dependency and usage

### Configuration Required

- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Base64-encoded service account credentials

## GitHub CLI Version

**Version**: `gh version 2.81.0 (2025-10-01)`
**Release**: https://github.com/cli/cli/releases/tag/v2.81.0

This is a recent version of the GitHub CLI tool installed in the development environment.
