use std::env;

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct CommunityConfig {
    pub base: BaseConfig,
    pub run_migrations: bool,
}

impl CommunityConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut base = BaseConfig::from_env("community", 9008)?;

        if let Some(url) = env::var("COMMUNITY_DATABASE_URL")
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
