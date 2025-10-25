use axum::{
    http::{header, HeaderValue, StatusCode},
    response::IntoResponse,
};

use crate::utils::{cache_control_header_value, DEVTOOLS_JSON};

pub async fn get_devtools() -> impl IntoResponse {
    let headers = [
        (header::CONTENT_TYPE, HeaderValue::from_static("application/json")),
        (header::CACHE_CONTROL, cache_control_header_value()),
    ];
    (StatusCode::OK, headers, DEVTOOLS_JSON).into_response()
}
