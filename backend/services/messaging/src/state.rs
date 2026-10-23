use sqlx::PgPool;

use crate::{config::MessagingConfig, identity::IdentityClient};

#[derive(Clone)]
pub struct MessagingState {
    pub db: PgPool,
    pub identity: IdentityClient,
    pub config: MessagingConfig,
}
