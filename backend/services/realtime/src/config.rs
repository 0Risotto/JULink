use std::{env, time::Duration};

use julink_common::config::BaseConfig;

#[derive(Clone)]
pub struct RealtimeConfig {
    pub base: BaseConfig,
    pub messaging_url: String,
    pub ticket_ttl: Duration,
}

impl RealtimeConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let base = BaseConfig::from_env("realtime", 9006)?;
        let messaging_url =
            env::var("MESSAGING_URL").unwrap_or_else(|_| "http://localhost:9005".to_string());
        let ticket_ttl = env::var("TICKET_TTL_SECONDS")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .map(Duration::from_secs)
            .unwrap_or(Duration::from_secs(30));

        Ok(Self {
            base,
            messaging_url,
            ticket_ttl,
        })
    }
}
