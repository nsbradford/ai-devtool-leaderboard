use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use gcp_bigquery_client::{client::BigqueryClient, model::query_request::QueryRequest};
use serde::Deserialize;
use tracing::{error, info};

#[derive(Debug, Deserialize, Clone)]
pub struct BotReviewInRepoDate {
    pub event_date: String,
    pub repo_db_id: i64,
    pub repo_full_name: String,
    pub bot_id: i64,
    pub bot_review_count: i64,
    pub pr_count: i64,
}

fn parse_google_credentials() -> Option<serde_json::Value> {
    let b64 = std::env::var("GOOGLE_APPLICATION_CREDENTIALS").ok()?;
    let decoded = BASE64.decode(b64).ok()?;
    serde_json::from_slice::<serde_json::Value>(&decoded).ok()
}

pub async fn get_bot_reviews_for_day(target_date: &str, bot_ids: &[i64]) -> anyhow::Result<Vec<BotReviewInRepoDate>> {
    let project_id = std::env::var("GOOGLE_CLOUD_PROJECT_ID")?;
    let creds = parse_google_credentials();
    let client = if let Some(json) = creds {
        BigqueryClient::from_service_account_key(&json.to_string()).await?
    } else {
        BigqueryClient::new(&project_id).await?
    };

    let bot_list = bot_ids
        .iter()
        .map(|id| id.to_string())
        .collect::<Vec<_>>()
        .join(", ");

    let query = format!(
        r#"
DECLARE target_date DATE DEFAULT DATE('{date}');
DECLARE bot_id_list ARRAY<INT64> DEFAULT [{bots}];

SELECT
  target_date                     AS event_date,
  ARRAY_AGG(repo.name ORDER BY repo.name DESC LIMIT 1)[OFFSET(0)] AS repo_name,
  repo.id                        AS repo_db_id,
  actor.id                       AS bot_id,
  COUNT(*)                       AS bot_review_count,
  COUNT(DISTINCT JSON_EXTRACT_SCALAR(payload, '$.pull_request.id')) AS pr_count
FROM `githubarchive.day.20*`
WHERE _TABLE_SUFFIX = FORMAT_DATE('%y%m%d', target_date)
  AND type          = 'PullRequestReviewEvent'
  AND actor.id      IN UNNEST(bot_id_list)
GROUP BY repo.id, actor.id, target_date;
        "#,
        date = target_date,
        bots = bot_list
    );

    let mut req = QueryRequest::new(query);
    req.use_legacy_sql = Some(false);

    let result = client.job().query(&project_id, req).await?;

    let mut out = Vec::new();
    for row in result.rows.unwrap_or_default() {
        let event_date = row.f_get_string_ok("event_date").unwrap_or_default();
        let repo_db_id = row.f_get_i64_ok("repo_db_id").unwrap_or_default();
        let bot_id = row.f_get_i64_ok("bot_id").unwrap_or_default();
        let bot_review_count = row.f_get_i64_ok("bot_review_count").unwrap_or_default();
        let pr_count = row.f_get_i64_ok("pr_count").unwrap_or_default();
        let repo_full_name = row.f_get_string_ok("repo_name").unwrap_or_default();

        out.push(BotReviewInRepoDate {
            event_date,
            repo_db_id,
            repo_full_name,
            bot_id,
            bot_review_count,
            pr_count,
        });
    }

    Ok(out)
}
