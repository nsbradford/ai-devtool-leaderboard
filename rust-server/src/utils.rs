use axum::http::{header, HeaderValue};
use chrono::{Datelike, NaiveDate, TimeZone, Utc};
use std::time::Duration;

pub const DEFAULT_START_DATE: &str = "2023-07-01";

// Embed devtools.json at compile-time
pub const DEVTOOLS_JSON: &str = include_str!("../assets/devtools.json");

pub fn seconds_until_cache_reset(target_hour_utc: u32, target_minute_utc: u32) -> u64 {
    let now = Utc::now();
    let mut target = now
        .date_naive()
        .and_hms_opt(target_hour_utc, target_minute_utc, 0)
        .unwrap();

    if now.timestamp() >= Utc.from_utc_datetime(&target).timestamp() {
        // move to tomorrow
        let next_day = now.date_naive().succ_opt().unwrap();
        target = next_day
            .and_hms_opt(target_hour_utc, target_minute_utc, 0)
            .unwrap();
    }

    let diff = Utc.from_utc_datetime(&target).timestamp() - now.timestamp();
    diff as u64
}

pub fn cache_control_header_value() -> HeaderValue {
    let ttl_seconds = seconds_until_cache_reset(6, 0);
    let value = format!(
        "public, max-age=0, s-maxage={}, stale-while-revalidate=60",
        ttl_seconds
    );
    HeaderValue::from_str(&value).unwrap()
}

pub fn parse_date_yyyy_mm_dd(date: &str) -> Option<i64> {
    // Returns unix timestamp (seconds) at 00:00:00Z
    NaiveDate::parse_from_str(date, "%Y-%m-%d")
        .ok()
        .and_then(|d| d.and_hms_opt(0, 0, 0))
        .map(|dt| Utc.from_utc_datetime(&dt).timestamp())
}
