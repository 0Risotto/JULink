use std::sync::Arc;

use julink_common::{service::ServiceBuilder, telemetry};

use julink_social::{
    config::SocialConfig, identity::IdentityClient, routes::router, state::SocialState,
};
use neo4rs::Graph;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = SocialConfig::from_env()?;
    telemetry::init("social", config.base.log_format);

    let graph = match &config.neo4j_uri {
        Some(uri) => {
            let graph = Graph::new(uri, &config.neo4j_user, &config.neo4j_password).await?;
            julink_social::graph::ensure_schema(&graph).await?;
            tracing::info!(%uri, "connected to Neo4j");
            Some(Arc::new(graph))
        }
        None => {
            tracing::warn!("NEO4J_URI is not set; social starts without a graph");
            None
        }
    };

    let db = match &config.base.database_url {
        Some(url) => {
            let pool = julink_common::db::connect(url).await?;
            if config.run_migrations {
                sqlx::migrate!("./migrations").run(&pool).await?;
            }
            Some(pool)
        }
        None => {
            tracing::warn!("DATABASE_URL is not set; the social outbox is disabled");
            None
        }
    };

    if let (Some(pool), Some(nats_url)) = (db.clone(), config.base.nats_url.clone()) {
        tokio::spawn(julink_social::outbox::run(pool, nats_url));
    }

    let identity = IdentityClient::new(&config.identity_url)?;
    let state = SocialState {
        graph,
        db: db.clone(),
        identity,
        config: config.clone(),
    };

    let app = router(state);

    ServiceBuilder::new("social", config.base)
        .db(db)
        .router(app)
        .run()
        .await
}
