use std::collections::HashMap;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{error, info};

use crate::types::TopRepo;

pub type RepoFullName = String; // "owner/name"

#[derive(Debug, Clone, Serialize)]
pub struct GithubRepoGraphQLData {
    pub full_name: String,
    pub node_id: String,
    pub database_id: i64,
    pub star_count: i64,
    pub is_error: bool,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
struct GraphQlResponse<T> {
    data: Option<T>,
    errors: Option<Vec<serde_json::Value>>, // for logging only
}

#[derive(Debug, Deserialize)]
struct RepoResult {
    #[serde(rename = "stargazerCount")]
    stargazer_count: Option<i64>,
    id: Option<String>,
    #[serde(rename = "databaseId")]
    database_id: Option<i64>,
}

pub struct GitHubApi {
    client: Client,
    token: String,
}

impl GitHubApi {
    pub fn new_from_env() -> anyhow::Result<Self> {
        let token = std::env::var("GITHUB_TOKEN")?;
        Ok(Self {
            client: Client::new(),
            token,
        })
    }

    pub async fn fetch_repo_stars(&self, repos: &[RepoFullName]) -> anyhow::Result<HashMap<RepoFullName, i64>> {
        // Chunk into 100 aliases
        let mut out: HashMap<RepoFullName, i64> = HashMap::new();
        for chunk in repos.chunks(100) {
            let mut body = String::new();
            for (j, full) in chunk.iter().enumerate() {
                let (owner, name) = match full.split_once('/') {
                    Some(t) => t,
                    None => {
                        continue;
                    }
                };
                body.push_str(&format!(
                    "r{}: repository(owner:\"{}\", name:\"{}\") {{ stargazerCount id databaseId }}\n",
                    j, owner, name
                ));
            }
            let query = format!("query {{ {} }}", body);

            let resp = self
                .client
                .post("https://api.github.com/graphql")
                .header("Authorization", format!("bearer {}", self.token))
                .header("User-Agent", "devtools-api-rust")
                .json(&serde_json::json!({ "query": query }))
                .send()
                .await?;

            if !resp.status().is_success() {
                error!(status=?resp.status(), "GitHub GraphQL request failed");
                continue;
            }

            let json: serde_json::Value = resp.json().await?;
            if let Some(obj) = json.get("data").and_then(|d| d.as_object()) {
                for (k, v) in obj {
                    if !k.starts_with('r') { continue; }
                    if let Some(repo) = v.as_object() {
                        let st = repo.get("stargazerCount").and_then(|x| x.as_i64());
                        if let Some(stars) = st {
                            // We don't know which alias maps to which repo here without storing mapping; recompute via index
                            let idx: usize = k[1..].parse().unwrap_or(0);
                            if let Some(full) = chunk.get(idx) {
                                out.insert(full.clone(), stars);
                            }
                        }
                    }
                }
            }
        }
        Ok(out)
    }

    pub async fn get_repository_graphql_data(
        &self,
        repos: &[RepoFullName],
    ) -> anyhow::Result<(HashMap<RepoFullName, GithubRepoGraphQLData>, Vec<RepoFullName>)> {
        let mut repo_data: HashMap<RepoFullName, GithubRepoGraphQLData> = HashMap::new();
        let mut error_repos: Vec<RepoFullName> = Vec::new();

        for chunk in repos.chunks(100) {
            let mut body = String::new();
            for (j, full) in chunk.iter().enumerate() {
                let (owner, name) = match full.split_once('/') {
                    Some(t) => t,
                    None => continue,
                };
                body.push_str(&format!(
                    "r{}: repository(owner:\"{}\", name:\"{}\") {{ stargazerCount id databaseId }}\n",
                    j, owner, name
                ));
            }
            let query = format!("query {{ {} }}", body);

            let resp = self
                .client
                .post("https://api.github.com/graphql")
                .header("Authorization", format!("bearer {}", self.token))
                .header("User-Agent", "devtools-api-rust")
                .json(&serde_json::json!({ "query": query }))
                .send()
                .await?;

            let now_iso = chrono::Utc::now().to_rfc3339();

            if !resp.status().is_success() {
                error!(status=?resp.status(), "GitHub GraphQL request failed");
                // mark all in this chunk as errors
                error_repos.extend(chunk.iter().cloned());
                continue;
            }

            let json: serde_json::Value = resp.json().await?;
            if let Some(obj) = json.get("data").and_then(|d| d.as_object()) {
                for (k, v) in obj {
                    if !k.starts_with('r') { continue; }
                    let idx: usize = k[1..].parse().unwrap_or(0);
                    let Some(full) = chunk.get(idx) else { continue };
                    match v.as_object() {
                        Some(repo) => {
                            let st = repo.get("stargazerCount").and_then(|x| x.as_i64());
                            let id = repo.get("id").and_then(|x| x.as_str()).map(|s| s.to_string());
                            let dbid = repo.get("databaseId").and_then(|x| x.as_i64());
                            if let (Some(stars), Some(node_id), Some(database_id)) = (st, id, dbid) {
                                repo_data.insert(
                                    full.clone(),
                                    GithubRepoGraphQLData {
                                        full_name: full.clone(),
                                        node_id,
                                        database_id,
                                        star_count: stars,
                                        is_error: false,
                                        updated_at: now_iso.clone(),
                                    },
                                );
                            } else {
                                error_repos.push(full.clone());
                            }
                        }
                        None => {
                            error_repos.push(full.clone());
                        }
                    }
                }
            } else {
                error_repos.extend(chunk.iter().cloned());
            }
        }

        Ok((repo_data, error_repos))
    }
}
