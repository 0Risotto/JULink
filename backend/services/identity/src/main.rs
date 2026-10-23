use std::sync::Arc;

use julink_common::{service::ServiceBuilder, telemetry};

use julink_identity::{
    auth::AuthKeys, config::IdentityConfig, email::EmailService, otp::OtpHasher, routes::router,
    state::IdentityState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = IdentityConfig::from_env()?;
    telemetry::init("identity", config.base.log_format);

    let keys = Arc::new(AuthKeys::load_or_generate(
        config.jwt_private_key_pem.as_deref(),
        &config.issuer,
    )?);

    if config.base.dev_auth && !config.base.is_dev() {
        anyhow::bail!("DEV_AUTH is only allowed when JULINK_ENV=dev");
    }
    if config.dev_otp && !config.base.is_dev() {
        anyhow::bail!("DEV_OTP is only allowed when JULINK_ENV=dev");
    }

    let otp = OtpHasher::from_env(config.base.is_dev())?;
    let email = EmailService::from_config(&config.smtp, config.base.is_dev())?;

    let database_url = config
        .base
        .database_url
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("DATABASE_URL is required for the identity service"))?;
    let db = julink_common::db::connect(database_url).await?;

    if config.run_migrations {
        sqlx::migrate!("./migrations").run(&db).await?;
    }

    let state = IdentityState {
        db: db.clone(),
        keys,
        otp,
        email,
        config: config.clone(),
    };

    let app = router(state);

    ServiceBuilder::new("identity", config.base)
        .db(Some(db))
        .router(app)
        .run()
        .await
}
