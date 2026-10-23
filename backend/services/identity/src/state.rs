use std::sync::Arc;

use sqlx::PgPool;

use crate::auth::AuthKeys;
use crate::config::IdentityConfig;
use crate::email::EmailService;
use crate::otp::OtpHasher;

#[derive(Clone)]
pub struct IdentityState {
    pub db: PgPool,
    pub keys: Arc<AuthKeys>,
    pub otp: OtpHasher,
    pub email: EmailService,
    pub config: IdentityConfig,
}
