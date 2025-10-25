use std::collections::BTreeMap;

use axum::{
    extract::{Query, State},
    http::{header, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::json;
use sqlx::Row;

use crate::{state::AppState, types::TopRepo, utils::cache_control_header_value};

// AppState is shared from crate::state

#[derive(Debug, Deserialize)]
pub struct TopReposQueryParams {
    pub limit: Option<i32>,
    #[serde(rename = "daysBack")]
    pub days_back: Option<i32>,
}

pub async fn get_top_repos(
    State(state): State<AppState>,
    Query(params): Query<TopReposQueryParams>,
) -> impl IntoResponse {
    let limit = params.limit.unwrap_or(5);
    let days_back = params.days_back.unwrap_or(30);

    if !(1..=20).contains(&limit) {
        let body = Json(json!({"error": "Invalid limit. Must be between 1 and 20"}));
        return (StatusCode::BAD_REQUEST, body).into_response();
    }
    if !(1..=365).contains(&days_back) {
        let body = Json(json!({"error": "Invalid daysBack. Must be between 1 and 365"}));
        return (StatusCode::BAD_REQUEST, body).into_response();
    }

    let cutoff_date = chrono::Utc::now()
        .checked_sub_days(chrono::Days::new(days_back as u64))
        .unwrap()
        .format("%Y-%m-%d")
        .to_string();

    let query = r#"
        WITH recent_bot_activity AS (
            SELECT DISTINCT br.bot_id, br.repo_db_id
            FROM bot_reviews_daily_by_repo br
            WHERE br.event_date >= $1::date
        ),
        latest_repo_names AS (
            SELECT DISTINCT ON (database_id)
                database_id,
                full_name AS repo_name,
                updated_at
            FROM github_repositories_by_name
            WHERE is_error = false
            ORDER BY database_id, updated_at DESC
        ),
        ranked_repos AS (
            SELECT 
                rba.bot_id,
                grbn.database_id AS repo_db_id,
                lrn.repo_name,
                grbn.star_count,
                ROW_NUMBER() OVER (
                    PARTITION BY rba.bot_id 
                    ORDER BY grbn.star_count DESC NULLS LAST
                ) as rank
            FROM recent_bot_activity rba
            LEFT JOIN github_repositories_by_name grbn ON rba.repo_db_id = grbn.database_id
            LEFT JOIN latest_repo_names lrn ON grbn.database_id = lrn.database_id
            WHERE grbn.star_count IS NOT NULL 
              AND grbn.is_error = false
        )
        SELECT 
            bot_id,
            repo_db_id,
            repo_name,
            star_count
        FROM ranked_repos
        WHERE rank <= $2
        ORDER BY bot_id, rank;
    "#;

    let rows = match sqlx::query(query)
        .bind(&cutoff_date)
        .bind(limit)
        .fetch_all(&state.pool)
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let body = Json(json!({"error": format!("Failed to get top repos data: {}", e)}));
            return (StatusCode::INTERNAL_SERVER_ERROR, body).into_response();
        }
    };

    let mut grouped: BTreeMap<String, Vec<TopRepo>> = BTreeMap::new();
    for row in rows {
        let bot_id: i64 = row.try_get("bot_id").unwrap_or(0);
        let repo_db_id: i64 = row.try_get("repo_db_id").unwrap_or(0);
        let repo_name: String = row.try_get("repo_name").unwrap_or_default();
        let star_count: i64 = row.try_get("star_count").unwrap_or(0);

        grouped.entry(bot_id.to_string()).or_default().push(TopRepo {
            repo_db_id,
            repo_name,
            star_count,
        });
    }

    let headers = [(header::CACHE_CONTROL, cache_control_header_value())];
    (StatusCode::OK, headers, Json(grouped)).into_response()
}
