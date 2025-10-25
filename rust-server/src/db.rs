use sqlx::{postgres::PgPoolOptions, Pool, Postgres, Row};

pub type PgPool = Pool<Postgres>;

pub async fn connect_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
}
