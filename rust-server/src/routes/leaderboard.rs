use std::collections::{BTreeMap, BTreeSet};

use axum::{
    extract::{Query, State},
    http::{header, StatusCode},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use sqlx::Row;

use crate::{
    state::AppState,
    types::{LeaderboardData, LeaderboardQueryParams},
    utils::{cache_control_header_value, parse_date_yyyy_mm_dd, DEFAULT_START_DATE},
};

// AppState is shared from crate::state

pub async fn get_leaderboard(
    State(state): State<AppState>,
    Query(params): Query<LeaderboardQueryParams>,
) -> impl IntoResponse {
    let view_type = params.view_type.as_deref().unwrap_or("weekly");
    if view_type != "weekly" && view_type != "monthly" {
        let body = Json(json!({"error": "Invalid viewType. Must be \"weekly\" or \"monthly\""}));
        return (StatusCode::BAD_REQUEST, body).into_response();
    }

    let view_name = if view_type == "weekly" {
        "mv_bot_reviews_repo_7d"
    } else {
        "mv_bot_reviews_repo_30d"
    };

    // Always fetch a very wide date range
    let query_start_date = DEFAULT_START_DATE.to_string();
    let query_end_date = chrono::Utc::now()
        .checked_add_days(chrono::Days::new(365))
        .unwrap()
        .format("%Y-%m-%d")
        .to_string();

    let sql = format!(
        "SELECT event_date::text AS event_date, bot_id, repo_count FROM {} WHERE event_date BETWEEN $1 AND $2 ORDER BY event_date ASC",
        view_name
    );

    let rows = match sqlx::query(&sql)
        .bind(&query_start_date)
        .bind(&query_end_date)
        .fetch_all(&state.pool)
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let body = Json(json!({"error": format!("Failed to fetch leaderboard data: {}", e)}));
            return (StatusCode::INTERNAL_SERVER_ERROR, body).into_response();
        }
    };

    if rows.is_empty() {
        let data = LeaderboardData { timestamps: vec![], tools: BTreeMap::new() };
        let headers = [(header::CACHE_CONTROL, cache_control_header_value())];
        return (StatusCode::OK, headers, Json(data)).into_response();
    }

    let mut date_groups: BTreeMap<String, Vec<(i64, i64)>> = BTreeMap::new(); // date -> [(bot_id, repo_count)]
    let mut all_bot_ids: BTreeSet<i64> = BTreeSet::new();

    for row in rows {
        let date: String = row.try_get("event_date").unwrap_or_default();
        let bot_id: i64 = row.try_get("bot_id").unwrap_or(0);
        let repo_count: i64 = row.try_get("repo_count").unwrap_or(0);
        all_bot_ids.insert(bot_id);
        date_groups.entry(date).or_default().push((bot_id, repo_count));
    }

    let sorted_dates: Vec<String> = date_groups.keys().cloned().collect();

    let mut timestamps: Vec<i64> = Vec::with_capacity(sorted_dates.len());
    for date in &sorted_dates {
        if let Some(ts) = parse_date_yyyy_mm_dd(date) {
            timestamps.push(ts);
        }
    }

    let mut tools: BTreeMap<String, Vec<i64>> = BTreeMap::new();
    for bot_id in &all_bot_ids {
        tools.insert(bot_id.to_string(), vec![0; sorted_dates.len()]);
    }

    for (date_index, date) in sorted_dates.iter().enumerate() {
        if let Some(day_data) = date_groups.get(date) {
            for (bot_id, repo_count) in day_data {
                let key = bot_id.to_string();
                if let Some(series) = tools.get_mut(&key) {
                    series[date_index] = *repo_count;
                }
            }
        }
    }

    let data = LeaderboardData { timestamps, tools };
    let headers = [(header::CACHE_CONTROL, cache_control_header_value())];
    (StatusCode::OK, headers, Json(data)).into_response()
}
