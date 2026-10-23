use julink_common::{service::ServiceBuilder, telemetry};

use julink_realtime::{config::RealtimeConfig, routes::router, state::RealtimeState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = RealtimeConfig::from_env()?;
    telemetry::init("realtime", config.base.log_format);

    let state = RealtimeState::new(config.clone())?;

    if let Some(nats_url) = config.base.nats_url.clone() {
        tokio::spawn(julink_realtime::nats::run(state.clone(), nats_url));
    }

    let app = router(state);

    ServiceBuilder::new("realtime", config.base)
        .router(app)
        .run()
        .await
}
