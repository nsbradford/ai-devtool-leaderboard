use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DevTool {
    pub id: i64,
    pub account_login: String,
    pub name: String,
    pub avatar_url: String,
    pub website_url: String,
    pub brand_color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand_color_dark: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct LeaderboardData {
    pub timestamps: Vec<i64>,
    pub tools: BTreeMap<String, Vec<i64>>, // tool_id -> repo_count[] or review_count[]
}

#[derive(Debug, Deserialize)]
pub struct LeaderboardQueryParams {
    #[serde(rename = "viewType")]
    pub view_type: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TopRepo {
    pub repo_db_id: i64,
    pub repo_name: String,
    pub star_count: i64,
}

pub type TopReposByDevtool = BTreeMap<String, Vec<TopRepo>>;
