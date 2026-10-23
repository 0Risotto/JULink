use julink_common::{service::ServiceBuilder, telemetry};

use julink_gateway::{
    auth::JwtValidator, config::GatewayConfig, routes::router, state::GatewayState,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = GatewayConfig::from_env()?;
    telemetry::init("gateway", config.base.log_format);

    let client = julink_common::http::client();
    let jwt = JwtValidator::bootstrap(&config, &client).await?;

    let state = GatewayState {
        client,
        routes: config.routes.clone(),
        jwt,
    };

    let app = router(state);

    ServiceBuilder::new("gateway", config.base)
        .router(app)
        .run()
        .await
}
