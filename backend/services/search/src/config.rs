use std::{env, time::Duration};

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct SearchConfig {
    pub base: BaseConfig,
    pub identity_url: String,
    pub content_url: String,
    pub sync_interval: Duration,
    pub sync_enabled: bool,
    pub sync_page_size: u32,
    pub sync_max_pages: u32,
    pub run_migrations: bool,
}

impl SearchConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut base = BaseConfig::from_env("search", 9004)?;

        if let Some(url) = env::var("SEARCH_DATABASE_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            base.database_url = Some(url);
        }

        let identity_url =
            env::var("IDENTITY_URL").unwrap_or_else(|_| "http://localhost:9000".to_string());
        let content_url =
            env::var("CONTENT_URL").unwrap_or_else(|_| "http://localhost:9002".to_string());
        let sync_interval = env::var("SYNC_INTERVAL_SECONDS")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .map(Duration::from_secs)
            .unwrap_or(Duration::from_secs(60));
        let sync_enabled = parse_bool(env::var("SYNC_ENABLED").ok().as_deref()).unwrap_or(true);
        let sync_page_size = env::var("SYNC_PAGE_SIZE")
            .ok()
            .and_then(|value| value.parse::<u32>().ok())
            .unwrap_or(500)
            .clamp(1, 1000);
        let sync_max_pages = env::var("SYNC_MAX_PAGES")
            .ok()
            .and_then(|value| value.parse::<u32>().ok())
            .unwrap_or(10)
            .clamp(1, 100);
        let run_migrations =
            parse_bool(env::var("RUN_MIGRATIONS").ok().as_deref()).unwrap_or(base.is_dev());

        Ok(Self {
            base,
            identity_url,
            content_url,
            sync_interval,
            sync_enabled,
            sync_page_size,
            sync_max_pages,
            run_migrations,
        })
    }
}
