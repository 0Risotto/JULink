use julink_common::{service::ServiceBuilder, telemetry};

use julink_notifications::{
    config::NotificationsConfig, messaging::MessagingClient, routes::router,
    state::NotificationsState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = NotificationsConfig::from_env()?;
    telemetry::init("notifications", config.base.log_format);

    let database_url = config
        .base
        .database_url
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("DATABASE_URL is required for notifications"))?;
    let db = julink_common::db::connect(database_url).await?;

    if config.run_migrations {
        sqlx::migrate!("./migrations").run(&db).await?;
    }

    let nats = match config.base.nats_url.as_deref() {
        Some(url) => match async_nats::connect(url).await {
            Ok(client) => Some(client),
            Err(error) => {
                tracing::warn!(%error, %url, "notification pushes disabled: NATS unavailable");
                None
            }
        },
        None => None,
    };

    let state = NotificationsState {
        db: db.clone(),
        messaging: MessagingClient::new(&config.messaging_url)?,
        nats,
        config: config.clone(),
    };

    if let Some(nats_url) = config.base.nats_url.clone() {
        tokio::spawn(julink_notifications::consumer::run(state.clone(), nats_url));
    }

    let app = router(state);

    ServiceBuilder::new("notifications", config.base)
        .db(Some(db))
        .router(app)
        .run()
        .await
}
