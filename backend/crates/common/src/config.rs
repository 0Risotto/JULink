use std::{env, str::FromStr};

use anyhow::{Context, Result};
use http::HeaderValue;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum LogFormat {
    #[default]
    Pretty,
    Json,
}

impl FromStr for LogFormat {
    type Err = anyhow::Error;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim().to_ascii_lowercase().as_str() {
            "json" => Ok(Self::Json),
            "pretty" | "text" => Ok(Self::Pretty),
            other => {
                anyhow::bail!("unsupported LOG_FORMAT `{other}` (expected `pretty` or `json`)")
            }
        }
    }
}

#[derive(Clone, Debug)]
pub struct BaseConfig {
    pub service_name: String,
    pub port: u16,
    pub env: String,
    pub database_url: Option<String>,
    pub nats_url: Option<String>,
    pub cors_origins: Vec<HeaderValue>,
    pub log_format: LogFormat,
    pub dev_auth: bool,
}

impl BaseConfig {
    pub fn from_env(service_name: &str, default_port: u16) -> Result<Self> {
        let _ = dotenvy::dotenv();

        let env_name = env::var("JULINK_ENV").unwrap_or_else(|_| "dev".to_string());

        let port = match env::var("PORT") {
            Ok(value) => value
                .parse::<u16>()
                .with_context(|| format!("invalid PORT `{value}`"))?,
            Err(_) => default_port,
        };

        let database_url = env::var("DATABASE_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        let nats_url = env::var("NATS_URL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        let cors_origins = env::var("CORS_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000".to_string())
            .split(',')
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| {
                HeaderValue::from_str(value)
                    .with_context(|| format!("invalid CORS origin `{value}`"))
            })
            .collect::<Result<Vec<_>>>()?;

        let default_log_format = if env_name == "dev" { "pretty" } else { "json" };
        let log_format = env::var("LOG_FORMAT")
            .unwrap_or_else(|_| default_log_format.to_string())
            .parse()?;

        let dev_auth = parse_bool(env::var("DEV_AUTH").ok().as_deref()).unwrap_or(false);

        Ok(Self {
            service_name: service_name.to_string(),
            port,
            env: env_name,
            database_url,
            nats_url,
            cors_origins,
            log_format,
            dev_auth,
        })
    }

    pub fn is_dev(&self) -> bool {
        self.env == "dev"
    }
}

pub fn parse_bool(value: Option<&str>) -> Option<bool> {
    value.map(|value| {
        matches!(
            value.trim().to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "on"
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_bools() {
        assert_eq!(parse_bool(Some("true")), Some(true));
        assert_eq!(parse_bool(Some("1")), Some(true));
        assert_eq!(parse_bool(Some("0")), Some(false));
        assert_eq!(parse_bool(None), None);
    }

    #[test]
    fn parses_log_format() {
        assert_eq!("json".parse::<LogFormat>().unwrap(), LogFormat::Json);
        assert_eq!("PRETTY".parse::<LogFormat>().unwrap(), LogFormat::Pretty);
        assert!("xml".parse::<LogFormat>().is_err());
    }
}
