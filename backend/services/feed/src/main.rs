use julink_common::{service::ServiceBuilder, telemetry};

use julink_feed::{
    cache::FolloweeCache,
    clients::{ContentClient, IdentityClient, SocialClient},
    config::FeedConfig,
    routes::router,
    state::FeedState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = FeedConfig::from_env()?;
    telemetry::init("feed", config.base.log_format);

    let state = FeedState {
        social: SocialClient::new(&config.social_url)?,
        content: ContentClient::new(&config.content_url)?,
        identity: IdentityClient::new(&config.identity_url)?,
        cache: FolloweeCache::new(config.cache_ttl),
    };

    let app = router(state);

    ServiceBuilder::new("feed", config.base)
        .router(app)
        .run()
        .await
}
