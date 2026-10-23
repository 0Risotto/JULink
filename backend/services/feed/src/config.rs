use std::{env, time::Duration};

use julink_common::config::BaseConfig;

#[derive(Clone)]
pub struct FeedConfig {
    pub base: BaseConfig,
    pub social_url: String,
    pub content_url: String,
    pub identity_url: String,
    pub cache_ttl: Duration,
}

impl FeedConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let base = BaseConfig::from_env("feed", 9003)?;
        let social_url =
            env::var("SOCIAL_URL").unwrap_or_else(|_| "http://localhost:9001".to_string());
        let content_url =
            env::var("CONTENT_URL").unwrap_or_else(|_| "http://localhost:9002".to_string());
        let identity_url =
            env::var("IDENTITY_URL").unwrap_or_else(|_| "http://localhost:9000".to_string());
        let cache_ttl = env::var("FEED_CACHE_TTL_SECONDS")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .map(Duration::from_secs)
            .unwrap_or(Duration::from_secs(60));

        Ok(Self {
            base,
            social_url,
            content_url,
            identity_url,
            cache_ttl,
        })
    }
}
