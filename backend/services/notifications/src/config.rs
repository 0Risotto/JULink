use std::env;

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct NotificationsConfig {
    pub base: BaseConfig,
    pub messaging_url: String,
    pub run_migrations: bool,
}

impl NotificationsConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut base = BaseConfig::from_env("notifications", 9009)?;

        if let Some(url) = env::var("NOTIFICATIONS_DATABASE_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            base.database_url = Some(url);
        }

        let messaging_url =
            env::var("MESSAGING_URL").unwrap_or_else(|_| "http://localhost:9005".to_string());
        let run_migrations =
            parse_bool(env::var("RUN_MIGRATIONS").ok().as_deref()).unwrap_or(base.is_dev());

        Ok(Self {
            base,
            messaging_url,
            run_migrations,
        })
    }
}
