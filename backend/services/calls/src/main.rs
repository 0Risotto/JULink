use julink_common::{service::ServiceBuilder, telemetry};

use julink_calls::{
    clients::{IdentityClient, MessagingClient},
    config::CallsConfig,
    routes::router,
    state::CallsState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = CallsConfig::from_env()?;
    telemetry::init("calls", config.base.log_format);

    let database_url = config
        .base
        .database_url
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("DATABASE_URL is required for the calls service"))?;
    let db = julink_common::db::connect(database_url).await?;

    if config.run_migrations {
        sqlx::migrate!("./migrations").run(&db).await?;
    }

    let nats = match config.base.nats_url.as_deref() {
        Some(url) => match async_nats::connect(url).await {
            Ok(client) => Some(client),
            Err(error) => {
                tracing::warn!(%error, %url, "calls events disabled: NATS unavailable");
                None
            }
        },
        None => None,
    };

    let state = CallsState {
        db: db.clone(),
        identity: IdentityClient::new(&config.identity_url)?,
        messaging: MessagingClient::new(&config.messaging_url)?,
        nats,
        config: config.clone(),
    };

    let app = router(state);

    ServiceBuilder::new("calls", config.base)
        .db(Some(db))
        .router(app)
        .run()
        .await
}
