use crate::auth::JwtValidator;
use crate::routes::ServiceRoutes;

#[derive(Clone)]
pub struct GatewayState {
    pub client: reqwest::Client,
    pub routes: ServiceRoutes,
    pub jwt: JwtValidator,
}
