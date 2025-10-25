use clap::Parser;
use std::collections::HashMap;
use tracing::{error, info};

use devtools_api_rust::{db::connect_pool, github::GitHubApi};

#[derive(Parser, Debug)]
#[command(version, about = "Backfill GitHub star counts for repos needing updates")] 
struct Args {
    /// Days back to look for repos
    #[arg(long, default_value_t = 30)]
    days_back: i32,
    /// Max age (days) of existing star counts
    #[arg(long, default_value_t = 7)]
    max_age_days: i32,
    /// Max repos to process
    #[arg(long, default_value_t = 1000)]
    limit: i32,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    init_tracing();

    let database_url = std::env::var("DATABASE_URL")?;
    let pool = connect_pool(&database_url).await?;

    // Query repos needing updates (SQL aligns with TS version)
    let sql = format!(
        "SELECT DISTINCT br.repo_full_name FROM bot_reviews_daily_by_repo br WHERE br.event_date >= CURRENT_DATE - INTERVAL '{} days' AND (NOT EXISTS (SELECT 1 FROM github_repositories_by_name grbn WHERE grbn.full_name = br.repo_full_name) OR EXISTS (SELECT 1 FROM github_repositories_by_name grbn WHERE grbn.full_name = br.repo_full_name AND grbn.updated_at < CURRENT_DATE - INTERVAL '{} days')) ORDER BY br.repo_full_name LIMIT {}",
        30, 7, 1000
    );

    let repo_rows = sqlx::query(&sql).fetch_all(&pool).await?;
    let repos: Vec<String> = repo_rows
        .into_iter()
        .filter_map(|r| r.try_get::<String, _>("repo_full_name").ok())
        .collect();

    if repos.is_empty() {
        info!("no repos needing update");
        return Ok(());
    }

    info!(count = repos.len(), "fetching metadata from GitHub GraphQL");
    let gh = GitHubApi::new_from_env()?;
    let stars = gh.fetch_repo_stars(&repos).await?;

    // Split into batches for upsert
    let mut success = 0usize;
    let mut values: Vec<String> = Vec::new();
    for full in &repos {
        if let Some(star_count) = stars.get(full) {
            let safe = full.replace("'", "''");
            values.push(format!(
                "('{}', NULL, NULL, {}, false, NOW())",
                safe, star_count
            ));
            success += 1;
        }
    }

    if !values.is_empty() {
        let insert = format!(
            "INSERT INTO github_repositories_by_name (full_name, node_id, database_id, star_count, is_error, updated_at) VALUES {} \\n            ON CONFLICT (full_name) DO UPDATE SET star_count = EXCLUDED.star_count, updated_at = EXCLUDED.updated_at, is_error = false",
            values.join(", ")
        );
        sqlx::query(&insert).execute(&pool).await?;
    }

    // Mark errors for repos we didn't get data for
    let error_repos: Vec<&String> = repos
        .iter()
        .filter(|r| !stars.contains_key(&***r))
        .collect();
    if !error_repos.is_empty() {
        let mut err_values: Vec<String> = Vec::new();
        for full in error_repos {
            let safe = full.replace("'", "''");
            err_values.push(format!("('{}', NULL, NULL, NULL, true, NOW())", safe));
        }
        let insert_err = format!(
            "INSERT INTO github_repositories_by_name (full_name, node_id, database_id, star_count, is_error, updated_at) VALUES {} \\n            ON CONFLICT (full_name) DO UPDATE SET is_error = true, updated_at = NOW()",
            err_values.join(", ")
        );
        sqlx::query(&insert_err).execute(&pool).await?;
    }

    info!(success, errors = repos.len() - success, "backfill complete");
    Ok(())
}

fn init_tracing() {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};

    let fmt_layer = fmt::layer().with_target(false);
    let filter_layer = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new("info"))
        .expect("failed to create env filter");

    tracing_subscriber::registry()
        .with(fmt_layer)
        .with(filter_layer)
        .init();
}
