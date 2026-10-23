use julink_common::{service::ServiceBuilder, telemetry};

use julink_content::{config::ContentConfig, routes::router, state::ContentState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = ContentConfig::from_env()?;
    telemetry::init("content", config.base.log_format);

    let database_url = config
        .base
        .database_url
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("DATABASE_URL is required for the content service"))?;
    let db = julink_common::db::connect(database_url).await?;

    if config.run_migrations {
        sqlx::migrate!("./migrations").run(&db).await?;
    }

    let state = ContentState { db: db.clone() };
    let app = router(state);

    ServiceBuilder::new("content", config.base)
        .db(Some(db))
        .router(app)
        .run()
        .await
}
