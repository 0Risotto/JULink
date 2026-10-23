use std::{env, time::Duration};

use julink_common::config::{BaseConfig, parse_bool};

#[derive(Clone)]
pub struct SmtpConfig {
    pub host: Option<String>,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub from: String,
}

#[derive(Clone)]
pub struct IdentityConfig {
    pub base: BaseConfig,
    pub issuer: String,
    pub access_ttl: Duration,
    pub refresh_ttl: Duration,
    pub run_migrations: bool,
    pub jwt_private_key_pem: Option<String>,
    pub otp_ttl: Duration,
    pub otp_max_attempts: i32,
    pub otp_resend_cooldown: Duration,
    pub dev_otp: bool,
    pub cookie_name: String,
    pub cookie_path: String,
    pub cookie_secure: bool,
    pub smtp: SmtpConfig,
}

impl IdentityConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let base = BaseConfig::from_env("identity", 9000)?;

        let issuer = env::var("JWT_ISSUER").unwrap_or_else(|_| "julink".to_string());
        let access_ttl = seconds_from_env("JWT_TTL_SECONDS", 900);
        let refresh_ttl = seconds_from_env("REFRESH_TTL_SECONDS", 30 * 24 * 60 * 60);
        let otp_ttl = seconds_from_env("OTP_TTL_SECONDS", 10 * 60);
        let otp_resend_cooldown = seconds_from_env("OTP_RESEND_COOLDOWN_SECONDS", 60);

        let run_migrations =
            parse_bool(env::var("RUN_MIGRATIONS").ok().as_deref()).unwrap_or(base.is_dev());
        let dev_otp = parse_bool(env::var("DEV_OTP").ok().as_deref()).unwrap_or(false);
        let cookie_secure =
            parse_bool(env::var("COOKIE_SECURE").ok().as_deref()).unwrap_or(!base.is_dev());

        let jwt_private_key_pem = env::var("JWT_PRIVATE_KEY_PEM")
            .ok()
            .map(|value| value.replace("\\n", "\n"));

        let otp_max_attempts = env::var("OTP_MAX_ATTEMPTS")
            .ok()
            .and_then(|value| value.parse::<i32>().ok())
            .unwrap_or(5);

        let smtp = SmtpConfig {
            host: non_empty_env("SMTP_HOST"),
            port: env::var("SMTP_PORT")
                .ok()
                .and_then(|value| value.parse::<u16>().ok())
                .unwrap_or(587),
            username: non_empty_env("SMTP_USERNAME"),
            password: non_empty_env("SMTP_PASSWORD"),
            from: env::var("SMTP_FROM")
                .unwrap_or_else(|_| "JULink <no-reply@julink.local>".to_string()),
        };

        Ok(Self {
            base,
            issuer,
            access_ttl,
            refresh_ttl,
            run_migrations,
            jwt_private_key_pem,
            otp_ttl,
            otp_max_attempts,
            otp_resend_cooldown,
            dev_otp,
            cookie_name: env::var("COOKIE_NAME").unwrap_or_else(|_| "julink_refresh".to_string()),
            cookie_path: env::var("COOKIE_PATH").unwrap_or_else(|_| "/api/v1/auth".to_string()),
            cookie_secure,
            smtp,
        })
    }
}

fn seconds_from_env(key: &str, default: u64) -> Duration {
    Duration::from_secs(
        env::var(key)
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .unwrap_or(default),
    )
}

fn non_empty_env(key: &str) -> Option<String> {
    env::var(key)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}
