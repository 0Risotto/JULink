use std::env;

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct CallsConfig {
    pub base: BaseConfig,
    pub identity_url: String,
    pub messaging_url: String,
    pub jitsi_base_url: String,
    pub run_migrations: bool,
}

impl CallsConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let mut base = BaseConfig::from_env("calls", 9007)?;

        if let Some(url) = env::var("CALLS_DATABASE_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            base.database_url = Some(url);
        }

        let identity_url =
            env::var("IDENTITY_URL").unwrap_or_else(|_| "http://localhost:9000".to_string());
        let messaging_url =
            env::var("MESSAGING_URL").unwrap_or_else(|_| "http://localhost:9005".to_string());
        let jitsi_base_url = env::var("JITSI_BASE_URL")
            .unwrap_or_else(|_| "https://meet.jit.si".to_string())
            .trim_end_matches('/')
            .to_string();
        let run_migrations =
            parse_bool(env::var("RUN_MIGRATIONS").ok().as_deref()).unwrap_or(base.is_dev());

        Ok(Self {
            base,
            identity_url,
            messaging_url,
            jitsi_base_url,
            run_migrations,
        })
    }
}
