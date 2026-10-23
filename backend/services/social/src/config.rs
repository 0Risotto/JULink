use std::env;

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct SocialConfig {
    pub base: BaseConfig,
    pub identity_url: String,
    pub neo4j_uri: Option<String>,
    pub neo4j_user: String,
    pub neo4j_password: String,
    pub run_migrations: bool,
}

impl SocialConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut base = BaseConfig::from_env("social", 9001)?;

        if let Some(url) = env::var("SOCIAL_DATABASE_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            base.database_url = Some(url);
        }

        let neo4j_uri = env::var("NEO4J_URI")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let neo4j_user = env::var("NEO4J_USER").unwrap_or_else(|_| "neo4j".to_string());
        let neo4j_password = env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo4j".to_string());

        if neo4j_uri.is_some() && !base.is_dev() && env::var("NEO4J_PASSWORD").is_err() {
            anyhow::bail!("NEO4J_PASSWORD is required outside development");
        }

        let identity_url =
            env::var("IDENTITY_URL").unwrap_or_else(|_| "http://localhost:9000".to_string());
        let run_migrations =
            parse_bool(env::var("RUN_MIGRATIONS").ok().as_deref()).unwrap_or(base.is_dev());

        Ok(Self {
            base,
            identity_url,
            neo4j_uri,
            neo4j_user,
            neo4j_password,
            run_migrations,
        })
    }
}
