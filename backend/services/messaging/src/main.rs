use julink_common::{service::ServiceBuilder, telemetry};

use julink_messaging::{
    config::MessagingConfig, identity::IdentityClient, routes::router, state::MessagingState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = MessagingConfig::from_env()?;
    telemetry::init("messaging", config.base.log_format);

    let database_url = config
        .base
        .database_url
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("DATABASE_URL is required for the messaging service"))?;
    let db = julink_common::db::connect(database_url).await?;

    if config.run_migrations {
        sqlx::migrate!("./migrations").run(&db).await?;
    }

    if let Some(nats_url) = config.base.nats_url.clone() {
        tokio::spawn(julink_messaging::outbox::run(db.clone(), nats_url));
    }

    let state = MessagingState {
        db: db.clone(),
        identity: IdentityClient::new(&config.identity_url)?,
        config: config.clone(),
    };

    let app = router(state);

    ServiceBuilder::new("messaging", config.base)
        .db(Some(db))
        .router(app)
        .run()
        .await
}
