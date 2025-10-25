use std::{net::SocketAddr, sync::Arc};

use axum::{
    http::Method,
    routing::get,
    Router,
};
use tower_http::{cors::{Any, CorsLayer}, trace::TraceLayer};
use tracing::{error, info};

mod db;
mod routes;
mod types;
mod utils;
mod state;

use db::{connect_pool, PgPool};
use routes::{devtools::get_devtools, leaderboard::get_leaderboard, leaderboard_reviews::get_leaderboard_reviews, top_repos::get_top_repos};
use state::AppState;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    init_tracing();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = connect_pool(&database_url)
        .await
        .expect("Failed to connect to Postgres");

    let app_state = AppState { pool: pool.clone() };

    let app = Router::new()
        .route("/api/devtools", get(get_devtools))
        .route("/api/leaderboard", get(get_leaderboard))
        .route("/api/leaderboard-reviews", get(get_leaderboard_reviews))
        .route("/api/top-repos", get(get_top_repos))
        .with_state(app_state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET])
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http());

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(3001);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("listening on {}", addr);

    if let Err(e) = axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app).await {
        error!("server error: {:?}", e);
    }
}

fn init_tracing() {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};

    let fmt_layer = fmt::layer().with_target(false);
    let filter_layer = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new("info,tower_http=info,sqlx=warn"))
        .expect("failed to create env filter");

    tracing_subscriber::registry()
        .with(fmt_layer)
        .with(filter_layer)
        .init();
}
