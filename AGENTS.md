# AGENTS.md

## Cloud-specific instructions

### Overview

This is a single Next.js 15 application (not a monorepo) that tracks AI code review bot adoption across open-source GitHub repos. The frontend renders a dashboard with charts; the API routes serve data from a Neon serverless Postgres database.

### Key commands

See `package.json` scripts and `README.md` for full details.

- **Dev server**: `pnpm dev` (port 3000, uses Turbopack)
- **Lint**: `pnpm lint`
- **Format check**: `pnpm format:check`
- **Format fix**: `pnpm format`
- **Build**: `pnpm build` (requires `DATABASE_URL` for API routes that call Postgres at build time)

### Environment variables

Copy `.env.local.example` to `.env.local`. The `DATABASE_URL` secret is required for any API route that queries Postgres (`/api/leaderboard`, `/api/leaderboard-reviews`, `/api/top-repos`). The `/api/devtools` endpoint works without a database as it reads from `src/devtools.json`.

### Database-dependent features

Without a valid `DATABASE_URL`, the dashboard shows "Error: Failed to fetch data" — this is expected. The frontend still loads and interactive elements (theme toggle, links) work normally.

### CI

GitHub Actions runs `pnpm lint` and `pnpm format:check` on PRs. The build job is currently commented out in `.github/workflows/ci.yml`.

### Gotchas

- `.env.local.example` sets `NODE_ENV="production"`. The dev server will emit a warning about non-standard `NODE_ENV`; this is harmless and can be ignored.
- `pnpm format:check` currently fails on `package.json` upstream. This is a pre-existing issue, not caused by local changes.
- pnpm 10+ warns about ignored build scripts (`@tailwindcss/oxide`, `esbuild`, etc.). The dev server and lint still work without running those build scripts.
