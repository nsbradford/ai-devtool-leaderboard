Devtools API - Rust Port

Quick start

- Set env vars:
  - DATABASE_URL: Postgres connection string
  - PORT (optional, default 3001)

Run

```bash
cd rust-server
cargo run
```

Endpoints

- GET /api/devtools
- GET /api/leaderboard?viewType=weekly|monthly
- GET /api/leaderboard-reviews?viewType=weekly|monthly
- GET /api/top-repos?limit=5&daysBack=30
