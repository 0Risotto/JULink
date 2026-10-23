use async_nats::Client;
use sqlx::PgPool;

use crate::{
    clients::{IdentityClient, MessagingClient},
    config::CallsConfig,
};

#[derive(Clone)]
pub struct CallsState {
    pub db: PgPool,
    pub identity: IdentityClient,
    pub messaging: MessagingClient,
    pub nats: Option<Client>,
    pub config: CallsConfig,
}
