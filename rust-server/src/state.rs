use crate::db::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}
