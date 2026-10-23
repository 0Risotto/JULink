use std::env;

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct MessagingConfig {
    pub base: BaseConfig,
    pub identity_url: String,
    pub run_migrations: bool,
}

impl MessagingConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut base = BaseConfig::from_env("messaging", 9005)?;

        if let Some(url) = env::var("MESSAGING_DATABASE_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            base.database_url = Some(url);
        }

        let identity_url =
            env::var("IDENTITY_URL").unwrap_or_else(|_| "http://localhost:9000".to_string());
        let run_migrations =
            parse_bool(env::var("RUN_MIGRATIONS").ok().as_deref()).unwrap_or(base.is_dev());

        Ok(Self {
            base,
            identity_url,
            run_migrations,
        })
    }
}
