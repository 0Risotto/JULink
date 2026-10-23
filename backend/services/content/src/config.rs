use std::env;

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct ContentConfig {
    pub base: BaseConfig,
    pub run_migrations: bool,
}

impl ContentConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut base = BaseConfig::from_env("content", 9002)?;

        if let Some(url) = env::var("CONTENT_DATABASE_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            base.database_url = Some(url);
        }

        let run_migrations =
            parse_bool(env::var("RUN_MIGRATIONS").ok().as_deref()).unwrap_or(base.is_dev());

        Ok(Self {
            base,
            run_migrations,
        })
    }
}
