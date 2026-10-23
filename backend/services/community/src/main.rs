use julink_common::{service::ServiceBuilder, telemetry};

use julink_community::{config::CommunityConfig, routes::router, state::CommunityState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = CommunityConfig::from_env()?;
    telemetry::init("community", config.base.log_format);

    let database_url = config
        .base
        .database_url
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("DATABASE_URL is required for community"))?;
    let db = julink_common::db::connect(database_url).await?;

    if config.run_migrations {
        sqlx::migrate!("./migrations").run(&db).await?;
    }

    let state = CommunityState { db: db.clone() };
    let app = router(state);

    ServiceBuilder::new("community", config.base)
        .db(Some(db))
        .router(app)
        .run()
        .await
}
