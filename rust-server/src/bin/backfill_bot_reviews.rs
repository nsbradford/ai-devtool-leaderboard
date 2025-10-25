use clap::Parser;
use tracing::{error, info};

use devtools_api_rust::{bq::get_bot_reviews_for_day, db::connect_pool};

#[derive(Parser, Debug)]
#[command(version, about = "Backfill bot reviews for a single date")] 
struct Args {
    /// YYYY-MM-DD
    #[arg(long)]
    date: String,
    /// Comma separated bot ids
    #[arg(long)]
    bot_ids: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    init_tracing();

    let args = Args::parse();

    let database_url = std::env::var("DATABASE_URL")?;
    let pool = connect_pool(&database_url).await?;

    let bot_ids: Vec<i64> = args
        .bot_ids
        .as_deref()
        .unwrap_or("")
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    let ids = if bot_ids.is_empty() { vec![] } else { bot_ids };

    let rows = get_bot_reviews_for_day(&args.date, &ids).await?;

    // Upsert into bot_reviews_daily_by_repo
    if rows.is_empty() {
        info!("no rows to upsert");
        return Ok(());
    }

    // Build one big insert with ON CONFLICT, similar to TS implementation
    let mut values: Vec<String> = Vec::new();
    for r in &rows {
        let safe_name = r.repo_full_name.replace("'", "''");
        values.push(format!(
            "('{}', {}, {}, '{}', {}, {})",
            r.event_date, r.bot_id, r.repo_db_id, safe_name, r.bot_review_count, r.pr_count
        ));
    }

    let sql = format!(
        "INSERT INTO bot_reviews_daily_by_repo (event_date, bot_id, repo_db_id, repo_full_name, bot_review_count, pr_count) VALUES {} \\n        ON CONFLICT (event_date, bot_id, repo_db_id) DO UPDATE SET bot_review_count = EXCLUDED.bot_review_count, pr_count = EXCLUDED.pr_count, repo_full_name = EXCLUDED.repo_full_name;",
        values.join(", ")
    );

    if let Err(e) = sqlx::query(&sql).execute(&pool).await {
        error!(?e, "failed to upsert bot reviews");
        anyhow::bail!(e)
    }

    info!("upserted {} rows", rows.len());
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
