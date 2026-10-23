use std::env;

use julink_common::config::BaseConfig;

use crate::routes::ServiceRoutes;

#[derive(Clone)]
pub struct GatewayConfig {
    pub base: BaseConfig,
    pub identity_url: String,
    pub routes: ServiceRoutes,
    pub issuer: String,
    pub jwt_public_key_pem: Option<String>,
}

impl GatewayConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let base = BaseConfig::from_env("gateway", 8080)?;
        let identity_url =
            env::var("IDENTITY_URL").unwrap_or_else(|_| "http://localhost:9000".to_string());
        let routes = ServiceRoutes::from_env(&identity_url);
        let issuer = env::var("JWT_ISSUER").unwrap_or_else(|_| "julink".to_string());
        let jwt_public_key_pem = env::var("JWT_PUBLIC_KEY_PEM")
            .ok()
            .map(|value| value.replace("\\n", "\n"));

        Ok(Self {
            base,
            identity_url,
            routes,
            issuer,
            jwt_public_key_pem,
        })
    }
}
