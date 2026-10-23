use julink_common::{service::ServiceBuilder, telemetry};

use julink_search::{
    clients::{ContentClient, IdentityClient},
    config::SearchConfig,
    routes::router,
    state::SearchState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = SearchConfig::from_env()?;
    telemetry::init("search", config.base.log_format);

    let database_url = config
        .base
        .database_url
        .as_deref()
        .ok_or_else(|| anyhow::anyhow!("DATABASE_URL is required for the search service"))?;
    let db = julink_common::db::connect(database_url).await?;

    if config.run_migrations {
        sqlx::migrate!("./migrations").run(&db).await?;
    }

    let state = SearchState {
        db: db.clone(),
        identity: IdentityClient::new(&config.identity_url)?,
        content: ContentClient::new(&config.content_url)?,
        config: config.clone(),
    };

    if config.sync_enabled {
        tokio::spawn(julink_search::sync::run(state.clone()));
    }

    let app = router(state);

    ServiceBuilder::new("search", config.base)
        .db(Some(db))
        .router(app)
        .run()
        .await
}
